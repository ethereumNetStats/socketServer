import { currentTimeReadable } from '@ethereum_net_stats/readable_time'
import type { Pool, RowDataPacket } from '@ethereum_net_stats/get_mysql_connection'
import type { requestBlockList, blockList } from '../types/types'
import type { Server } from 'socket.io'

const sendBlockList = async (
  requestBlockList: requestBlockList,
  mysqlConnection: Pool,
  socketServer: Server,
  dataPublisherId: string,
) => {
  console.log(`${currentTimeReadable()} | Receive : 'requestBlockList' | From : dataPoolServer`)

  // １ページ当たりの表示データ数の定義
  const itemsPerPage: number = 25

  // 最初にデータベースにおける最新のブロックナンバーを取得する
  let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT number
                                                                FROM ethereum.blockData
                                                                ORDER BY number DESC
                                                                LIMIT 1`)

  // データベースの応答データから最新のブロックナンバーを抽出
  let latestBlockNumber: number = mysqlRes[0][0].number

  // 最新のブロックナンバーと１ページ当たりの表示データ数からトータルページ数を計算
  let totalPage: number = Math.ceil(latestBlockNumber / itemsPerPage)

  // 要求されたページの最初のブロックナンバーを計算
  let topBlockNumber: number = latestBlockNumber - itemsPerPage * requestBlockList.pageOffset

  // 要求されたページの最後のブロックナンバーを計算
  let lastBlockNumber: number = topBlockNumber - itemsPerPage

  // 要求されたページの全てのブロックデータをデータベースから取得
  mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                            FROM ethereum.blockData
                                                            WHERE number >= ${lastBlockNumber}
                                                              AND number < ${topBlockNumber}
                                                            ORDER BY number DESC`)

  // 応答データを格納する変数の初期化
  let blockList: blockList = {
    itemsPerPage: 0,
    lastBlockNumber: 0,
    latestBlockNumber: 0,
    list: [],
    pageOffset: 0,
    topBlockNumber: 0,
    totalPage: 0,
    currentPage: 0,
    frontendId: '',
  }

  // 応答データに実データを代入
  blockList.list = mysqlRes[0]
  blockList.latestBlockNumber = latestBlockNumber
  blockList.totalPage = totalPage
  blockList.currentPage = requestBlockList.pageOffset
  blockList.topBlockNumber = topBlockNumber
  blockList.lastBlockNumber = lastBlockNumber
  blockList.itemsPerPage = itemsPerPage
  blockList.pageOffset = requestBlockList.pageOffset
  blockList.frontendId = requestBlockList.frontendId

  // 応答データを送信
  socketServer.to(dataPublisherId).emit('sendBlockList', blockList)
  console.log(`${currentTimeReadable()} | Emit : 'responseBlockList' | To : dataPoolServer`)
}

export default sendBlockList
