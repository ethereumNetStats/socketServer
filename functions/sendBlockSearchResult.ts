import { currentTimeReadable } from '@ethereum_net_stats/readable_time'
import { BlockTransactionString } from 'web3-eth'
import { gethDockerHttpClient } from '@ethereum_net_stats/get_geth_connections'
import {
  BlockTransactionStringWithMixHash,
  requestBlockSearch,
  resultOfBlockSearch,
} from '../types/types'
import { Server } from 'socket.io'

const sendBlockSearchResult = async (
  requestBlockSearch: requestBlockSearch,
  socketServer: Server,
  dataPublisherId: string,
) => {
  console.log(
    `${currentTimeReadable()} | Receive : 'requestBlockSearch' | From : dataPublisher | Frontend ID : ${
      requestBlockSearch.frontendId
    } | Search number : ${requestBlockSearch.blockNumber}`,
  )

  // ユーザーが入力したブロックナンバーが整数の場合のみ処理をする
  // 整数でない場合は何もせずに終了する
  if (Number.isInteger(requestBlockSearch.blockNumber)) {
    // ユーザーが入力したブロックナンバーを含むブロックデータをGethから取得
    let gethRes: BlockTransactionString = await gethDockerHttpClient.getBlock(
      requestBlockSearch.blockNumber,
    )

    // gethResに含まれるwithdrawals, withdrawalsRootフィールドを削除
    // これは、シャンハイアップグレード以前には存在しないフィールドだから
    // 公式の型定義がアップデートされていないので(@web3 v1.9.0)ts-ignoreで無視する
    // @ts-ignore
    delete gethRes.withdrawals
    // @ts-ignore
    delete gethRes.withdrawalsRoot

    // web3@1.9.0でweb3.eth.getBlock()の戻り値の型定義からmixHashフィールドが削除されているため、
    // mixHashフィールドを追加した型を定義し、gethResを型変換する
    let gethResWithMixHash: BlockTransactionStringWithMixHash = {
      ...gethRes,
    } as BlockTransactionStringWithMixHash

    // フロントエンドに送信する応答データの生成
    let resultOfBlockSearch: resultOfBlockSearch = {
      ...gethResWithMixHash,
      frontendId: requestBlockSearch.frontendId,
    }

    // 検索結果をデータパブリッシャーに送信
    socketServer.to(dataPublisherId).emit('resultOfBlockSearch', resultOfBlockSearch)
    console.log(`${currentTimeReadable()} | Emit : 'resultOfBlockSearch' | To : dataPublisher`)
  }
}

export default sendBlockSearchResult
