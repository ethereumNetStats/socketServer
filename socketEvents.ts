import {netStatsArray, blockNumberWithTimestamp, recordOfEthDB, numberOfAddress, netStats} from "./types";

type ClientToServerEvents = {
    //Events with backend socket clients.
    newBlockDataRecorded: (blockNumberWithTimestamp: blockNumberWithTimestamp) => void,
    addressChecked: (blockNumber: number) => void,
    minutelyBasicNetStatsRecorded: (recordOfEthDB: recordOfEthDB) => void,
    minutelyAddressCountRecorded: (minutelyAddressCount: numberOfAddress) => void,
    hourlyBasicNetStatsRecorded: (recordOfEthDB: recordOfEthDB) => void,
    hourlyAddressCountRecorded: (hourlyAddressCount: numberOfAddress) => void,

    //Events with the dataPoolServer socket client.
    requestInitialMinutelyNetStats: (ack: Function) => void,
    requestInitialHourlyNetStats: () => void,
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
}

export type {ClientToServerEvents, ServerToClientEvents}
