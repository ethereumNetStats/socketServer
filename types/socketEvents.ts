// 型定義のインポート
import type {
  netStatsArray,
  blockNumberWithTimestamp,
  basicNetStats,
  numberOfAddress,
  netStats,
  blockData,
  arrayOfBlockData,
  requestBlockDetail,
  responseBlockDetail,
  blockList,
  requestBlockList,
  requestBlockListPageByBlockNumber,
  responseBlockListPageByBlockNumber,
  requestTransactionSearch,
  requestLatestData,
  responseLatestData,
  requestBlockSearch,
  resultOfBlockSearch,
} from './types'

// データレコーダー及びデータプールサーバーとのsocket.ioイベントのイベント名と引数の型を登録
type ClientToServerEvents = {
  // 各データレコーダーから発行されるイベントの登録
  newBlockDataRecorded: (blockNumberWithTimestamp: blockNumberWithTimestamp) => void
  addressChecked: (blockNumber: number) => void

  newMinutelyBasicNetStatsRecorded: (basicNetStats: basicNetStats) => void
  newMinutelyAddressCountRecorded: (minutelyAddressCount: numberOfAddress) => void

  newHourlyBasicNetStatsRecorded: (basicNetStats: basicNetStats) => void
  newHourlyAddressCountRecorded: (hourlyAddressCount: numberOfAddress) => void

  newDailyBasicNetStatsRecorded: (basicNetStats: basicNetStats) => void
  newDailyAddressCountRecorded: (dailyAddressCount: numberOfAddress) => void

  newWeeklyBasicNetStatsRecorded: (basicNetStats: basicNetStats) => void
  newWeeklyAddressCountRecorded: (weeklyAddressCount: numberOfAddress) => void

  // データパブリッシャーから発行されるイベントの登録
  requestInitialMinutelyNetStats: () => void
  requestInitialHourlyNetStats: () => void
  requestInitialDailyNetStats: () => void
  requestInitialWeeklyNetStats: () => void
  requestInitialBlockData: () => void
  requestBlockDetail: (requestBlockDetail: requestBlockDetail) => void
  requestBlockList: (requestBlockList: requestBlockList) => void
  requestBlockListPageByBlockNumber: (
    requestBlockListPageByBlockNumber: requestBlockListPageByBlockNumber,
  ) => void
  requestTransactionSearch: (requestTransactionSearch: requestTransactionSearch) => void
  requestLatest10BlockData: (requestLatest10Data: requestLatestData) => void
  requestBlockSearch: (requestBlockSearch: requestBlockSearch) => void
}

// socketServerから各データレコーダー及びデータプールサーバーに発行するイベントの登録
type ServerToClientEvents = {
  // 各データレコーダーに発行するイベントの登録
  newBlockDataRecorded: (blockNumberWithTimestamp: blockNumberWithTimestamp) => void
  addressChecked: (blockNumber: number) => void

  // データプールサーバーに発行するイベントの登録
  initialMinutelyNetStats: (minutelyNetStatsArray: netStatsArray) => void
  newMinutelyNetStats: (minutelyNetStats: netStats) => void

  initialHourlyNetStats: (hourlyNetStatsArray: netStatsArray) => void
  newHourlyNetStats: (hourlyNetStats: netStats) => void

  initialDailyNetStats: (dailyNetStatsArray: netStatsArray) => void
  newDailyNetStats: (dailyNetStats: netStats) => void

  initialWeeklyNetStats: (dailyNetStatsArray: netStatsArray) => void
  newWeeklyNetStats: (dailyNetStats: netStats) => void

  initialBlockData: (blockDataArray: arrayOfBlockData) => void
  newBlockData: (blockData: blockData) => void

  responseBlockDetail: (responseBlockDetail: responseBlockDetail) => void
  responseBlockList: (responseBlockList: blockList) => void
  responseBlockListPageByBlockNumber: (
    responseBlockListPageByBlockNumber: responseBlockListPageByBlockNumber,
  ) => void
  responseLatestData: (responseLatestData: responseLatestData) => void

  resultOfBlockSearch: (resultOfBlockSearch: resultOfBlockSearch) => void
}

export type { ClientToServerEvents, ServerToClientEvents }
