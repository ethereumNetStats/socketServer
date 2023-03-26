import 'dotenv/config'

import {
  getMysqlConnection,
  Pool,
  RowDataPacket,
} from '@ethereum_net_stats/get_mysql_connection'

import type {
  blockData,
  arrayOfBlockData,
  newAddressCountInBlockArray,
  newAddressCountInBlock,
  blockDataWithNewAddressCountArray,
  latestData,
} from '../types/types'

const mysqlConnection: Pool = await getMysqlConnection(false, false)

const getLatestData = async (): Promise<latestData> => {
  let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT number
                                                              FROM ethereum.blockData
                                                              ORDER BY number DESC LIMIT 1`)
  let latestBlockDataNumber: number = mysqlRes[0][0].number

  mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT showUpBlock
                                                          FROM ethereum.javaAddressList
                                                          ORDER BY showUpBlock DESC LIMIT 1`)
  let latestAddressListNumber: number = mysqlRes[0][0].showUpBlock

  if (latestAddressListNumber < latestBlockDataNumber) {
    console.log('latestAddressListNumber < latestBlockDataNumber')

    // latestAddressListNumberの最後のレコードのブロックナンバーの方が小さい場合は、javaAddressListからshowUpBlockの降順で11件取得
    // 1件多いのはtimestampの差分を計算するため
    mysqlRes = await mysqlConnection.query<
      RowDataPacket[0]
    >(`SELECT showUpBlock AS blockNumber, COUNT(address) AS newAddressCount
     FROM javaAddressList
     GROUP BY showUpBlock
     ORDER BY showUpBlock DESC LIMIT 11`)

    let newAddressCountInBlockArray: newAddressCountInBlockArray = mysqlRes[0]

    // 次にlatestAddressListに対応するブロックデータをethereum.blockDataから取得
    mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                            FROM ethereum.blockData
                                                            WHERE number IN (${newAddressCountInBlockArray
                                                              .map(
                                                                (
                                                                  elem: newAddressCountInBlock,
                                                                ) =>
                                                                  elem.blockNumber,
                                                              )
                                                              .join(',')})`)

    let latestBlockData: arrayOfBlockData = mysqlRes[0]

    // newAddressCountInBlockArrayとlatestBlockDataの結合結果の配列を作成
    let blockDataWithNewAddressCountArray: blockDataWithNewAddressCountArray =
      []

    // newAddressCountInBlockArrayとlatestBlockDataをnumberとblockNumberで対応させて結合
    latestBlockData.map((blockData: blockData) => {
      newAddressCountInBlockArray.map(
        (newAddressCountInBlock: newAddressCountInBlock) => {
          if (blockData.number === newAddressCountInBlock.blockNumber) {
            blockDataWithNewAddressCountArray.push({
              ...blockData,
              newAddressCount: newAddressCountInBlock.newAddressCount,
            })
          }
        },
      )
    })

    // blockDataWithNewAddressCountArrayのtimestampの差分を追加して戻り値として格納する配列の初期化
    let latestData: latestData = []

    // blockDataWithNewAddressCountArrayのtimestampの差分をtimestampDiffに追加
    // 更にtransactionの数をtimestampDiffで割った値をtpsとして追加
    blockDataWithNewAddressCountArray.map(
      (
        blockDataWithNewAddressCount: blockDataWithNewAddressCountArray[0],
        index: number,
      ) => {
        if (index === 0) {
          latestData.push({
            ...blockDataWithNewAddressCount,
            timestampDiff: 0,
            tps: 0,
          })
        } else {
          latestData.push({
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

    return latestData
  } else {
    console.log('latestAddressListNumber >= latestBlockDataNumber')

    // blockDataの最後のレコードのブロックナンバーがjavaAddressListの最後のブロックナンバー以下の場合は、
    // blockDataの最後の１０レコードに対応するブロックナンバーのnewAddressをethereum.javaAddressListからブロックナンバー毎にカウントして取得
    mysqlRes = await mysqlConnection.query<
      RowDataPacket[0]
    >(`SELECT b.number                  AS blockNumber,
            COUNT(DISTINCT j.address) AS newAddressCount
     FROM blockData b
              LEFT JOIN javaAddressList j ON b.number = j.showUpBlock
     GROUP BY blockNumber
     ORDER BY blockNumber DESC LIMIT 10`)

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
    let blockDataWithNewAddressCountArray: blockDataWithNewAddressCountArray =
      []

    // newAddressCountInBlockArrayとlatestBlockDataをnumberとblockNumberで対応させて結合
    latestBlockData.map((blockData: blockData) => {
      newAddressCountInBlockArray.map(
        (newAddressCountInBlock: newAddressCountInBlock) => {
          if (blockData.number === newAddressCountInBlock.blockNumber) {
            blockDataWithNewAddressCountArray.push({
              ...blockData,
              newAddressCount: newAddressCountInBlock.newAddressCount,
            })
          }
        },
      )
    })

    // blockDataWithNewAddressCountArrayのtimestampの差分を追加して戻り値として格納する配列の初期化
    let latestData: latestData = []

    // blockDataWithNewAddressCountArrayのtimestampの差分をtimestampDiffに追加
    // 更にtransactionの数をtimestampDiffで割った値をtpsとして追加
    blockDataWithNewAddressCountArray.map(
      (
        blockDataWithNewAddressCount: blockDataWithNewAddressCountArray[0],
        index: number,
      ) => {
        if (index === 0) {
          latestData.push({
            ...blockDataWithNewAddressCount,
            timestampDiff: 0,
            tps: 0,
          })
        } else {
          latestData.push({
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

    return latestData
  }
}

export default getLatestData
