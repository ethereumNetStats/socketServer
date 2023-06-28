import 'dotenv/config'

import { currentTimeReadable, unixTimeReadable } from '@ethereum_net_stats/readable_time'
import { getMysqlConnection, Pool, RowDataPacket } from '@ethereum_net_stats/get_mysql_connection'
import { blockData, blockNumberWithTimestamp } from '../types/types'
import { Server } from 'socket.io'

const mysqlConnection: Pool = getMysqlConnection(false, false)

const newBlockDataRecorded = async (
  blockNumberWithTimestamp: blockNumberWithTimestamp,
  netStatsRecorder: Array<string>,
  socketServer: Server,
  dataPoolServerId: string,
): Promise<void> => {
  console.log(
    `${currentTimeReadable()} | Receive : 'newBlockDataRecorded' | Block number : ${
      blockNumberWithTimestamp.blockNumber && blockNumberWithTimestamp.blockNumber
    } | Timestamp : ${
      blockNumberWithTimestamp.timestamp && unixTimeReadable(blockNumberWithTimestamp.timestamp)
    }`,
  )

  // "newBlockDataRecorded"イベントで受信したデータを各データレコーダーへ転送
  netStatsRecorder.map((id) => {
    socketServer.to(id).emit('newBlockDataRecorded', blockNumberWithTimestamp)
    console.log(
      `${currentTimeReadable()} | Proxy : blockDataRecorder -> ${id} | Event : 'newBlockDataRecorded' | Block number : ${
        blockNumberWithTimestamp.blockNumber
      } | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`,
    )
  })

  // blockDataRecorderから通知されたブロックナンバーのブロックデータ（最新のブロックデータ）をデータベースから取得
  let [mysqlRes] = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM ethereum.blockData
                                                                      WHERE timestamp = ${blockNumberWithTimestamp.timestamp}`)

  let newBlockData: blockData = mysqlRes[0]

  // 最新のブロックデータをdataPoolServerに送信
  socketServer.to(dataPoolServerId).emit('newBlockData', newBlockData)
  console.log(`${currentTimeReadable()} | Emit : 'newBlockData' | To : dataPoolServer`)
}

export default newBlockDataRecorded
