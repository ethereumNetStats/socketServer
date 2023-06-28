import 'dotenv/config'

import { currentTimeReadable } from '@ethereum_net_stats/readable_time'
import { getMysqlConnection, Pool, RowDataPacket } from '@ethereum_net_stats/get_mysql_connection'
import type { Server } from 'socket.io'
import { netStatsArray } from '../types/types'

const mysqlConnection: Pool = getMysqlConnection(false, true)

const responseInitialHourlyNetStats = async (
  socketServer: Server,
  dataPoolServerId: string,
): Promise<void> => {
  console.log(
    `${currentTimeReadable()} | Receive : 'requestHourlyInitialNetStats' | From : dataPoolServer`,
  )

  // hourlyAddressCountの最新endTimeUnixを取得
  let mysqlRes1 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT endTimeUnix
                                                                 FROM ethereum.hourlyAddressCount
                                                                 ORDER BY endTimeUnix DESC
                                                                 LIMIT 1`)

  // hourlyBasicNetStatsの最新endTimeUnixを取得
  let mysqlRes2 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT endTimeUnix
                                                                 FROM ethereum.hourlyBasicNetStats
                                                                 ORDER BY endTimeUnix DESC
                                                                 LIMIT 1`)

  // hourlyAddressCountの最新endTimeUnixとminutelyBasicNetStatsの最新endTimeUnixを比較し、小さい方を採用する
  let endTimeUnix1: number = mysqlRes1[0][0].endTimeUnix
  let endTimeUnix2: number = mysqlRes2[0][0].endTimeUnix
  let minEndTimeUnix: number = endTimeUnix1 < endTimeUnix2 ? endTimeUnix1 : endTimeUnix2

  // hourlyAddressCountのendTimeUnixがendTimeUnixのデータを降順に61件取得
  mysqlRes1 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                             FROM ethereum.hourlyAddressCount
                                                             WHERE endTimeUnix <= ${minEndTimeUnix}
                                                             ORDER BY endTimeUnix DESC
                                                             LIMIT 168`)

  // hourlyBasicNetStatsのendTimeUnixがendTimeUnixのデータを降順に61件取得
  mysqlRes2 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                             FROM ethereum.hourlyBasicNetStats
                                                             WHERE endTimeUnix <= ${minEndTimeUnix}
                                                             ORDER BY endTimeUnix DESC
                                                             LIMIT 168`)

  // mysqlRes2のデータを抽出
  let hourlyInitialNetStats: netStatsArray = mysqlRes2[0]

  // minutelyInitialBasicNetStatsにminutelyAddressCountのnumberOfAddressesを追加
  for (let i = 0; i < hourlyInitialNetStats.length; i++) {
    hourlyInitialNetStats[i].numberOfAddress = mysqlRes1[0][i].numberOfAddress
  }

  // データが時系列順に並ぶように並び替え
  hourlyInitialNetStats.reverse()

  // １時間ごとの集計データの初期データをdataPoolServerに送信
  socketServer.to(dataPoolServerId).emit('initialHourlyNetStats', hourlyInitialNetStats)
  console.log(`${currentTimeReadable()} | Emit : 'initialHourlyNetStats' | To : dataPoolServer`)
}

export default responseInitialHourlyNetStats
