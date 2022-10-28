import {netStatsArray, blockNumberWithTimestamp, recordOfEthDB, numberOfAddress, netStats} from "./types";

type ClientToServerEvents = {
    //Events with backend socket clients.
    newBlockDataRecorded: (blockNumberWithTimestamp: blockNumberWithTimestamp) => void,
    addressChecked: (blockNumber: number) => void,

    minutelyBasicNetStatsRecorded: (recordOfEthDB: recordOfEthDB) => void,
    minutelyAddressCountRecorded: (minutelyAddressCount: numberOfAddress) => void,

    hourlyBasicNetStatsRecorded: (recordOfEthDB: recordOfEthDB) => void,
    hourlyAddressCountRecorded: (hourlyAddressCount: numberOfAddress) => void,

    dailyBasicNetStatsRecorded: (recordOfEthDB: recordOfEthDB) => void,
    dailyAddressCountRecorded: (dailyAddressCount: numberOfAddress) => void,

    weeklyBasicNetStatsRecorded: (recordOfEthDB: recordOfEthDB) => void,
    weeklyAddressCountRecorded: (weeklyAddressCount: numberOfAddress) => void,

    //Events with the dataPoolServer socket client.
    requestInitialMinutelyNetStats: () => void,
    requestInitialHourlyNetStats: () => void,
    requestInitialDailyNetStats: () => void,
    requestInitialWeeklyNetStats: () => void,
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
}

export type {ClientToServerEvents, ServerToClientEvents}
