// 型定義のインポート
import type {
    netStatsArray,
    blockNumberWithTimestamp,
    basicNetStats,
    numberOfAddress,
    netStats,
    blockData,
    blockDataArray,
    requestBlockDetail,
    responseBlockDetail,
    responseBlockList,
    requestBlockList,
    requestBlockListPageByBlockNumber,
    responseBlockListPageByBlockNumber,
    requestTransactionDetail, responseTransactionDetail
} from "./types";

// データレコーダー及びデータプールサーバーとのsocket.ioイベントのイベント名と引数の型を登録
type ClientToServerEvents = {
    // 各データレコーダーから発行されるイベントの登録
    newBlockDataRecorded: (blockNumberWithTimestamp: blockNumberWithTimestamp) => void,
    addressChecked: (blockNumber: number) => void,

    minutelyBasicNetStatsRecorded: (basicNetStats: basicNetStats) => void,
    minutelyAddressCountRecorded: (minutelyAddressCount: numberOfAddress) => void,

    hourlyBasicNetStatsRecorded: (basicNetStats: basicNetStats) => void,
    hourlyAddressCountRecorded: (hourlyAddressCount: numberOfAddress) => void,

    dailyBasicNetStatsRecorded: (basicNetStats: basicNetStats) => void,
    dailyAddressCountRecorded: (dailyAddressCount: numberOfAddress) => void,

    weeklyBasicNetStatsRecorded: (basicNetStats: basicNetStats) => void,
    weeklyAddressCountRecorded: (weeklyAddressCount: numberOfAddress) => void,

    // データプールサーバーから発行されるイベントの登録
    requestInitialMinutelyNetStats: () => void,
    requestInitialHourlyNetStats: () => void,
    requestInitialDailyNetStats: () => void,
    requestInitialWeeklyNetStats: () => void,

    requestInitialBlockData: () => void,

    requestBlockDetail: (requestBlockDetail: requestBlockDetail) => void,
    requestBlockList: (requestBlockList: requestBlockList) => void,
    requestBlockListPageByBlockNumber: (requestBlockListPageByBlockNumber: requestBlockListPageByBlockNumber) => void,
    requestTransactionDetail: (requestTransactionDetail: requestTransactionDetail) => void,
}

// socketServerから各データレコーダー及びデータプールサーバーに発行するイベントの登録
type ServerToClientEvents = {
    // 各データレコーダーに発行するイベントの登録
    newBlockDataRecorded: (blockNumberWithTimestamp: blockNumberWithTimestamp) => void,
    addressChecked: (blockNumber: number) => void,

    // データプールサーバーに発行するイベントの登録
    initialMinutelyNetStats: (minutelyNetStatsArray: netStatsArray) => void,
    newMinutelyNetStats: (minutelyNetStats: netStats) => void,

    initialHourlyNetStats: (hourlyNetStatsArray: netStatsArray) => void,
    newHourlyNetStats: (hourlyNetStats: netStats) => void,

    initialDailyNetStats: (dailyNetStatsArray: netStatsArray) => void,
    newDailyNetStats: (dailyNetStats: netStats) => void,

    initialWeeklyNetStats: (dailyNetStatsArray: netStatsArray) => void,
    newWeeklyNetStats: (dailyNetStats: netStats) => void,

    initialBlockData: (blockDataArray: blockDataArray) => void,
    newBlockData: (blockData: blockData) => void,

    responseBlockDetail: (responseBlockDetail: responseBlockDetail) => void,
    responseBlockList: (responseBlockList: responseBlockList) => void,
    responseBlockListPageByBlockNumber: (responseBlockListPageByBlockNumber: responseBlockListPageByBlockNumber) => void,
    responseTransactionDetail: (responseTransactionDetail: responseTransactionDetail) => void,
}

export type {ClientToServerEvents, ServerToClientEvents}
