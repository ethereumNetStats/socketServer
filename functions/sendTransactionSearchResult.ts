import { currentTimeReadable } from '@ethereum_net_stats/readable_time'
import {
  requestTransactionSearch,
  transactionDetail,
  transactionSearchResult,
} from '../types/types'
import { gethDockerHttpClient } from '@ethereum_net_stats/get_geth_connections'
import { Server } from 'socket.io'

const sendTransactionSearchResult = async (
  requestTransactionSearch: requestTransactionSearch,
  socketServer: Server,
  dataPublisherId: string,
) => {
  // フロントエンドから送信されたトランザクションハッシュがnullでない場合のみ
  // 処理を実行して検索結果をフロントエンドに送信する
  if (!requestTransactionSearch.transactionHash !== null) {
    console.log(
      `${currentTimeReadable()} | Receive : 'requestTransactionDetail' | From : dataPoolServer | Frontend ID : ${
        requestTransactionSearch.frontendId
      } | Transaction hash : ${requestTransactionSearch.transactionHash}`,
    )

    // ユーザーが詳細を要求したトランザクションハッシュを受信データから抽出して、当該トランザクションハッシュのトランザクションデータをデータベースから取得する
    let gethRes: transactionDetail | null = await gethDockerHttpClient.getTransaction(
      requestTransactionSearch.transactionHash,
    )

    // フロントエンドに送信する応答データの生成
    let transactionSearchResult: transactionSearchResult = {
      transactionDetail: gethRes,
      frontendId: requestTransactionSearch.frontendId,
      requestedTransactionHash: requestTransactionSearch.transactionHash,
      error: gethRes ? 'noError' : 'noTransaction',
    }

    console.log(
      `${currentTimeReadable()} | Emit : 'sendTransactionSearchResult' | To : dataPoolServer | Frontend ID : ${
        transactionSearchResult.frontendId
      } | Error : ${transactionSearchResult.error}`,
    )

    socketServer.to(dataPublisherId).emit('sendTransactionSearchResult', transactionSearchResult)
  } else {
    console.log(
      `${currentTimeReadable()} | Receive : 'requestTransactionDetail' | From : dataPublisher | Frontend ID : ${
        requestTransactionSearch.frontendId
      } | Transaction hash : ${
        requestTransactionSearch.transactionHash
      } | Error : noTransactionHash`,
    )
  }
}

export default sendTransactionSearchResult
