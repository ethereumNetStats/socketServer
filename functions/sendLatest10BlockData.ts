// 環境変数の読み込み
import 'dotenv/config'

// ライブラリのインポート
import { Server } from 'socket.io'
import { gethDockerHttpClient } from '@ethereum_net_stats/get_geth_connections'

// 型定義のインポート
import type { Pool, RowDataPacket } from '@ethereum_net_stats/get_mysql_connection'
import type {
  blockData,
  arrayOfBlockData,
  newAddressCountInBlockArray,
  newAddressCountInBlock,
  blockDataWithNewAddressCountArray,
  latestBlockData,
  transactionDetail,
} from '../types/types'
import type { responseLatestData } from '../types/types'

const sendLatest10BlockData = async (
  socketServer: Server,
  dataPublisherId: string,
  mysqlConnection: Pool,
): Promise<void> => {
  let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT number
                                                                FROM ethereum.blockData
                                                                ORDER BY number DESC
                                                                LIMIT 1`)
  let latestBlockDataNumber: number = mysqlRes[0][0].number

  mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT showUpBlock
                                                            FROM ethereum.javaAddressList
                                                            ORDER BY showUpBlock DESC
                                                            LIMIT 1`)
  let latestAddressListNumber: number = mysqlRes[0][0].showUpBlock

  // blockDataに最新のブロックデータが書き込まれていない場合の処理
  if (latestAddressListNumber < latestBlockDataNumber) {
    // console.log('latestAddressListNumber < latestBlockDataNumber')

    // latestAddressListNumberの最後のレコードのブロックナンバーの方が小さい場合は、javaAddressListからshowUpBlockの降順で11件取得
    // 1件多いのはtimestampの差分を計算するため
    mysqlRes = await mysqlConnection.query<
      RowDataPacket[0]
    >(`SELECT showUpBlock AS blockNumber, COUNT(address) AS newAddressCount
       FROM ethereum.javaAddressList
       GROUP BY showUpBlock
       ORDER BY showUpBlock DESC
       LIMIT 11`)

    let newAddressCountInBlockArray: newAddressCountInBlockArray = mysqlRes[0]

    // 次にnewAddressCountInBlockArrayに対応するブロックデータをethereum.blockDataから取得
    mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                              FROM ethereum.blockData
                                                              WHERE number IN (${newAddressCountInBlockArray
                                                                .map(
                                                                  (elem: newAddressCountInBlock) =>
                                                                    elem.blockNumber,
                                                                )
                                                                .join(',')})`)

    let latestBlockData: arrayOfBlockData = mysqlRes[0]

    // newAddressCountInBlockArrayとlatestBlockDataの結合結果の配列を作成
    let blockDataWithNewAddressCountArray: blockDataWithNewAddressCountArray = []

    // newAddressCountInBlockArrayとlatestBlockDataをnumberとblockNumberで対応させて結合
    latestBlockData.map((blockData: blockData) => {
      newAddressCountInBlockArray.map((newAddressCountInBlock: newAddressCountInBlock) => {
        if (blockData.number === newAddressCountInBlock.blockNumber) {
          blockDataWithNewAddressCountArray.push({
            ...blockData,
            newAddressCount: newAddressCountInBlock.newAddressCount,
          })
        }
      })
    })

    // blockDataWithNewAddressCountArrayのtimestampの差分を追加して戻り値として格納する配列の初期化
    let latest10BlockData: latestBlockData = []

    // blockDataWithNewAddressCountArrayのtimestampの差分をtimestampDiffに追加
    // 更にtransactionの数をtimestampDiffで割った値をtpsとして追加
    blockDataWithNewAddressCountArray.map(
      (blockDataWithNewAddressCount: blockDataWithNewAddressCountArray[0], index: number) => {
        if (index === 0) {
          latest10BlockData.push({
            ...blockDataWithNewAddressCount,
            timestampDiff: 0,
            tps: 0,
          })
        } else {
          latest10BlockData.push({
            ...blockDataWithNewAddressCount,
            timestampDiff:
              blockDataWithNewAddressCount.timestamp -
              blockDataWithNewAddressCountArray[index - 1].timestamp,
            tps:
              (blockDataWithNewAddressCount.transactions.length === 0
                ? 0
                : blockDataWithNewAddressCount.transactions.split(',').length) /
              (blockDataWithNewAddressCount.timestamp -
                blockDataWithNewAddressCountArray[index - 1].timestamp),
          })
        }
      },
    )

    let responseLatest10BlockData: responseLatestData = {
      latestBlockData: latest10BlockData,
    }

    let latest10Transactions: Array<transactionDetail> = []

    // latest10BlockDataに格納されているブロックデータのブロックナンバーの降順に
    // 最新のトランザクションデータを１０個までgethDockerHttpClientを使って取得
    for (const block of latest10BlockData) {
      for (const transactionHash of block.transactions.split(',')) {
        // transactionHashが空文字の場合は処理をスキップ
        if (transactionHash === '') {
          continue
        }
        latest10Transactions.push(await gethDockerHttpClient.getTransaction(transactionHash))
        // 最新のトランザクションデータが１０個になったら処理を終了する
        if (latest10Transactions.length >= 10) {
          break
        }
      }
      // 最新のブロックデータのトランザクション数が１０個未満の場合は、次のブロックデータのトランザクションを取得する
      // 次のブロックのトランザクションを処理しているときにlatest10Transactionsの長さが１０個になった場合は、処理を終了する
      if (latest10Transactions.length >= 10) {
        break
      }
    }

    // 最新のトランザクションデータをresponseLatest10BlockData.latestTransactionDataに格納
    responseLatest10BlockData.latestTransactionData = latest10Transactions

    socketServer.to(dataPublisherId).emit('sendLatest10BlockData', responseLatest10BlockData)
  } else {
    // console.log('latestAddressListNumber >= latestBlockDataNumber')

    // blockDataの最後のレコードのブロックナンバーがjavaAddressListの最後のブロックナンバー以下の場合は、
    // blockDataの最後の１０レコードに対応するブロックナンバーのnewAddressをethereum.javaAddressListからブロックナンバー毎にカウントして取得
    mysqlRes = await mysqlConnection.query<
      RowDataPacket[0]
    >(`SELECT b.number                  AS blockNumber,
              COUNT(DISTINCT j.address) AS newAddressCount
       FROM ethereum.blockData b
                LEFT JOIN ethereum.javaAddressList j ON b.number = j.showUpBlock
       GROUP BY blockNumber
       ORDER BY blockNumber DESC
       LIMIT 10`)

    let newAddressCountInBlockArray: newAddressCountInBlockArray = mysqlRes[0]

    // latestBlockDataに対応するブロックデータをethereum.blockDataから取得
    mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                              FROM ethereum.blockData
                                                              WHERE number IN (${newAddressCountInBlockArray
                                                                .map(
                                                                  (
                                                                    newAddressCountInBlock: newAddressCountInBlock,
                                                                  ) =>
                                                                    newAddressCountInBlock.blockNumber,
                                                                )
                                                                .join(',')})`)

    let latestBlockData: arrayOfBlockData = mysqlRes[0]

    // latestAddressListとlatestBlockDataの結合結果の配列を作成
    let blockDataWithNewAddressCountArray: blockDataWithNewAddressCountArray = []

    // newAddressCountInBlockArrayとlatestBlockDataをnumberとblockNumberで対応させて結合
    latestBlockData.map((blockData: blockData) => {
      newAddressCountInBlockArray.map((newAddressCountInBlock: newAddressCountInBlock) => {
        if (blockData.number === newAddressCountInBlock.blockNumber) {
          blockDataWithNewAddressCountArray.push({
            ...blockData,
            newAddressCount: newAddressCountInBlock.newAddressCount,
          })
        }
      })
    })

    // blockDataWithNewAddressCountArrayのtimestampの差分を追加して戻り値として格納する配列の初期化
    let latest10BlockData: latestBlockData = []

    // blockDataWithNewAddressCountArrayのtimestampの差分をtimestampDiffに追加
    // 更にtransactionの数をtimestampDiffで割った値をtpsとして追加
    blockDataWithNewAddressCountArray.map(
      (blockDataWithNewAddressCount: blockDataWithNewAddressCountArray[0], index: number) => {
        if (index === 0) {
          latest10BlockData.push({
            ...blockDataWithNewAddressCount,
            timestampDiff: 0,
            tps: 0,
          })
        } else {
          latest10BlockData.push({
            ...blockDataWithNewAddressCount,
            timestampDiff:
              blockDataWithNewAddressCount.timestamp -
              blockDataWithNewAddressCountArray[index - 1].timestamp,
            tps:
              (blockDataWithNewAddressCount.transactions.length === 0
                ? 0
                : blockDataWithNewAddressCount.transactions.split(',').length) /
              (blockDataWithNewAddressCount.timestamp -
                blockDataWithNewAddressCountArray[index - 1].timestamp),
          })
        }
      },
    )

    let responseLatest10BlockData: responseLatestData = {
      latestBlockData: latest10BlockData,
    }

    let latest10Transactions: Array<transactionDetail> = []

    // latest10BlockDataに格納されているブロックデータのブロックナンバーの降順に
    // 最新のトランザクションデータを１０個までgethDockerHttpClientを使って取得
    for (const block of latest10BlockData) {
      for (const transactionHash of block.transactions.split(',')) {
        // transactionHashが空文字の場合は処理をスキップ
        if (transactionHash === '') {
          continue
        }
        latest10Transactions.push(await gethDockerHttpClient.getTransaction(transactionHash))
        // 最新のトランザクションデータが１０個になったら処理を終了する
        if (latest10Transactions.length >= 10) {
          break
        }
      }
      // 最新のブロックデータのトランザクション数が１０個未満の場合は、次のブロックデータのトランザクションを取得する
      // そして、次のブロックのトランザクションを処理しているときにlatest10Transactionsの長さが１０個になった場合は、処理を終了する
      if (latest10Transactions.length >= 10) {
        break
      }
    }

    // responseLatest10BlockData.latestTransactionDataに最新のトランザクションデータを格納
    responseLatest10BlockData.latestTransactionData = latest10Transactions

    socketServer.to(dataPublisherId).emit('sendLatest10BlockData', responseLatest10BlockData)
  }
}

export default sendLatest10BlockData
