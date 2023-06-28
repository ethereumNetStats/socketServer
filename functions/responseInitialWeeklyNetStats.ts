import 'dotenv/config'

import { currentTimeReadable } from '@ethereum_net_stats/readable_time'
import { getMysqlConnection, Pool, RowDataPacket } from '@ethereum_net_stats/get_mysql_connection'
import type { Server } from 'socket.io'
import { netStatsArray } from '../types/types'

const mysqlConnection: Pool = getMysqlConnection(false, true)

const responseInitialWeeklyNetStats = async (
  socketServer: Server,
  dataPoolServerId: string,
): Promise<void> => {
  console.log(
    `${currentTimeReadable()} | Receive : 'requestWeeklyInitialNetStats' | From : dataPoolServer`,
  )

  // weeklyAddressCountの最新endTimeUnixを取得
  let mysqlRes1 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT endTimeUnix
                                                                 FROM ethereum.weeklyAddressCount
                                                                 ORDER BY endTimeUnix DESC
                                                                 LIMIT 1`)

  // weeklyBasicNetStatsの最新endTimeUnixを取得
  let mysqlRes2 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT endTimeUnix
                                                                 FROM ethereum.weeklyBasicNetStats
                                                                 ORDER BY endTimeUnix DESC
                                                                 LIMIT 1`)

  // weeklyAddressCountの最新endTimeUnixとweeklyBasicNetStatsの最新endTimeUnixを比較し、小さい方を採用する
  let endTimeUnix1: number = mysqlRes1[0][0].endTimeUnix
  let endTimeUnix2: number = mysqlRes2[0][0].endTimeUnix
  let minEndTimeUnix: number = endTimeUnix1 < endTimeUnix2 ? endTimeUnix1 : endTimeUnix2

  // weeklyAddressCountのendTimeUnixがendTimeUnixのデータを降順に61件取得
  mysqlRes1 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                             FROM ethereum.weeklyAddressCount
                                                             WHERE endTimeUnix <= ${minEndTimeUnix}
                                                             ORDER BY endTimeUnix DESC
                                                             LIMIT 168`)

  // weeklyBasicNetStatsのendTimeUnixがendTimeUnixのデータを降順に61件取得
  mysqlRes2 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                             FROM ethereum.weeklyBasicNetStats
                                                             WHERE endTimeUnix <= ${minEndTimeUnix}
                                                             ORDER BY endTimeUnix DESC
                                                             LIMIT 168`)

  // mysqlRes2のデータを抽出
  let weeklyInitialNetStats: netStatsArray = mysqlRes2[0]

  // weeklyInitialBasicNetStatsにweeklyAddressCountのnumberOfAddressesを追加
  for (let i = 0; i < weeklyInitialNetStats.length; i++) {
    weeklyInitialNetStats[i].numberOfAddress = mysqlRes1[0][i].numberOfAddress
  }

  // データが時系列順に並ぶように並び替え
  weeklyInitialNetStats.reverse()

  // １週ごとの集計データの初期データをdataPoolServerに送信
  socketServer.to(dataPoolServerId).emit('initialWeeklyNetStats', weeklyInitialNetStats)
  console.log(`${currentTimeReadable()} | Emit : 'initialWeeklyNetStats' | To : dataPoolServer`)
}

export default responseInitialWeeklyNetStats
