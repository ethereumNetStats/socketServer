// 環境変数のインポート
import "dotenv/config";

// パッケージのインポート
import {Server} from "socket.io";

// 自作パッケージのインポート
import {currentTimeReadable, unixTimeReadable} from "@ethereum_net_stats/readable_time";
import {getMysqlConnection, RowDataPacket} from "@ethereum_net_stats/get_mysql_connection";

// ソケットイベント定義のインポート
import type {ClientToServerEvents, ServerToClientEvents} from "./types/socketEvents";

// 型定義のインポート
import type {
    blockNumberWithTimestamp,
    // numberOfAddress,
    // netStats,
    basicNetStats,
    blockDataArray,
    blockData,
    responseBlockDetail,
    responseBlockList,
    requestBlockListPageByBlockNumber,
    responseBlockListPageByBlockNumber, requestBlockDetail, requestBlockList,
} from "./types/types";

import type {Pool} from "@ethereum_net_stats/get_mysql_connection";

const mysqlConnection: Pool = await getMysqlConnection(false);

// socket.io-serverの起動
const socketServer: Server<ClientToServerEvents, ServerToClientEvents> = new Server(6000);

// socket.io-clientのID格納用変数の初期化
let minutelyBasicNetStatsMakerId: string = '';
let hourlyBasicNetStatsMakerId: string = '';
let dailyBasicNetStatsMakerId: string = '';
let weeklyBasicNetStatsMakerId: string = '';

let minutelyAddressCounterId: string = '';
let hourlyAddressCounterId: string = '';
let dailyAddressCounterId: string = '';
let weeklyAddressCounterId: string = '';

let blockDataRecorderId: string = '';
let newAddressRecorderId: string = '';
let dataPoolServerId: string = '';

// socket.io-clientの名前定義
const minutelyBasicNetStatsMakerName: string = 'minutelyBasicNetStatsRecorder';
const hourlyBasicNetStatsMakerName: string = 'hourlyBasicNetStatsRecorder';
const dailyBasicNetStatsMakerName: string = 'dailyBasicNetStatsRecorder';
const weeklyBasicNetStatsMakerName: string = 'weeklyBasicNetStatsRecorder';

const minutelyAddressCounterName: string = 'minutelyAddressCounter';
const hourlyAddressCounterName: string = 'hourlyAddressCounter';
const dailyAddressCounterName: string = 'dailyAddressCounter';
const weeklyAddressCounterName: string = 'weeklyAddressCounter';

const blockDataRecorderName: string = 'blockDataRecorder';
const newAddressRecorderName: string = 'newAddressRecorder';
const dataPoolServerName: string = "dataPoolServer";

// １分ごとの集計データの格納用変数の定義.
// let minutelyBasicNetStatsDate: number | null;
// let minutelyBasicNetStatsData: basicNetStats | null;
// let minutelyAddressCountDate: number | null;
// let minutelyAddressCountData: numberOfAddress | null;

// １時間ごとの集計データの格納用変数の定義
// let hourlyBasicNetStatsDate: number | null;
// let hourlyBasicNetStatsData: basicNetStats | null;
// let hourlyAddressCountDate: number | null;
// let hourlyAddressCountData: numberOfAddress | null;

// １日ごとの集計データの格納用変数の定義
// let dailyBasicNetStatsDate: number | null;
// let dailyBasicNetStatsData: basicNetStats | null;
// let dailyAddressCountDate: number | null;
// let dailyAddressCountData: numberOfAddress | null;

// １週間ごとの集計データの格納用変数の定義
// let weeklyBasicNetStatsDate: number | null;
// let weeklyBasicNetStatsData: basicNetStats | null;
// let weeklyAddressCountDate: number | null;
// let weeklyAddressCountData: numberOfAddress | null;

// ソケットサーバーのイベント登録
socketServer.on('connection', (client) => {
    console.log(`${currentTimeReadable()} | Connect with a socket client. ID : ${client.id}`);

    // クライアントから接続されたときにソケットIDを記録
    switch (client.handshake.query.name) {

        case minutelyBasicNetStatsMakerName:
            minutelyBasicNetStatsMakerId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${minutelyBasicNetStatsMakerName}`);
            break;

        case hourlyBasicNetStatsMakerName:
            hourlyBasicNetStatsMakerId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${hourlyBasicNetStatsMakerName}`);
            break;

        case dailyBasicNetStatsMakerName:
            dailyBasicNetStatsMakerId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${dailyBasicNetStatsMakerName}`);
            break;

        case weeklyBasicNetStatsMakerName:
            weeklyBasicNetStatsMakerId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${weeklyBasicNetStatsMakerName}`);
            break;

        case minutelyAddressCounterName:
            minutelyAddressCounterId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${minutelyAddressCounterName}`);
            break;

        case hourlyAddressCounterName:
            hourlyAddressCounterId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${hourlyAddressCounterName}`);
            break;

        case dailyAddressCounterName:
            dailyAddressCounterId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${dailyAddressCounterName}`);
            break;

        case weeklyAddressCounterName:
            weeklyAddressCounterId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${weeklyAddressCounterName}`);
            break;

        case blockDataRecorderName:
            blockDataRecorderId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${blockDataRecorderName}`);
            break;

        case newAddressRecorderName:
            newAddressRecorderId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${newAddressRecorderName}`);
            break;

        case dataPoolServerName:
            dataPoolServerId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${dataPoolServerName}`);
            break;
    }

    // blockDataRecorderによって発行される"newBlockDataRecorded"イベントを受信した時の処理
    client.on("newBlockDataRecorded", async (blockNumberWithTimestamp: blockNumberWithTimestamp) => {

        console.log(`${currentTimeReadable()} | Receive : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber && blockNumberWithTimestamp.blockNumber} | Timestamp : ${blockNumberWithTimestamp.timestamp && unixTimeReadable(blockNumberWithTimestamp.timestamp)}`);

        // "newBlockDataRecorded"イベントで受信したデータを各データレコーダーへ転送
        socketServer.to(minutelyBasicNetStatsMakerId).emit("newBlockDataRecorded", blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> minutelyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
        socketServer.to(hourlyBasicNetStatsMakerId).emit('newBlockDataRecorded', blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> hourlyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
        socketServer.to(dailyBasicNetStatsMakerId).emit('newBlockDataRecorded', blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> dailyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
        socketServer.to(weeklyBasicNetStatsMakerId).emit('newBlockDataRecorded', blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> weeklyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);

        // blockDataRecorderから通知されたブロックナンバーのブロックデータ（最新のブロックデータ）をデータベースから取得
        let [mysqlRes] = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                        FROM blockData
                                                                        WHERE timestamp = ${blockNumberWithTimestamp.timestamp}`);

        let newBlockData: blockData = mysqlRes[0];

        // 最新のブロックデータをdataPoolServerに送信
        socketServer.to(dataPoolServerId).emit('newBlockData', newBlockData);
        console.log(`${currentTimeReadable()} | Emit : 'newBlockData' | To : dataPoolServer`);
    });

    // addressRecorderがアドレスのチェックを完了した通知を各addressRecorderに転送
    client.on("addressChecked", (blockNumber: number) => {
        socketServer.to(minutelyAddressCounterId).emit("addressChecked", blockNumber);
        console.log(`${currentTimeReadable()} | Proxy : newAddressRecorder -> minutelyAddressCounter | Event : 'addressChecked' | Block number : ${blockNumber}`);
        socketServer.to(hourlyAddressCounterId).emit("addressChecked", blockNumber);
        console.log(`${currentTimeReadable()} | Proxy : newAddressRecorder -> hourlyAddressCounter | Event : 'addressChecked' | Block number : ${blockNumber}`);
        socketServer.to(dailyAddressCounterId).emit("addressChecked", blockNumber);
        console.log(`${currentTimeReadable()} | Proxy : newAddressRecorder -> dailyAddressCounter | Event : 'addressChecked' | Block number : ${blockNumber}`);
        socketServer.to(weeklyAddressCounterId).emit("addressChecked", blockNumber);
        console.log(`${currentTimeReadable()} | Proxy : newAddressRecorder -> weeklyAddressCounter | Event : 'addressChecked' | Block number : ${blockNumber}`);
    });

    //
    //Minutely events emitter and recorder
    //"minutelyAddressCountRecorded" & "minutelyBasicNetStatsRecorded" are exclusive events.
    //

    //Listener for the minutely net stats.
    // client.on("minutelyBasicNetStatsRecorded", (recordOfEthDB: basicNetStats) => {
    //
    //     console.log(`${currentTimeReadable()} | Receive : 'minutelyBasicNetStatsRecorded' | From : minutelyBasicNetStatsRecorder`);
    //
    //     minutelyBasicNetStatsData = recordOfEthDB;
    //     minutelyBasicNetStatsDate = recordOfEthDB.startTimeUnix;
    //
    //     if (minutelyBasicNetStatsData && minutelyAddressCountData) {
    //         if (minutelyBasicNetStatsDate === minutelyAddressCountDate) {
    //             let newMinutelyNetStats: netStats = {
    //                 ...recordOfEthDB,
    //                 numberOfAddress: minutelyAddressCountData.numberOfAddress,
    //             }
    //             client.to(dataPoolServerId).emit('newMinutelyNetStats', newMinutelyNetStats);
    //             console.log(`${currentTimeReadable()} | Emit : minutelyNetStats | To : dataPoolServer | Trigger event : 'minutelyBasicNetStatsRecorded'`);
    //             minutelyBasicNetStatsData = null;
    //             minutelyAddressCountData = null;
    //         }
    //     }
    // });

    //Listener for the minutely address counter.
    // client.on("minutelyAddressCountRecorded", (minutelyAddressCount: numberOfAddress) => {
    //
    //     console.log(`${currentTimeReadable()} | Receive : 'minutelyAddressCountRecorded' | From : minutelyAddressCounter`);
    //
    //     minutelyAddressCountData = minutelyAddressCount;
    //     minutelyAddressCountDate = minutelyAddressCount.startTimeUnix;
    //
    //     if (minutelyAddressCountData && minutelyBasicNetStatsData) {
    //         if (minutelyBasicNetStatsDate === minutelyAddressCountDate) {
    //             let newMinutelyNetStats: netStats = {
    //                 ...minutelyBasicNetStatsData,
    //                 numberOfAddress: minutelyAddressCount.numberOfAddress,
    //             }
    //             client.timeout(5000).to(dataPoolServerId).emit('newMinutelyNetStats', newMinutelyNetStats);
    //             console.log(`${currentTimeReadable()} | Emit : 'newMinutelyNetStats' | To : dataPoolServer | Trigger event : 'minutelyAddressCountRecorded'`);
    //             minutelyBasicNetStatsData = null;
    //             minutelyAddressCountData = null;
    //         }
    //     }
    // });

    // １分間のデータ集計が完了した時のイベント"minutelyBasicNetStatsRecorded"を受信した時の処理の登録
    client.on("minutelyBasicNetStatsRecorded", (basicNetStats: basicNetStats) => {
        console.log(`${currentTimeReadable()} | Receive :'minutelyBasicNetStatsRecorded' | From : minutelyBasicNetStatsRecorder`);

        // dataPoolServerに受信したデータを転送
        client.to(dataPoolServerId).emit('newMinutelyNetStats', basicNetStats);
        console.log(`${currentTimeReadable()} | Emit : newMinutelyNetStats | To : dataPoolServer | Trigger event : 'minutelyBasicNetStatsRecorded'`);
    });

    //Listener for a socketClient of the dataPoolServer.
    // client.on("requestInitialMinutelyNetStats", async () => {
    //     console.log(`${currentTimeReadable()} | Receive : 'requestMinutelyInitialNetStats' | From : dataPoolServer`);
    //
    //     let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
    //                                                                   FROM minutelyAddressCount
    //                                                                   ORDER BY endTimeUnix DESC
    //                                                                   LIMIT 61`);
    //
    //     let minutelyAddressCount: Array<numberOfAddress> = mysqlRes[0];
    //
    //     mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
    //                                                               FROM ethereum.minutelyBasicNetStats
    //                                                               WHERE endTimeUnix <= ${minutelyAddressCount[0].endTimeUnix}
    //                                                               ORDER BY endTimeUnix DESC
    //                                                               LIMIT 61`);
    //
    //     let minutelyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];
    //
    //     let initialMinutelyNetStats: netStatsArray = [];
    //
    //     for (let i = 0; i < minutelyAddressCount.length; i++) {
    //         initialMinutelyNetStats.push({
    //             ...minutelyBasicInitialNetStats[i],
    //             numberOfAddress: minutelyAddressCount[i].numberOfAddress,
    //         });
    //     }
    //
    //     initialMinutelyNetStats.reverse();
    //
    //     socketServer.to(dataPoolServerId).emit("initialMinutelyNetStats", initialMinutelyNetStats);
    //     console.log(`${currentTimeReadable()} | Emit : 'initialMinutelyNetStats' | To : dataPoolServer`);
    // });

    // dataPoolServerが起動したときに発行する"requestInitialMinutelyNetStats"イベントを受信した時の処理の登録
    client.on("requestInitialMinutelyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestMinutelyInitialNetStats' | From : dataPoolServer`);

        // dataPoolServerへ送信する１分ごとの集計データの初期データとして最新１時間分のデータをデータベースから取得
        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM ethereum.minutelyBasicNetStats
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 61`);

        // データベースの応答データから必要なデータを抽出
        let minutelyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];

        // データが時系列順に並ぶように並び替え
        minutelyBasicInitialNetStats.reverse();

        // １分ごとの集計データの初期データをdataPoolServerに送信
        socketServer.to(dataPoolServerId).emit("initialMinutelyNetStats", minutelyBasicInitialNetStats);
        console.log(`${currentTimeReadable()} | Emit : 'initialMinutelyNetStats' | To : dataPoolServer`);
    });

    //
    //Hourly events emitter and recorder
    //"hourlyAddressCountRecorded" & "hourlyBasicNetStatsRecorded" are exclusive events.
    //

    //Listener for the hourly net stats.
    // client.on("hourlyBasicNetStatsRecorded", (recordOfEthDB: basicNetStats) => {
    //
    //     console.log(`${currentTimeReadable()} | Received : 'hourlyBasicNetStatsRecorded' | From : hourlyBasicNetStatsRecorder`);
    //
    //     hourlyBasicNetStatsData = recordOfEthDB;
    //     hourlyBasicNetStatsDate = recordOfEthDB.startTimeUnix;
    //
    //     if (hourlyBasicNetStatsData && hourlyAddressCountData) {
    //         if (hourlyBasicNetStatsDate === hourlyAddressCountDate) {
    //             let newHourlyNetStats: netStats = {
    //                 ...recordOfEthDB,
    //                 numberOfAddress: hourlyAddressCountData.numberOfAddress,
    //             }
    //             client.to(dataPoolServerId).emit('newHourlyNetStats', newHourlyNetStats);
    //             hourlyBasicNetStatsData = null;
    //             hourlyAddressCountData = null;
    //         }
    //     }
    // });

    //Listener for the hourly address counter.
    // client.on("hourlyAddressCountRecorded", (hourlyAddressCount: numberOfAddress) => {
    //
    //     console.log(`${currentTimeReadable()} | Receive : 'hourlyAddressCountRecorded' | From : hourlyAddressCountRecorder`);
    //
    //     hourlyAddressCountData = hourlyAddressCount;
    //     hourlyAddressCountDate = hourlyAddressCount.startTimeUnix;
    //
    //     if (hourlyAddressCountData && hourlyBasicNetStatsData) {
    //         if (hourlyBasicNetStatsDate === hourlyAddressCountDate) {
    //             let newHourlyNetStats: netStats = {
    //                 ...hourlyBasicNetStatsData,
    //                 numberOfAddress: hourlyAddressCount.numberOfAddress,
    //             }
    //             client.to(dataPoolServerId).emit('newHourlyNetStats', newHourlyNetStats);
    //             console.log(`${currentTimeReadable()} | Emit : 'newHourlyNetStats' | To : dataPoolServer`);
    //             hourlyBasicNetStatsData = null;
    //             hourlyAddressCountData = null;
    //         }
    //     }
    // });

    // １時間のデータ集計が完了した時のイベント"hourlyBasicNetStatsRecorded"を受信した時の処理の登録
    client.on("hourlyBasicNetStatsRecorded", (basicNetStats: basicNetStats) => {
        console.log(`${currentTimeReadable()} | Received : 'hourlyBasicNetStatsRecorded' | From : hourlyBasicNetStatsRecorder`);

        // dataPoolServerに受信したデータを転送
        client.to(dataPoolServerId).emit('newHourlyNetStats', basicNetStats);
        console.log(`${currentTimeReadable()} | Emit : newHourlyNetStats | To : dataPoolServer | Trigger event : 'hourlyBasicNetStatsRecorded'`);
    });

    //Listener for a socketClient of the dataPoolServer.
    // client.on("requestInitialHourlyNetStats", async () => {
    //     console.log(`${currentTimeReadable()} | Receive : 'requestHourlyInitialNetStats' | From : dataPoolServer`);
    //
    //     let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
    //                                                                   FROM hourlyAddressCount
    //                                                                   ORDER BY endTimeUnix DESC
    //                                                                   LIMIT 25`);
    //
    //     let hourlyAddressCount: Array<numberOfAddress> = mysqlRes[0];
    //
    //     mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
    //                                                               FROM hourlyBasicNetStats
    //                                                               WHERE endTimeUnix <= ${hourlyAddressCount[0].endTimeUnix}
    //                                                               ORDER BY endTimeUnix DESC
    //                                                               LIMIT 25`);
    //
    //     let hourlyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];
    //
    //     let initialHourlyNetStats: netStatsArray = [];
    //
    //     for (let i = 0; i < hourlyAddressCount.length; i++) {
    //         initialHourlyNetStats.push({
    //             ...hourlyBasicInitialNetStats[i],
    //             numberOfAddress: hourlyAddressCount[i].numberOfAddress,
    //         });
    //     }
    //
    //     initialHourlyNetStats.reverse();
    //
    //     socketServer.to(dataPoolServerId).emit("initialHourlyNetStats", initialHourlyNetStats);
    //     console.log(`${currentTimeReadable()} | Emit : 'initialHourlyNetStats' | To : dataPoolServer`);
    // });

    // dataPoolServerが起動したときに発行する"requestInitialHourlyNetStats"イベントを受信した時の処理の登録
    client.on("requestInitialHourlyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestHourlyInitialNetStats' | From : dataPoolServer`);

        // dataPoolServerへ送信する１時間ごとの集計データの初期データとして最新１日分のデータをデータベースから取得
        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM hourlyBasicNetStats
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 25`);

        // データベースの応答データから必要なデータを抽出
        let hourlyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];

        // データが時系列順に並ぶように並び替え
        hourlyBasicInitialNetStats.reverse();

        // １時間ごとの集計データの初期データをdataPoolServerに送信
        socketServer.to(dataPoolServerId).emit("initialHourlyNetStats", hourlyBasicInitialNetStats);
        console.log(`${currentTimeReadable()} | Emit : 'initialHourlyNetStats' | To : dataPoolServer`);
    });

    //
    //Daily events emitter and recorder
    //"dailyAddressCountRecorded" & "dailyBasicNetStatsRecorded" are exclusive events.
    //

    //Listener for the daily net stats.
    // client.on("dailyBasicNetStatsRecorded", (recordOfEthDB: basicNetStats) => {
    //
    //     console.log(`${currentTimeReadable()} | Received : 'dailyBasicNetStatsRecorded' | From : dailyBasicNetStatsRecorder`);
    //
    //     dailyBasicNetStatsData = recordOfEthDB;
    //     dailyBasicNetStatsDate = recordOfEthDB.startTimeUnix;
    //
    //     if (dailyBasicNetStatsData && dailyAddressCountData) {
    //         if (dailyBasicNetStatsDate === dailyAddressCountDate) {
    //             let newDailyNetStats: netStats = {
    //                 ...recordOfEthDB,
    //                 numberOfAddress: dailyAddressCountData.numberOfAddress,
    //             }
    //             client.to(dataPoolServerId).emit('newHourlyNetStats', newDailyNetStats);
    //             dailyBasicNetStatsData = null;
    //             dailyAddressCountData = null;
    //         }
    //     }
    // });

    //Listener for the daily address counter.
    // client.on("dailyAddressCountRecorded", (dailyAddressCount: numberOfAddress) => {
    //
    //     console.log(`${currentTimeReadable()} | Receive : 'dailyAddressCountRecorded' | From : dailyAddressCountRecorder`);
    //
    //     dailyAddressCountData = dailyAddressCount;
    //     dailyAddressCountDate = dailyAddressCount.startTimeUnix;
    //
    //     if (dailyAddressCountData && dailyBasicNetStatsData) {
    //         if (dailyBasicNetStatsDate === dailyAddressCountDate) {
    //             let newDailyNetStats: netStats = {
    //                 ...dailyBasicNetStatsData,
    //                 numberOfAddress: dailyAddressCount.numberOfAddress,
    //             }
    //             client.to(dataPoolServerId).emit('newDailyNetStats', newDailyNetStats);
    //             console.log(`${currentTimeReadable()} | Emit : 'newDailyNetStats' | To : dataPoolServer`);
    //             dailyBasicNetStatsData = null;
    //             dailyAddressCountData = null;
    //         }
    //     }
    // });

    // １日のデータ集計が完了した時のイベント"dailyBasicNetStatsRecorded"を受信した時の処理の登録
    client.on("dailyBasicNetStatsRecorded", (basicNetStats: basicNetStats) => {
        console.log(`${currentTimeReadable()} | Received : 'dailyBasicNetStatsRecorded' | From : dailyBasicNetStatsRecorder`);

        // dataPoolServerに受信したデータを転送
        client.to(dataPoolServerId).emit('newDailyNetStats', basicNetStats);
        console.log(`${currentTimeReadable()} | Emit : newDailyNetStats | To : dataPoolServer | Trigger event : 'dailyBasicNetStatsRecorded'`);
    });

    //Listener for a socketClient of the dataPoolServer.
    // client.on("requestInitialDailyNetStats", async () => {
    //     console.log(`${currentTimeReadable()} | Receive : 'requestDailyInitialNetStats' | From : dataPoolServer`);
    //
    //     let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
    //                                                                   FROM dailyAddressCount
    //                                                                   ORDER BY endTimeUnix DESC
    //                                                                   LIMIT 8`);
    //
    //     let dailyAddressCount: Array<numberOfAddress> = mysqlRes[0];
    //
    //     mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
    //                                                               FROM ethereum.dailyBasicNetStats
    //                                                               WHERE endTimeUnix <= ${dailyAddressCount[0].endTimeUnix}
    //                                                               ORDER BY endTimeUnix DESC
    //                                                               LIMIT 8`);
    //
    //     let dailyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];
    //
    //     let initialDailyNetStats: netStatsArray = [];
    //
    //     for (let i = 0; i < dailyAddressCount.length; i++) {
    //         initialDailyNetStats.push({
    //             ...dailyBasicInitialNetStats[i],
    //             numberOfAddress: dailyAddressCount[i].numberOfAddress,
    //         });
    //     }
    //
    //     initialDailyNetStats.reverse();
    //
    //     socketServer.to(dataPoolServerId).emit("initialDailyNetStats", initialDailyNetStats);
    //     console.log(`${currentTimeReadable()} | Emit : 'initialDailyNetStats' | To : dataPoolServer`);
    // });

    // dataPoolServerが起動したときに発行する"requestInitialDailyNetStats"イベントを受信した時の処理の登録
    client.on("requestInitialDailyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestDailyInitialNetStats' | From : dataPoolServer`);

        // dataPoolServerへ送信する１日ごとの集計データの初期データとして最新１週間分のデータをデータベースから取得
        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM ethereum.dailyBasicNetStats
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 8`);

        // データベースの応答データから必要なデータを抽出
        let dailyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];

        // データが時系列順に並ぶように並び替え
        dailyBasicInitialNetStats.reverse();

        // １日ごとの集計データの初期データをdataPoolServerに送信
        socketServer.to(dataPoolServerId).emit("initialDailyNetStats", dailyBasicInitialNetStats);
        console.log(`${currentTimeReadable()} | Emit : 'initialDailyNetStats' | To : dataPoolServer`);
    });

    //
    //Weekly events emitter and recorder
    //"weeklyAddressCountRecorded" & "weeklyBasicNetStatsRecorded" are exclusive events.
    //

    //Listener for the weekly net stats.
    // client.on("weeklyBasicNetStatsRecorded", (recordOfEthDB: basicNetStats) => {
    //
    //     console.log(`${currentTimeReadable()} | Received : 'weeklyBasicNetStatsRecorded' | From : weeklyBasicNetStatsRecorder`);
    //
    //     weeklyBasicNetStatsData = recordOfEthDB;
    //     weeklyBasicNetStatsDate = recordOfEthDB.startTimeUnix;
    //
    //     if (weeklyBasicNetStatsData && weeklyAddressCountData) {
    //         if (weeklyBasicNetStatsDate === weeklyAddressCountDate) {
    //             let newDailyNetStats: netStats = {
    //                 ...recordOfEthDB,
    //                 numberOfAddress: weeklyAddressCountData.numberOfAddress,
    //             }
    //             client.to(dataPoolServerId).emit('newWeeklyNetStats', newDailyNetStats);
    //             weeklyBasicNetStatsData = null;
    //             weeklyAddressCountData = null;
    //         }
    //     }
    // });

    //Listener for the weekly address counter.
    // client.on("weeklyAddressCountRecorded", (weeklyAddressCount: numberOfAddress) => {
    //
    //     console.log(`${currentTimeReadable()} | Receive : 'weeklyAddressCountRecorded' | From : weeklyAddressCountRecorder`);
    //
    //     weeklyAddressCountData = weeklyAddressCount;
    //     weeklyAddressCountDate = weeklyAddressCount.startTimeUnix;
    //
    //     if (weeklyAddressCountData && weeklyBasicNetStatsData) {
    //         if (weeklyBasicNetStatsDate === weeklyAddressCountDate) {
    //             let newWeeklyNetStats: netStats = {
    //                 ...weeklyBasicNetStatsData,
    //                 numberOfAddress: weeklyAddressCount.numberOfAddress,
    //             }
    //             client.to(dataPoolServerId).emit('newWeeklyNetStats', newWeeklyNetStats);
    //             console.log(`${currentTimeReadable()} | Emit : 'newWeeklyNetStats' | To : dataPoolServer`);
    //             weeklyBasicNetStatsData = null;
    //             weeklyAddressCountData = null;
    //         }
    //     }
    // });

    // １週間のデータ集計が完了した時のイベント"weeklyBasicNetStatsRecorded"を受信した時の処理の登録
    client.on("weeklyBasicNetStatsRecorded", (basicNetStats: basicNetStats) => {

        console.log(`${currentTimeReadable()} | Received : 'weeklyBasicNetStatsRecorded' | From : weeklyBasicNetStatsRecorder`);

        // dataPoolServerに受信したデータを転送
        client.to(dataPoolServerId).emit('newWeeklyNetStats', basicNetStats);
        console.log(`${currentTimeReadable()} | Emit : newWeeklyNetStats | To : dataPoolServer | Trigger event : 'weeklyBasicNetStatsRecorded'`);
    });

    //Listener for a socketClient of the dataPoolServer.
    // client.on("requestInitialWeeklyNetStats", async () => {
    //     console.log(`${currentTimeReadable()} | Receive : 'requestWeeklyInitialNetStats' | From : dataPoolServer`);
    //
    //     let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
    //                                                                   FROM weeklyAddressCount
    //                                                                   ORDER BY endTimeUnix DESC
    //                                                                   LIMIT 25`);
    //
    //     let weeklyAddressCount: Array<numberOfAddress> = mysqlRes[0];
    //
    //     mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
    //                                                               FROM ethereum.weeklyBasicNetStats
    //                                                               WHERE endTimeUnix <= ${weeklyAddressCount[0].endTimeUnix}
    //                                                               ORDER BY endTimeUnix DESC
    //                                                               LIMIT 25`);
    //
    //     let weeklyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];
    //
    //     let initialWeeklyNetStats: netStatsArray = [];
    //
    //     for (let i = 0; i < weeklyAddressCount.length; i++) {
    //         initialWeeklyNetStats.push({
    //             ...weeklyBasicInitialNetStats[i],
    //             numberOfAddress: weeklyAddressCount[i].numberOfAddress,
    //         });
    //     }
    //
    //     initialWeeklyNetStats.reverse();
    //
    //     socketServer.to(dataPoolServerId).emit("initialWeeklyNetStats", initialWeeklyNetStats);
    //     console.log(`${currentTimeReadable()} | Emit : 'initialWeeklyNetStats' | To : dataPoolServer`);
    // });

    // dataPoolServerが起動したときに発行する"requestInitialWeeklyNetStats"イベントを受信した時の処理の登録
    client.on("requestInitialWeeklyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestWeeklyInitialNetStats' | From : dataPoolServer`);

        // dataPoolServerへ送信する１週間ごとの集計データの初期データとして最新２５週間分のデータをデータベースから取得
        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM ethereum.weeklyBasicNetStats
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 25`);

        // データベースの応答データから必要なデータを抽出
        let weeklyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];

        // データが時系列順に並ぶように並び替え
        weeklyBasicInitialNetStats.reverse();

        // １週間ごとの集計データの初期データをdataPoolServerに送信
        socketServer.to(dataPoolServerId).emit("initialWeeklyNetStats", weeklyBasicInitialNetStats);
        console.log(`${currentTimeReadable()} | Emit : 'initialWeeklyNetStats' | To : dataPoolServer`);
    });

    // dataPoolServerが起動したときに発行する"requestInitialBlockData"を受信した時の処理の登録
    // この処理によってトップページの"Latest blocks"セクションの初期表示データがバックエンドから送信されます。
    client.on("requestInitialBlockData", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestInitialBlockData' | From : dataPoolServer`);

        // "blockData"テーブルから最新１０ブロック分のデータを取得
        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM blockData
                                                                      ORDER BY number DESC
                                                                      LIMIT 10`);

        // MySQLの応答データから必要なデータを抽出
        let initialBlockData: blockDataArray = mysqlRes[0];

        // 抽出したデータをdataPoolServerに送信
        socketServer.to(dataPoolServerId).emit("initialBlockData", initialBlockData);
        console.log(`${currentTimeReadable()} | Emit : 'initialBlockData' | To : dataPoolServer`);
    });

    // dataPoolServerから"requestBlockDetail"イベントを受信した時の処理の登録
    // この処理によってユーザーが"Latest Blocks"セクションのブロックナンバーをクリックした時、または"Block list"ページのブロックナンバーをクリックした時
    // に表示する"Block detail"ページの情報が送信されます。
    client.on("requestBlockDetail", async (requestBlockDetail: requestBlockDetail) => {
        console.log(`${currentTimeReadable()} | Receive : 'requestBlockDetail' | From : dataPoolServer | FrontendId : ${requestBlockDetail.frontendId}`);

        // ユーザーが詳細を要求したブロックナンバーを受信データから抽出して、当該ブロックナンバーのブロックデータをデータベースから取得する
        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM blockData
                                                                      WHERE number = ${requestBlockDetail.number}`);

        if (mysqlRes[0].length) {

            // データベースからの応答が空でない場合に応答データから必要なデータを抽出
            let responseBlockDetail: responseBlockDetail = mysqlRes[0][0];

            // ユーザーのsocket.io-clientのIDを応答データに追加
            responseBlockDetail.frontendId = requestBlockDetail.frontendId;

            // データが空でないことを示すフラグを応答データに追加
            responseBlockDetail.noRecord = false;

            // 応答データをdataPoolServerに送信
            socketServer.to(dataPoolServerId).emit('responseBlockDetail', (responseBlockDetail));
            console.log(`${currentTimeReadable()} | Emit : 'responseBlockDetail' | To : dataPoolServer | noRecord : ${responseBlockDetail.noRecord}`);

        } else {

            // データベースからの応答が空の場合に空のデータを代入
            let responseBlockDetail: responseBlockDetail = mysqlRes[0][0];

            // ユーザーのsocket.io-clientのIDを応答データに追加
            responseBlockDetail.frontendId = requestBlockDetail.frontendId;

            // データが空であることを示すフラグを応答データに追加
            responseBlockDetail.noRecord = true;

            // 応答データをdataPoolServerに送信
            socketServer.to(dataPoolServerId).emit('responseBlockDetail', (responseBlockDetail));
            console.log(`${currentTimeReadable()} | Emit : 'responseBlockDetail' | To : dataPoolServer | noRecord : ${responseBlockDetail.noRecord}`);
        }

    });

    // dataPoolServerから"requestBlockList"イベントを受信した時の処理の登録
    // これによりユーザーが"View all blocks"をクリックした時の"Block list"ページの初期表示データが送信されます。
    // "Block list"ページの初期表示ではrequestBlockList.pageOffset=0を受け取ります。
    // また、ユーザーがページ番号をクリックした時の表示データもこの処理によって送信されます。
    // ユーザーがページ番号をクリックしたときはrequestBlockList.pageOffsetにクリックしたページ番号が設定されています。
    client.on('requestBlockList', async (requestBlockList: requestBlockList) => {
        console.log(`${currentTimeReadable()} | Receive : 'requestBlockList' | From : dataPoolServer`);

        // １ページ当たりの表示データ数の定義
        const itemsPerPage: number = 25;

        // 最初にデータベースにおける最新のブロックナンバーを取得する
        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT number
                                                                      FROM blockData
                                                                      ORDER BY number DESC
                                                                      LIMIT 1`);

        // データベースの応答データから最新のブロックナンバーを抽出
        let latestBlockNumber: number = mysqlRes[0][0].number;

        // 最新のブロックナンバーと１ページ当たりの表示データ数からトータルページ数を計算
        let totalPage: number = Math.ceil(latestBlockNumber / itemsPerPage);

        // 要求されたページの最初のブロックナンバーを計算
        let topBlockNumber: number = latestBlockNumber - (itemsPerPage * requestBlockList.pageOffset);

        // 要求されたページの最後のブロックナンバーを計算
        let lastBlockNumber: number = topBlockNumber - itemsPerPage;

        // 要求されたページの全てのブロックデータをデータベースから取得
        mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                  FROM blockData
                                                                  WHERE number >= ${lastBlockNumber}
                                                                    AND number < ${topBlockNumber}
                                                                  ORDER BY number DESC`);

        // 応答データを格納する変数の初期化
        let responseBlockList: responseBlockList = {
            itemsPerPage: 0,
            lastBlockNumber: 0,
            latestBlockNumber: 0,
            list: [],
            pageOffset: 0,
            topBlockNumber: 0,
            totalPage: 0,
            currentPage: 0,
            frontendId: ''
        };

        // 応答データに実データを代入
        responseBlockList.list = mysqlRes[0];
        responseBlockList.latestBlockNumber = latestBlockNumber;
        responseBlockList.totalPage = totalPage;
        responseBlockList.currentPage = requestBlockList.pageOffset;
        responseBlockList.topBlockNumber = topBlockNumber;
        responseBlockList.lastBlockNumber = lastBlockNumber;
        responseBlockList.itemsPerPage = itemsPerPage;
        responseBlockList.pageOffset = requestBlockList.pageOffset;
        responseBlockList.frontendId = requestBlockList.frontendId;

        // 応答データを送信
        socketServer.to(dataPoolServerId).emit('responseBlockList', responseBlockList);
        console.log(`${currentTimeReadable()} | Emit : 'responseBlockList' | To : dataPoolServer`);

    });

    // dataPoolServerから"requestBlockListPageByNumber"イベントを受信した時の処理の登録
    // これにより"Block list"ページでユーザーが入力したブロックナンバーのブロック情報を含むページのデータが送信されます。
    client.on('requestBlockListPageByBlockNumber', async (requestBlockListPageByBlockNumber: requestBlockListPageByBlockNumber) => {

        console.log(`${currentTimeReadable()} | Input block number : ${requestBlockListPageByBlockNumber.blockNumber}`);

        // １ページ当たりの表示データ数の定義
        const itemsPerPage: number = 25;

        // 最初にデータベースにおける最新のブロックナンバーを取得する
        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT number
                                                                      FROM blockData
                                                                      ORDER BY number DESC
                                                                      LIMIT 1`);

        // データベースの応答データから最新のブロックナンバーを抽出
        let latestBlockNumber: number = mysqlRes[0][0].number;

        console.log(`${currentTimeReadable()} | latestBlockNumber : ${latestBlockNumber}`);

        // 最新のブロックナンバーと１ページ当たりの表示データ数からトータルページ数を計算
        let totalPage: number = Math.ceil(latestBlockNumber / itemsPerPage);

        console.log(`${currentTimeReadable()} | totalPage : ${totalPage}`);

        // ユーザーが入力したブロック番号を含むページを特定するための変数の定義
        let pageNumber: number = 1;
        let topBlockNumber: number = latestBlockNumber;
        let bottomBlockNumber: number = topBlockNumber - itemsPerPage;

        // ユーザーが入力したブロック番号を含むページと、当該ページの最初及び最後のブロックナンバーを特定
        while (!(requestBlockListPageByBlockNumber.blockNumber <= topBlockNumber && requestBlockListPageByBlockNumber.blockNumber > bottomBlockNumber)) {
            topBlockNumber -= itemsPerPage;
            bottomBlockNumber -= itemsPerPage;
            ++pageNumber;
        }

        console.log(`${currentTimeReadable()} | pageNumber : ${pageNumber}`);
        console.log(`${currentTimeReadable()} | topBlockNumberTest : ${topBlockNumber}`);
        console.log(`${currentTimeReadable()} | bottomBlockNumberTest : ${bottomBlockNumber}`);

        // 特定したページに含まれるブロックデータをデータベースから取得
        mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                  FROM blockData
                                                                  WHERE number > ${bottomBlockNumber}
                                                                    AND number <= ${topBlockNumber}
                                                                  ORDER BY number DESC`);

        // 応答データを格納する変数の初期化
        let responseBlockListPageByBlockNumber: responseBlockListPageByBlockNumber = {
            itemsPerPage: 0,
            lastBlockNumber: 0,
            latestBlockNumber: 0,
            list: [],
            pageOffset: 0,
            topBlockNumber: 0,
            totalPage: 0,
            currentPage: 0,
            frontendId: ''
        };

        // 応答データに実データを代入
        responseBlockListPageByBlockNumber.list = mysqlRes[0];
        responseBlockListPageByBlockNumber.latestBlockNumber = latestBlockNumber;
        responseBlockListPageByBlockNumber.totalPage = totalPage;
        responseBlockListPageByBlockNumber.currentPage = pageNumber;
        responseBlockListPageByBlockNumber.topBlockNumber = topBlockNumber;
        responseBlockListPageByBlockNumber.lastBlockNumber = bottomBlockNumber;
        responseBlockListPageByBlockNumber.itemsPerPage = itemsPerPage;
        responseBlockListPageByBlockNumber.pageOffset = pageNumber;
        responseBlockListPageByBlockNumber.frontendId = requestBlockListPageByBlockNumber.frontendId;

        // 応答データをdataPoolServerに送信
        socketServer.to(dataPoolServerId).emit('responseBlockList', responseBlockListPageByBlockNumber);
        console.log(`${currentTimeReadable()} | Emit : 'responseBlockListPageByBlockNumber' | To : dataPoolServer`);
    });

});
