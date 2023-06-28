import 'dotenv/config'

import { currentTimeReadable } from '@ethereum_net_stats/readable_time'
import { getMysqlConnection, Pool, RowDataPacket } from '@ethereum_net_stats/get_mysql_connection'
import type { Server } from 'socket.io'
import { netStatsArray } from '../types/types'

const mysqlConnection: Pool = getMysqlConnection(false, true)

const responseInitialDailyNetStats = async (
  socketServer: Server,
  dataPoolServerId: string,
): Promise<void> => {
  console.log(
    `${currentTimeReadable()} | Receive : 'requestDailyInitialNetStats' | From : dataPoolServer`,
  )

  // dailyAddressCountの最新endTimeUnixを取得
  let mysqlRes1 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT endTimeUnix
                                                                 FROM ethereum.dailyAddressCount
                                                                 ORDER BY endTimeUnix DESC
                                                                 LIMIT 1`)

  // dailyBasicNetStatsの最新endTimeUnixを取得
  let mysqlRes2 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT endTimeUnix
                                                                 FROM ethereum.dailyBasicNetStats
                                                                 ORDER BY endTimeUnix DESC
                                                                 LIMIT 1`)

  // dailyAddressCountの最新endTimeUnixとdailyBasicNetStatsの最新endTimeUnixを比較し、小さい方を採用する
  let endTimeUnix1: number = mysqlRes1[0][0].endTimeUnix
  let endTimeUnix2: number = mysqlRes2[0][0].endTimeUnix
  let minEndTimeUnix: number = endTimeUnix1 < endTimeUnix2 ? endTimeUnix1 : endTimeUnix2

  // dailyAddressCountのendTimeUnixがendTimeUnixのデータを降順に61件取得
  mysqlRes1 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                             FROM ethereum.dailyAddressCount
                                                             WHERE endTimeUnix <= ${minEndTimeUnix}
                                                             ORDER BY endTimeUnix DESC
                                                             LIMIT 168`)

  // dailyBasicNetStatsのendTimeUnixがendTimeUnixのデータを降順に61件取得
  mysqlRes2 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                             FROM ethereum.dailyBasicNetStats
                                                             WHERE endTimeUnix <= ${minEndTimeUnix}
                                                             ORDER BY endTimeUnix DESC
                                                             LIMIT 168`)

  // mysqlRes2のデータを抽出
  let dailyInitialNetStats: netStatsArray = mysqlRes2[0]

  // dailyInitialBasicNetStatsにdailyAddressCountのnumberOfAddressesを追加
  for (let i = 0; i < dailyInitialNetStats.length; i++) {
    dailyInitialNetStats[i].numberOfAddress = mysqlRes1[0][i].numberOfAddress
  }

  // データが時系列順に並ぶように並び替え
  dailyInitialNetStats.reverse()

  // １日ごとの集計データの初期データをdataPoolServerに送信
  socketServer.to(dataPoolServerId).emit('initialDailyNetStats', dailyInitialNetStats)
  console.log(`${currentTimeReadable()} | Emit : 'initialDailyNetStats' | To : dataPoolServer`)
}

export default responseInitialDailyNetStats
