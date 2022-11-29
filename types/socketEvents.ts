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
    responseBlockList, requestBlockList, requestBlockListPageByBlockNumber, responseBlockListPageByBlockNumber
} from "./types";

type ClientToServerEvents = {
    //Events with backend socket clients.
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

    //Events with the dataPoolServer socket client.
    requestInitialMinutelyNetStats: () => void,
    requestInitialHourlyNetStats: () => void,
    requestInitialDailyNetStats: () => void,
    requestInitialWeeklyNetStats: () => void,

    requestInitialBlockData: () => void,

    requestBlockDetail: (requestBlockDetail: requestBlockDetail) => void,
    requestBlockList: (requestBlockList: requestBlockList) => void,
    requestBlockListPageByBlockNumber: (requestBlockListPageByBlockNumber: requestBlockListPageByBlockNumber) => void,
}

type ServerToClientEvents = {
    //Events with backend socket clients.
    newBlockDataRecorded: (blockNumberWithTimestamp: blockNumberWithTimestamp) => void,
    addressChecked: (blockNumber: number) => void,

    //Events with the dataPoolServer socket client.
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
}

export type {ClientToServerEvents, ServerToClientEvents}
