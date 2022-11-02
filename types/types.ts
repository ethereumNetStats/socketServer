type blockNumberWithTimestamp = {
    blockNumber: number | undefined,
    timestamp: number | undefined,
}

type basicNetStats = {
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
    blockSizePerBlock: number,
    totalDifficulty: string,
    averageDifficulty: string,
    difficultyPerBlock: string,
    totalUncleDifficulty: string,
    averageUncleDifficulty: string,
    uncleDifficultyPerBlock: string,
    totalNumberOfUncleBlocks: number,
    averageNumberOfUncleBlocks: number,
    numberOfUncleBlocksPerBlock: number,
    hashRate: number,
    totalTransactions: number,
    averageTransactions: number,
    transactionsPerBlock: number,
    totalBaseFeePerGas: number,
    averageBaseFeePerGas: number,
    baseFeePerGasPerBlock: number,
    totalGasUsed: number,
    averageGasUsed: number,
    gasUsedPerBlock: number,
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

type blockData = {
    number: number,
    hash: string,
    parentHash: string,
    baseFeePerGas: number,
    nonce: string,
    sha3Uncles: string,
    logsBloom: string,
    transactionsRoot: string,
    miner: string,
    difficulty: string,
    totalDifficulty: string,
    extraData: string,
    size: number,
    gasLimit: number,
    gasUsed: number,
    timestamp: number,
    transactions: string,
    uncles: string,
    mixHash: string,
    receiptsRoot: string,
    timestampReadable?: string,
}

type blockDataArray = Array<blockData>;

type netStats = basicNetStats & Pick<numberOfAddress, "numberOfAddress">;

type netStatsArray = Array<netStats>;

export type {blockNumberWithTimestamp, basicNetStats, numberOfAddress, netStats, netStatsArray, blockData, blockDataArray}
