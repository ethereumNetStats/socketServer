// web3@1.9.0でmixHashの型定義がweb3.eth.getBlock()の戻り値に含まれていないので追加
import type { BlockTransactionString } from 'web3-eth'
type BlockTransactionStringWithMixHash = BlockTransactionString & {
  mixHash: string
}

// blockDataRecorderから受け取るデータ型の定義
type blockNumberWithTimestamp = {
  blockNumber: number | undefined
  timestamp: number | undefined
}

// MySQLの"blockData"テーブルの型定義
type basicNetStats = {
  startTimeReadable: string
  endTimeReadable: string
  startTimeUnix: number
  endTimeUnix: number
  actualStartTimeUnix: number
  actualEndTimeUnix: number
  startBlockNumber: number
  endBlockNumber: number
  blocks: number
  totalBlockSize: number
  averageBlockSize: number
  blockSizePerBlock: number
  totalDifficulty: string
  averageDifficulty: string
  difficultyPerBlock: string
  totalUncleDifficulty: string
  averageUncleDifficulty: string
  uncleDifficultyPerBlock: string
  totalNumberOfUncleBlocks: number
  averageNumberOfUncleBlocks: number
  numberOfUncleBlocksPerBlock: number
  hashRate: number
  totalTransactions: number
  averageTransactions: number
  transactionsPerBlock: number
  totalBaseFeePerGas: number
  averageBaseFeePerGas: number
  baseFeePerGasPerBlock: number
  totalGasUsed: number
  averageGasUsed: number
  gasUsedPerBlock: number
  noRecordFlag: boolean
}

// basicNetStatsを格納する配列の型定義
type basicNetStatsArray = Array<basicNetStats>

// addressCounterから受け取るデータの型定義
type numberOfAddress = {
  startTimeReadable: string
  endTimeReadable: string
  startTimeUnix: number
  endTimeUnix: number
  numberOfAddress?: number
  noRecordFlag: boolean
}

// データプールサーバーに送信するブロックデータの型定義
type blockData = {
  id?: number
  number: number
  hash: string
  parentHash: string
  baseFeePerGas: number
  nonce: string
  sha3Uncles: string
  logsBloom: string
  transactionsRoot: string
  miner: string
  difficulty: string
  totalDifficulty: string
  extraData: string
  size: number
  gasLimit: number
  gasUsed: number
  timestamp: number
  transactions: string
  uncles: string
  mixHash: string
  receiptsRoot: string
  timestampReadable?: string
}

// blockDataを格納する配列の型定義
type arrayOfBlockData = Array<blockData>

// データプールサーバーに送信する集計データの型定義
type netStats = basicNetStats & Pick<numberOfAddress, 'numberOfAddress'>

// netStatsを格納する配列の型定義
type netStatsArray = Array<netStats>

type attribute = 'Minutely' | 'Hourly' | 'Daily' | 'Weekly'

type netStatsWithAttribute = {
  [key in attribute]?: basicNetStatsArray & { attribute?: attribute }
}

// データプールサーバーから発行される"requestBlockDetail"イベントで受け取るデータの型定義
type requestBlockDetail = {
  number: number
  frontendId: string
}

// データプールサーバーから発行される"requestBlockList"イベントで受け取るデータの型定義
type requestBlockList = {
  pageOffset: number
  frontendId: string
}

// データプールサーバーへ発行する”responseBlockDetail”イベントで送信するデータの型定義
type responseBlockDetail = Pick<requestBlockDetail, 'frontendId'> &
  blockData & {
    noRecord: boolean
  }

// データプールサーバーへ発行する"responseBlockList"イベントで送信するデータの型定義
type blockList = {
  list: Array<blockData>
  latestBlockNumber: number
  totalPage: number
  currentPage: number
  topBlockNumber: number
  lastBlockNumber: number
  itemsPerPage: number
  pageOffset: number
  frontendId: string
}

// データプールサーバーから発行される"requestBlockListPageByBlockNumber"イベントで受け取るデータの型定義
type requestBlockListPageByBlockNumber = {
  blockNumber: number
  frontendId: string
}

// データプールサーバーへ発行する"responseBLockListPageByBlockNumber"イベントで送信するデータの型定義
type responseBlockListPageByBlockNumber = blockList

// transactionデータの型定義
type transactionDetail = {
  hash: string
  nonce: number
  blockHash: string | null
  blockNumber: number | null
  transactionIndex: number | null
  from: string
  to: string | null
  input: string
  value: string
  gasPrice: string
  gas: number
  type?: number
  v?: string
  r?: string
  s?: string
  chainId?: string
}

// requestTransactionSearchのデータ型の定義
type requestTransactionSearch = {
  transactionHash: string
  frontendId: string
}

// transactionSearchResultのデータ型の定義
type transactionSearchResult = {
  transactionDetail: transactionDetail | null
  requestedTransactionHash: string
  frontendId: string
  error: string
}

type uniqueAddress = {
  timestampReadable: string
  timestamp: number
  showUpBlock: number
  firstTransactionHash: string
  address: string
}

type requestLatestData = {
  frontendId: string
}

type newAddressCountInBlock = {
  blockNumber: number
  newAddressCount: number
}

type newAddressCountInBlockArray = Array<newAddressCountInBlock>

type blockDataWithNewAddressCount = blockData & {
  newAddressCount?: number
}

type blockDataWithNewAddressCountArray = Array<blockDataWithNewAddressCount>

type blockDataWithNewAddressCountAndTps = blockDataWithNewAddressCount & {
  timestampDiff: number
  tps: number
}

type latestBlockData = Array<blockDataWithNewAddressCountAndTps>

type responseLatestData = {
  latestBlockData: latestBlockData
  latestTransactionData?: Array<transactionDetail>
  frontendId?: string
}

type socketClientAttribute = {
  name: string
  emitterTrigger?: string
  listenerTrigger?: string
  id: string
}

type requestBlockSearch = {
  blockNumber: number
  frontendId: string
}

type resultOfBlockSearch = BlockTransactionStringWithMixHash & {
  frontendId: string
}

export type {
  blockNumberWithTimestamp,
  basicNetStats,
  numberOfAddress,
  netStats,
  netStatsArray,
  blockData,
  arrayOfBlockData,
  requestBlockDetail,
  responseBlockDetail,
  blockList,
  requestBlockList,
  requestBlockListPageByBlockNumber,
  responseBlockListPageByBlockNumber,
  requestTransactionSearch,
  transactionSearchResult,
  transactionDetail,
  requestLatestData,
  uniqueAddress,
  newAddressCountInBlock,
  newAddressCountInBlockArray,
  blockDataWithNewAddressCount,
  blockDataWithNewAddressCountArray,
  blockDataWithNewAddressCountAndTps,
  latestBlockData,
  responseLatestData,
  socketClientAttribute,
  requestBlockSearch,
  resultOfBlockSearch,
  BlockTransactionStringWithMixHash,
  attribute,
  netStatsWithAttribute,
  basicNetStatsArray,
}
