import { currentTimeReadable } from '@ethereum_net_stats/readable_time'
import { Pool, RowDataPacket } from '@ethereum_net_stats/get_mysql_connection'
import { blockList, requestBlockListPageByBlockNumber } from '../types/types'
import { Server } from 'socket.io'

const sendBlockListPageByBlockNumber = async (
  requestBlockListPageByBlockNumber: requestBlockListPageByBlockNumber,
  mysqlConnection: Pool,
  socketServer: Server,
  dataPublisherId: string,
) => {
  console.log(
    `${currentTimeReadable()} | Input block number : ${
      requestBlockListPageByBlockNumber.blockNumber
    }`,
  )

  // １ページ当たりの表示データ数の定義
  const itemsPerPage: number = 25

  // 最初にデータベースにおける最新のブロックナンバーを取得する
  let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT number
                                                                FROM ethereum.blockData
                                                                ORDER BY number DESC
                                                                LIMIT 1`)

  // データベースの応答データから最新のブロックナンバーを抽出
  let latestBlockNumber: number = mysqlRes[0][0].number

  console.log(`${currentTimeReadable()} | latestBlockNumber : ${latestBlockNumber}`)

  // 最新のブロックナンバーと１ページ当たりの表示データ数からトータルページ数を計算
  let totalPage: number = Math.ceil(latestBlockNumber / itemsPerPage)

  console.log(`${currentTimeReadable()} | totalPage : ${totalPage}`)

  // ユーザーが入力したブロック番号を含むページを特定するための変数の定義
  let pageNumber: number = 1
  let topBlockNumber: number = latestBlockNumber
  let bottomBlockNumber: number = topBlockNumber - itemsPerPage

  // ユーザーが入力したブロック番号を含むページと、当該ページの最初及び最後のブロックナンバーを特定
  while (
    !(
      requestBlockListPageByBlockNumber.blockNumber <= topBlockNumber &&
      requestBlockListPageByBlockNumber.blockNumber > bottomBlockNumber
    )
  ) {
    topBlockNumber -= itemsPerPage
    bottomBlockNumber -= itemsPerPage
    ++pageNumber
  }

  console.log(`${currentTimeReadable()} | pageNumber : ${pageNumber}`)
  console.log(`${currentTimeReadable()} | topBlockNumberTest : ${topBlockNumber}`)
  console.log(`${currentTimeReadable()} | bottomBlockNumberTest : ${bottomBlockNumber}`)

  // 特定したページに含まれるブロックデータをデータベースから取得
  mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                            FROM ethereum.blockData
                                                            WHERE number > ${bottomBlockNumber}
                                                              AND number <= ${topBlockNumber}
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
  blockList.currentPage = pageNumber
  blockList.topBlockNumber = topBlockNumber
  blockList.lastBlockNumber = bottomBlockNumber
  blockList.itemsPerPage = itemsPerPage
  blockList.pageOffset = pageNumber
  blockList.frontendId = requestBlockListPageByBlockNumber.frontendId

  // 応答データをdataPoolServerに送信
  socketServer.to(dataPublisherId).emit('sendBlockList', blockList)
  console.log(`${currentTimeReadable()} | Emit : 'sendBlockList' | To : socketServer`)
}

export default sendBlockListPageByBlockNumber
