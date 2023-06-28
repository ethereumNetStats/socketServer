import { transactionDetail } from '../types/types'
import { gethDockerHttpClient } from '@ethereum_net_stats/get_geth_connections'
import { BlockTransactionString } from 'web3-eth'
import { currentTimeReadable } from '@ethereum_net_stats/readable_time'

const getLatest10TransactionData = async (
  latestBlockNumber: number,
): Promise<Array<transactionDetail> | undefined> => {
  // 返り値となるlatest10TransactionDataを定義
  let latest10TransactionData: Array<transactionDetail> = []

  // 引数latestBlockNumberをループの初期値として設定
  for (let i = latestBlockNumber; i > 0; i--) {
    let blockData: BlockTransactionString | undefined = undefined

    // blockNumberのブロックデータをgethDockerHttpClientで取得
    // gethとのコネクションが切れている場合があるのでtry-catchでエラーをキャッチ
    try {
      blockData = await gethDockerHttpClient.getBlock(i)
    } catch (e) {
      console.log(
        `${currentTimeReadable()} | Error has occurred at gethDockerHttpClient.getBlock(${i})`,
      )
      console.log(`${currentTimeReadable()} | ${e}`)
      break
    }

    // blockDataを取得できたときはblockDataのトランザクションを取得していく
    if (blockData !== undefined) {
      for (const transactionHash of blockData.transactions) {
        // トランザクションの詳細をgethDockerHttpClientで取得
        // gethとのコネクションが切れている場合があるのでtry-catchでエラーをキャッチ
        // エラーが出た場合はlatest10TransactionDataには何も追加しない。
        try {
          let transactionDetail = await gethDockerHttpClient.getTransaction(transactionHash)

          // latest10TransactionDataにtransactionDetailを追加
          latest10TransactionData.push(transactionDetail)
        } catch (e) {
          console.log(
            `${currentTimeReadable()} | Error has occurred at gethDockerHttpClient.getTransaction(${transactionHash})`,
          )
          console.log(`${currentTimeReadable()} | ${e}`)
          break
        }

        // latest10TransactionDataが10になったらループを抜ける
        if (latest10TransactionData.length === 10) {
          break
        }
      }

      // latest10TransactionDataが10になったらループを抜ける
      if (latest10TransactionData.length === 10) {
        break
      }
    }
  }

  // gethとのコネクションが切れていてlatest10TransactionDataを10個取得できていない場合はundefinedを返す
  if (latest10TransactionData.length !== 10) {
    return undefined
  } else if (latest10TransactionData.length === 10) {
    return latest10TransactionData
  }
}

export { getLatest10TransactionData }
