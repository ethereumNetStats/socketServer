type blockNumberWithTimestamp = {
    blockNumber: number | undefined,
    timestamp: number | undefined,
}

type recordOfEthDB = {
    startTimeReadable: string,
    endTimeReadable: string,
    startTimeUnix: number,
    endTimeUnix: number,
    actualStartTimeUnix: number,
    actualEndTimeUnix: number,
    startBlockNumber: number,
    endBlockNumber: number,
    blocks: number,
    totalBlockSize: number,
    averageBlockSize: number,
    totalDifficulty: number,
    averageDifficulty: number,
    totalUncleDifficulty: number,
    hashRate: number,
    transactions: number,
    transactionsPerBlock: number,
    noRecordFlag: boolean,
};

type numberOfAddress = {
    startTimeReadable: string,
    endTimeReadable: string,
    startTimeUnix: number,
    endTimeUnix: number,
    numberOfAddress: number,
    noRecordFlag: boolean,
};

type netStats = recordOfEthDB & Pick<numberOfAddress, "numberOfAddress">;

type netStatsArray = Array<netStats>;

export type {blockNumberWithTimestamp, recordOfEthDB, numberOfAddress, netStats, netStatsArray}
