import 'dotenv/config'

import { currentTimeReadable } from '@ethereum_net_stats/readable_time'
import { getMysqlConnection, Pool, RowDataPacket } from '@ethereum_net_stats/get_mysql_connection'
import { netStatsArray } from '../types/types'
import type { Server } from 'socket.io'

const mysqlConnection: Pool = getMysqlConnection(false, true)

const responseInitialMinutelyNetStats = async (
  socketServer: Server,
  dataPoolServerId: string,
): Promise<void> => {
  console.log(
    `${currentTimeReadable()} | Receive : 'requestMinutelyInitialNetStats' | From : dataPoolServer`,
  )

  // minutelyAddressCountの最新endTimeUnixを取得
  let mysqlRes1 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT endTimeUnix
                                                                 FROM ethereum.minutelyAddressCount
                                                                 ORDER BY endTimeUnix DESC
                                                                 LIMIT 1`)

  // minutelyBasicNetStatsの最新endTimeUnixを取得
  let mysqlRes2 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT endTimeUnix
                                                                 FROM ethereum.minutelyBasicNetStats
                                                                 ORDER BY endTimeUnix DESC
                                                                 LIMIT 1`)

  // minutelyAddressCountの最新endTimeUnixとminutelyBasicNetStatsの最新endTimeUnixを比較し、小さい方を採用する
  let endTimeUnix1: number = mysqlRes1[0][0].endTimeUnix
  let endTimeUnix2: number = mysqlRes2[0][0].endTimeUnix
  let minEndTimeUnix: number = endTimeUnix1 < endTimeUnix2 ? endTimeUnix1 : endTimeUnix2

  // minutelyAddressCountのendTimeUnixがendTimeUnixのデータを降順に60件（１時間分）取得
  mysqlRes1 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                             FROM ethereum.minutelyAddressCount
                                                             WHERE endTimeUnix <= ${minEndTimeUnix}
                                                             ORDER BY endTimeUnix DESC
                                                             LIMIT 60`)

  // minutelyBasicNetStatsのendTimeUnixがendTimeUnixのデータを降順に60件（１時間分）取得
  mysqlRes2 = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                             FROM ethereum.minutelyBasicNetStats
                                                             WHERE endTimeUnix <= ${minEndTimeUnix}
                                                             ORDER BY endTimeUnix DESC
                                                             LIMIT 60`)

  // mysqlRes2のデータを抽出
  let minutelyInitialNetStats: netStatsArray = mysqlRes2[0]

  // minutelyInitialBasicNetStatsにminutelyAddressCountのnumberOfAddressesを追加
  for (let i = 0; i < minutelyInitialNetStats.length; i++) {
    minutelyInitialNetStats[i].numberOfAddress = mysqlRes1[0][i].numberOfAddress
  }

  // データが時系列順に並ぶように並び替え
  minutelyInitialNetStats.reverse()

  // １分ごとの集計データの初期データをdataPoolServerに送信
  socketServer.to(dataPoolServerId).emit('initialMinutelyNetStats', minutelyInitialNetStats)
  console.log(`${currentTimeReadable()} | Emit : 'initialMinutelyNetStats' | To : dataPoolServer`)
}

export default responseInitialMinutelyNetStats
