import { Server } from 'socket.io'
import { currentTimeReadable, unixTimeReadable } from '@ethereum_net_stats/readable_time'

import type { FieldPacket, Pool, RowDataPacket } from '@ethereum_net_stats/get_mysql_connection'
import type { latestBlockData, responseLatestData } from '../types/types'
import { getLatest10TransactionData } from './getLatest10TransactionData.js'

const sendLatestOneBlockData = async (
  socketServer: Server,
  dataPublisherId: string,
  mysqlConnection: Pool,
  addressCheckedBlockNumber: number,
): Promise<void> => {
  let mysqlRes: [any, FieldPacket[]]

  // 引数で渡されたaddressCheckedBlockNumberに対応するレコードをblockDataから取得できるかチェックするためのループ
  // ほとんどの場合はaddressCheckedであればblockDataにも存在するが、たまに存在しない時があるのでチェック
  while (true) {
    mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                              FROM ethereum.blockData
                                                              WHERE number = ${addressCheckedBlockNumber}`)

    if (mysqlRes[0][0] === undefined) {
      continue
    }

    if (mysqlRes[0][0].number > 0) {
      break
    }
  }

  // 再度、blockDataから、引数addressCheckedBlockNumberに対応するレコードと一つ前のブロックナンバーのレコードを取得
  // 古いブロックナンバーが戻り値の配列の先頭(mysqlRes[0][0])になる。
  mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                            FROM ethereum.blockData
                                                            WHERE number IN (${
                                                              addressCheckedBlockNumber - 1
                                                            }, ${addressCheckedBlockNumber})`)

  // コードの見やすさのためにクエリの結果をlatestTwoBlockDataに代入
  let latestTwoBlockData = mysqlRes[0]

  // 最新のブロックナンバーと１つ前のブロックナンバーの時間差を計算
  let timestampDiff = latestTwoBlockData[1].timestamp - latestTwoBlockData[0].timestamp

  // 最新のブロックナンバーのtpsを計算
  let tps =
    latestTwoBlockData[1].transactions.length === 0
      ? 0
      : latestTwoBlockData[1].transactions.split(',').length / timestampDiff

  // addressCheckedBlockNumberのnewAddressCountを取得
  mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(
    `SELECT COUNT(*) AS newAddressCount
     FROM javaAddressList
     WHERE showUpBlock = ${addressCheckedBlockNumber}`,
  )

  // コードの見やすさのためにクエリの結果をnewAddressCountに代入
  let newAddressCount = mysqlRes[0][0].newAddressCount

  // latestBlockData型のデータを作成
  let latestOneBlockData: latestBlockData = [
    { ...latestTwoBlockData[1], timestampDiff, tps, newAddressCount },
  ]

  // responseLatestData型のデータを作成
  let responseLatestOneBlockData: responseLatestData = {
    latestBlockData: latestOneBlockData,
  }

  // responseLatestOneBlockData.latestTransactionDataの生成
  // latestTransactionDataには、トランザクションを最新のブロックに含まれる分から１０個格納する
  // responseLatestOneBlockData.latestTransactionDataにlatest10TransactionDataを代入
  responseLatestOneBlockData.latestTransactionData = await getLatest10TransactionData(
    latestOneBlockData[0].number,
  )

  // dataPoolServerにresponseLatestOneBlockDataを送信
  if (responseLatestOneBlockData.latestTransactionData !== undefined) {
    socketServer.to(dataPublisherId).emit('sendLatestOneBlockData', responseLatestOneBlockData)
    console.log(
      `${currentTimeReadable()} | Emit : 'latestOneData' | To : dataPoolServer | blockNumber : ${
        responseLatestOneBlockData.latestBlockData[0].number
      } | blockTime : ${unixTimeReadable(responseLatestOneBlockData.latestBlockData[0].timestamp)}`,
    )
  } else {
    console.log(
      `${currentTimeReadable()} | Could not get latestTransactionData. Skip emit the 'sendLatestOneBlockData' event.'`,
    )
  }
}
export default sendLatestOneBlockData
