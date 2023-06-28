// 環境変数のインポート
import 'dotenv/config'

// パッケージのインポート
import { Server } from 'socket.io'

// 自作パッケージのインポート
import { currentTimeReadable, unixTimeReadable } from '@ethereum_net_stats/readable_time'
import { getMysqlConnection, RowDataPacket } from '@ethereum_net_stats/get_mysql_connection'
// ソケットイベント定義のインポート
import type { ClientToServerEvents, ServerToClientEvents } from './types/socketEvents'

// 型定義のインポート
import type { Pool } from '@ethereum_net_stats/get_mysql_connection'
import type {
  basicNetStats,
  blockNumberWithTimestamp,
  requestBlockDetail,
  requestBlockList,
  requestBlockListPageByBlockNumber,
  requestTransactionSearch,
  responseBlockDetail,
  socketClientAttribute,
  requestBlockSearch,
  attribute,
  numberOfAddress,
} from './types/types'

// 各ソケットイベント受信時の処理関数のインポート
import responseInitialMinutelyNetStats from './functions/responseInitialMinutelyNetStats.js'
import responseInitialHourlyNetStats from './functions/responseInitialHourlyNetStats.js'
import responseInitialDailyNetStats from './functions/responseInitialDailyNetStats.js'
import responseInitialWeeklyNetStats from './functions/responseInitialWeeklyNetStats.js'
import sendLatestOneBlockData from './functions/sendLatestOneBlockData.js'
import sendLatest10BlockData from './functions/sendLatest10BlockData.js'
import sendBlockList from './functions/sendBlockList.js'
import sendBlockListPageByBlockNumber from './functions/sendBlockListPageByBlockNumber.js'
import sendBlockSearchResult from './functions/sendBlockSearchResult.js'
import sendTransactionSearchResult from './functions/sendTransactionSearchResult.js'

// basicNetStatsとaddressCountの同期用クラス'ensureLatestNetStats'のインポート
import ensureLatestNetStats from './class/ensureLatestNetStats.js'
// 各時間レンジのensureLatestNetStatsのインスタンスの生成
let ensureLatestMinutelyNetStatsInstance: ensureLatestNetStats = new ensureLatestNetStats()
let ensureLatestHourlyNetStatsInstance: ensureLatestNetStats = new ensureLatestNetStats()
let ensureLatestDailyNetStatsInstance: ensureLatestNetStats = new ensureLatestNetStats()
let ensureLatestWeeklyNetStatsInstance: ensureLatestNetStats = new ensureLatestNetStats()
// 各時間レンジのensureLatestNetStatsのインスタンスの格納
const ensureLatestNetStatsInstances = {
  Minutely: ensureLatestMinutelyNetStatsInstance,
  Hourly: ensureLatestHourlyNetStatsInstance,
  Daily: ensureLatestDailyNetStatsInstance,
  Weekly: ensureLatestWeeklyNetStatsInstance,
}

const mysqlConnection: Pool = getMysqlConnection(false, true)

// socket.io-serverの起動
const socketServer: Server<ClientToServerEvents, ServerToClientEvents> = new Server(6000)

let blockDataRecorderId: string = ''
let addressRecorderId: string = ''
let dataPublisherId: string = ''

const blockDataRecorderName: string = 'blockDataRecorder'
const addressRecorderName: string = 'addressRecorder'
const dataPublisherName: string = 'dataPublisher'

// netStatsのattributeを格納する配列を定義
// これによりsocketイベントのエミットとリスンの処理をそれぞれまとめて記述できる
const netStatsAttributeArray: Array<attribute> = ['Minutely', 'Hourly', 'Daily', 'Weekly']
let netStatsRecorder: Array<socketClientAttribute> = []
let addressCounter: Array<socketClientAttribute> = []

// クライアントからのリクエストに対するレスポンス関数を格納するオブジェクト
const responseFunctions = {
  Minutely: responseInitialMinutelyNetStats,
  Hourly: responseInitialHourlyNetStats,
  Daily: responseInitialDailyNetStats,
  Weekly: responseInitialWeeklyNetStats,
}

// ソケットサーバーのイベント登録
socketServer.on('connection', (client) => {
  console.log(`${currentTimeReadable()} | Connect with a socket client. ID : ${client.id}`)

  // クライアントのnameに応じてidをイベントemitterとイベントリスナーの配列に追加
  if (client.handshake.query.attribute === 'netStatsRecorder') {
    console.log(`${currentTimeReadable()} | Connect : ${client.handshake.query.name}`)
    netStatsRecorder.push({ id: client.id, name: String(client.handshake.query.name) })
    console.log(`${currentTimeReadable()} | New netStatsRecorder is connected`)
    console.log(netStatsRecorder)
  }

  if (client.handshake.query.attribute === 'addressCounter') {
    console.log(`${currentTimeReadable()} | Connect : ${client.handshake.query.name}`)
    addressCounter.push({ id: client.id, name: String(client.handshake.query.name) })
    console.log(`${currentTimeReadable()} | New addressCounter is connected`)
    console.log(addressCounter)
  }

  // クライアントから接続されたときにソケットIDを記録
  switch (client.handshake.query.name) {
    case blockDataRecorderName:
      blockDataRecorderId = client.id
      console.log(`${currentTimeReadable()} | Connect : ${blockDataRecorderName}`)
      break

    case addressRecorderName:
      addressRecorderId = client.id
      console.log(`${currentTimeReadable()} | Connect : ${addressRecorderName}`)
      break

    case dataPublisherName:
      dataPublisherId = client.id
      console.log(`${currentTimeReadable()} | Connect : ${dataPublisherName}`)
      break
  }

  client.on('disconnect', () => {
    // 切断したクライアントのattributeがnetStatsRecorderの場合にidを配列netStatsRecorderから削除
    if (client.handshake.query.attribute === 'netStatsRecorder') {
      console.log(`${currentTimeReadable()} | Disconnect : ${client.handshake.query.name}`)
      netStatsRecorder = netStatsRecorder.filter((elem) => elem.id !== client.id)
    }
    // 切断したクライアントのattributeがaddressCounterの場合にidを配列addressCounterから削除
    if (client.handshake.query.attribute === 'addressCounter') {
      console.log(`${currentTimeReadable()} | Disconnect : ${client.handshake.query.name}`)
      addressCounter = addressCounter.filter((elem) => elem.id !== client.id)
    }
    console.log(`${currentTimeReadable()} | netStatsRecorderArray : ${netStatsRecorder}`)
    console.log(`${currentTimeReadable()} | addressCounterArray : ${addressCounter}`)
  })

  // blockDataRecorderが新しいブロックデータを記録した時の処理
  client.on('newBlockDataRecorded', async (blockNumberWithTimestamp: blockNumberWithTimestamp) => {
    console.log(
      `${currentTimeReadable()} | Receive : 'newBlockDataRecorded' | Block number : ${
        blockNumberWithTimestamp.blockNumber && blockNumberWithTimestamp.blockNumber
      } | Timestamp : ${
        blockNumberWithTimestamp.timestamp && unixTimeReadable(blockNumberWithTimestamp.timestamp)
      }`,
    )

    // 新しいブロックデータを各データレコーダーへ転送
    netStatsRecorder.map((elem) => {
      socketServer.to(elem.id).emit('newBlockDataRecorded', blockNumberWithTimestamp)
      console.log(
        `${currentTimeReadable()} | Proxy : blockDataRecorder -> ${
          elem.name
        } | Event : 'newBlockDataRecorded' | Block number : ${
          blockNumberWithTimestamp.blockNumber
        } | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`,
      )
    })
  })

  // addressRecorderがアドレスのチェックを完了した通知を各addressRecorderに転送
  client.on('addressChecked', (addressCheckedBlockNumber: number) => {
    console.log(
      `${currentTimeReadable()} | Receive : 'addressChecked' | Block number : ${addressCheckedBlockNumber}`,
    )

    addressCounter.map((elem) => {
      socketServer.to(elem.id).emit('addressChecked', addressCheckedBlockNumber)
      console.log(
        `${currentTimeReadable()} | Proxy : addressRecorder -> ${
          elem.name
        } | Event : 'addressChecked' | Block number : ${addressCheckedBlockNumber}`,
      )
    })

    // トップページ用の最新データをdataPublisherに送信
    // （イベントの流れ：geth(newBlockHeaders)->javaAddressRecorder(addressChecked)->socketServer）
    sendLatestOneBlockData(
      socketServer,
      dataPublisherId,
      mysqlConnection,
      addressCheckedBlockNumber,
    )
  })

  // dataPublisherから各時間レンジのbasicNetStatsの初期データを要求された時の処理の登録
  netStatsAttributeArray.map((attribute) => {
    client.on(`requestInitial${attribute}NetStats`, async () => {
      const responseFunction = responseFunctions[attribute]
      if (responseFunction) {
        await responseFunction(socketServer, dataPublisherId)
      }
    })
  })

  // 各時間レンジのbasicNetStatsRecorderから新しいbasicNetStatsを受信した時の処理の登録
  // 各時間レンジのaddressCounterから新しいaddressCounterを受信した時のイベントnew${attribute}AddressCountRecorded
  // とは排他的関係にあるため、同じ時間レンジについて同時に発生することはない。排他的関係はensureLatestNetStatsクラスで保証。
  netStatsAttributeArray.map((attribute) => {
    client.on(`new${attribute}BasicNetStatsRecorded`, (recordOfEthDB: basicNetStats) => {
      const ensureLatestNetStatsInstance = ensureLatestNetStatsInstances[attribute]
      if (ensureLatestNetStatsInstance) {
        ensureLatestNetStatsInstance.onBasicNetStatsRecorded(
          client,
          recordOfEthDB,
          attribute,
          dataPublisherId,
        )
      }
    })
  })

  // 各時間レンジのaddressCounterから新しいnumberOfAddressを受信した時の処理の登録
  // 各時間レンジのbasicNetStatsRecorderから新しいbasicNetStatsを受信した時のイベントnew${attribute}BasicNetStatsRecorded
  // とは排他的関係にあるため、同じ時間レンジについて同時に発生することはない。排他的関係はensureLatestNetStatsクラスで保証。
  netStatsAttributeArray.map((attribute) => {
    client.on(`new${attribute}AddressCountRecorded`, (numberOfAddress: numberOfAddress) => {
      const ensureLatestNetStatsInstance = ensureLatestNetStatsInstances[attribute]
      if (ensureLatestNetStatsInstance) {
        ensureLatestNetStatsInstance.onAddressCountRecorded(
          client,
          numberOfAddress,
          attribute,
          dataPublisherId,
        )
      }
    })
  })

  // dataPoolServerから"requestBlockDetail"イベントを受信した時の処理の登録
  // この処理によってユーザーが"Latest Blocks"セクションのブロックナンバーをクリックした時、または"Block list"ページのブロックナンバーをクリックした時
  // に表示する"Block detail"ページの情報が送信されます。
  client.on('requestBlockDetail', async (requestBlockDetail: requestBlockDetail) => {
    console.log(
      `${currentTimeReadable()} | Receive : 'requestBlockDetail' | From : dataPoolServer | FrontendId : ${
        requestBlockDetail.frontendId
      }`,
    )

    // ユーザーが詳細を要求したブロックナンバーを受信データから抽出して、当該ブロックナンバーのブロックデータをデータベースから取得する
    let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                  FROM ethereum.blockData
                                                                  WHERE number = ${requestBlockDetail.number}`)

    if (mysqlRes[0].length) {
      // データベースからの応答が空でない場合に応答データから必要なデータを抽出
      let responseBlockDetail: responseBlockDetail = mysqlRes[0][0]

      // ユーザーのsocket.io-clientのIDを応答データに追加
      responseBlockDetail.frontendId = requestBlockDetail.frontendId

      // データが空でないことを示すフラグを応答データに追加
      responseBlockDetail.noRecord = false

      // 応答データをdataPoolServerに送信
      socketServer.to(dataPublisherId).emit('responseBlockDetail', responseBlockDetail)
      console.log(
        `${currentTimeReadable()} | Emit : 'responseBlockDetail' | To : dataPoolServer | noRecord : ${
          responseBlockDetail.noRecord
        }`,
      )
    } else {
      // データベースからの応答が空の場合に空のデータを代入
      let responseBlockDetail: responseBlockDetail = mysqlRes[0][0]

      // ユーザーのsocket.io-clientのIDを応答データに追加
      responseBlockDetail.frontendId = requestBlockDetail.frontendId

      // データが空であることを示すフラグを応答データに追加
      responseBlockDetail.noRecord = true

      // 応答データをdataPoolServerに送信
      socketServer.to(dataPublisherId).emit('responseBlockDetail', responseBlockDetail)
      console.log(
        `${currentTimeReadable()} | Emit : 'responseBlockDetail' | To : dataPoolServer | noRecord : ${
          responseBlockDetail.noRecord
        }`,
      )
    }
  })

  // dataPublisherから"requestBlockList"イベントを受信した時の処理の登録
  // これによりユーザーが"View all blocks"をクリックした時の"Block list"ページの初期表示データが送信されます。
  // "Block list"ページの初期表示ではrequestBlockList.pageOffset=0を受け取ります。
  // また、ユーザーがページ番号をクリックした時の表示データもこの処理によって送信されます。
  // ユーザーがページ番号をクリックしたときはrequestBlockList.pageOffsetにクリックしたページ番号が設定されています。
  client.on(
    'requestBlockList',
    async (requestBlockList: requestBlockList) =>
      await sendBlockList(requestBlockList, mysqlConnection, socketServer, dataPublisherId),
  )

  // dataPoolServerから"requestBlockListPageByNumber"イベントを受信した時の処理の登録
  // これにより"Block list"ページでユーザーが入力したブロックナンバーのブロック情報を含むページのデータが送信されます。
  client.on(
    'requestBlockListPageByBlockNumber',
    async (requestBlockListPageByBlockNumber: requestBlockListPageByBlockNumber) =>
      await sendBlockListPageByBlockNumber(
        requestBlockListPageByBlockNumber,
        mysqlConnection,
        socketServer,
        dataPublisherId,
      ),
  )

  // 'requestTransactionSearch'をデータパブリッシャーから受け取った時の処理
  client.on(
    'requestTransactionSearch',
    async (requestTransactionSearch: requestTransactionSearch) =>
      sendTransactionSearchResult(requestTransactionSearch, socketServer, dataPublisherId),
  )

  client.on(
    'requestLatest10BlockData',
    async (): Promise<void> =>
      sendLatest10BlockData(socketServer, dataPublisherId, mysqlConnection),
  )

  // 'requestBlockSearch'をデータパブリッシャーから受け取った時の処理
  client.on('requestBlockSearch', async (requestBlockSearch: requestBlockSearch) =>
    sendBlockSearchResult(requestBlockSearch, socketServer, dataPublisherId),
  )
})
