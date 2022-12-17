//Import environment variables.
import "dotenv/config";

//Import packages.
import {Server} from "socket.io";

//Import self-made packages.
import {currentTimeReadable, unixTimeReadable} from "@pierogi.dev/readable_time";
import {getMysqlConnection, RowDataPacket} from "@pierogi.dev/get_mysql_connection";

//Import socket event definitions.
import type {ClientToServerEvents, ServerToClientEvents} from "./types/socketEvents";

//Import types.
import type {
    blockNumberWithTimestamp,
    numberOfAddress,
    netStats,
    basicNetStats,
    blockDataArray,
    blockData,
    responseBlockDetail,
    responseBlockList,
    requestBlockListPageByBlockNumber,
    responseBlockListPageByBlockNumber,
} from "./types/types";

import type {Pool} from "@pierogi.dev/get_mysql_connection";

const mysqlConnection: Pool = await getMysqlConnection(false);

//Launch a socket-io server.
const socketServer: Server<ClientToServerEvents, ServerToClientEvents> = new Server(6000);

//Define socket-io client id variable.
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

//Define socket-io client name.
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

//Define variables for the minutely data handler.
let minutelyBasicNetStatsDate: number | null;
let minutelyBasicNetStatsData: basicNetStats | null;
// let minutelyAddressCountDate: number | null;
let minutelyAddressCountData: numberOfAddress | null;

//Define variables for the hourly data handler.
let hourlyBasicNetStatsDate: number | null;
let hourlyBasicNetStatsData: basicNetStats | null;
// let hourlyAddressCountDate: number | null;
let hourlyAddressCountData: numberOfAddress | null;

//Define variables for the daily data handler.
let dailyBasicNetStatsDate: number | null;
let dailyBasicNetStatsData: basicNetStats | null;
// let dailyAddressCountDate: number | null;
let dailyAddressCountData: numberOfAddress | null;

//Define variables for the weekly data handler.
let weeklyBasicNetStatsDate: number | null;
let weeklyBasicNetStatsData: basicNetStats | null;
// let weeklyAddressCountDate: number | null;
let weeklyAddressCountData: numberOfAddress | null;

socketServer.on('connection', (client) => {
    console.log(`${currentTimeReadable()} | Connect with a socket client. ID : ${client.id}`);

    //Store client socket id.
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

    //Listener for the block data recorder.
    client.on("newBlockDataRecorded", async (blockNumberWithTimestamp: blockNumberWithTimestamp) => {

        console.log(`${currentTimeReadable()} | Receive : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber && blockNumberWithTimestamp.blockNumber} | Timestamp : ${blockNumberWithTimestamp.timestamp && unixTimeReadable(blockNumberWithTimestamp.timestamp)}`);

        socketServer.to(minutelyBasicNetStatsMakerId).emit("newBlockDataRecorded", blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> minutelyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
        socketServer.to(hourlyBasicNetStatsMakerId).emit('newBlockDataRecorded', blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> hourlyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
        socketServer.to(dailyBasicNetStatsMakerId).emit('newBlockDataRecorded', blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> dailyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
        socketServer.to(weeklyBasicNetStatsMakerId).emit('newBlockDataRecorded', blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> weeklyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);

        let [mysqlRes] = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                        FROM blockData
                                                                        WHERE timestamp = ${blockNumberWithTimestamp.timestamp}`);

        let newBlockData: blockData = mysqlRes[0];

        socketServer.to(dataPoolServerId).emit('newBlockData', newBlockData);
        console.log(`${currentTimeReadable()} | Emit : 'newBlockData' | To : dataPoolServer`);
    });

    //Listener for the new address recorder.
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

    //Listener for the minutely net stats.
    client.on("minutelyBasicNetStatsRecorded", (basicNetStats: basicNetStats) => {
        console.log(`${currentTimeReadable()} | Receive :'minutelyBasicNetStatsRecorded' | From : minutelyBasicNetStatsRecorder`);

        minutelyBasicNetStatsData = basicNetStats;
        minutelyBasicNetStatsDate = basicNetStats.startTimeUnix;

        let newMinutelyNetStats: netStats = {
            ...basicNetStats,
        }

        client.to(dataPoolServerId).emit('newMinutelyNetStats', newMinutelyNetStats);
        console.log(`${currentTimeReadable()} | Emit : minutelyNetStats | To : dataPoolServer | Trigger event : 'minutelyBasicNetStatsRecorded'`);
        minutelyBasicNetStatsData = null;
        minutelyAddressCountData = null;
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

    client.on("requestInitialMinutelyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestMinutelyInitialNetStats' | From : dataPoolServer`);

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM ethereum.minutelyBasicNetStats
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 61`);

        let minutelyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];

        minutelyBasicInitialNetStats.reverse();

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

    client.on("hourlyBasicNetStatsRecorded", (basicNetStats: basicNetStats) => {

        console.log(`${currentTimeReadable()} | Received : 'hourlyBasicNetStatsRecorded' | From : hourlyBasicNetStatsRecorder`);

        hourlyBasicNetStatsData = basicNetStats;
        hourlyBasicNetStatsDate = basicNetStats.startTimeUnix;

        let newHourlyNetStats: netStats = {
            ...basicNetStats,
        }

        client.to(dataPoolServerId).emit('newHourlyNetStats', newHourlyNetStats);
        hourlyBasicNetStatsData = null;
        hourlyAddressCountData = null;

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

    client.on("requestInitialHourlyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestHourlyInitialNetStats' | From : dataPoolServer`);

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM hourlyBasicNetStats
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 25`);

        let hourlyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];

        hourlyBasicInitialNetStats.reverse();

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

    client.on("dailyBasicNetStatsRecorded", (basicNetStats: basicNetStats) => {

        console.log(`${currentTimeReadable()} | Received : 'dailyBasicNetStatsRecorded' | From : dailyBasicNetStatsRecorder`);

        dailyBasicNetStatsData = basicNetStats;
        dailyBasicNetStatsDate = basicNetStats.startTimeUnix;

        let newDailyNetStats: netStats = {
            ...basicNetStats,
        }

        client.to(dataPoolServerId).emit('newHourlyNetStats', newDailyNetStats);
        dailyBasicNetStatsData = null;
        dailyAddressCountData = null;

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

    client.on("requestInitialDailyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestDailyInitialNetStats' | From : dataPoolServer`);

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM ethereum.dailyBasicNetStats
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 8`);

        let dailyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];

        dailyBasicInitialNetStats.reverse();

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

    client.on("weeklyBasicNetStatsRecorded", (basicNetStats: basicNetStats) => {

        console.log(`${currentTimeReadable()} | Received : 'weeklyBasicNetStatsRecorded' | From : weeklyBasicNetStatsRecorder`);

        weeklyBasicNetStatsData = basicNetStats;
        weeklyBasicNetStatsDate = basicNetStats.startTimeUnix;

        let newDailyNetStats: netStats = {
            ...basicNetStats,
        }

        client.to(dataPoolServerId).emit('newWeeklyNetStats', newDailyNetStats);
        weeklyBasicNetStatsData = null;
        weeklyAddressCountData = null;
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

    client.on("requestInitialWeeklyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestWeeklyInitialNetStats' | From : dataPoolServer`);

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM ethereum.weeklyBasicNetStats
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 25`);

        let weeklyBasicInitialNetStats: Array<basicNetStats> = mysqlRes[0];

        weeklyBasicInitialNetStats.reverse();

        socketServer.to(dataPoolServerId).emit("initialWeeklyNetStats", weeklyBasicInitialNetStats);
        console.log(`${currentTimeReadable()} | Emit : 'initialWeeklyNetStats' | To : dataPoolServer`);
    });

    //Listener for the socket client of the dataPoolServer regarding blockData.
    client.on("requestInitialBlockData", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestInitialBlockData' | From : dataPoolServer`);

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM blockData
                                                                      ORDER BY number DESC
                                                                      LIMIT 10`);

        let initialBlockData: blockDataArray = mysqlRes[0];

        socketServer.to(dataPoolServerId).emit("initialBlockData", initialBlockData);
        console.log(`${currentTimeReadable()} | Emit : 'initialBlockData' | To : dataPoolServer`);
    });

    //Listener for the requestBlockDetail event.
    client.on("requestBlockDetail", async (requestBlockDetail) => {
        console.log(`${currentTimeReadable()} | Receive : 'requestBlockDetail' | From : dataPoolServer | FrontendId : ${requestBlockDetail.frontendId}`);

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM blockData
                                                                      WHERE number = ${requestBlockDetail.number}`);

        if (mysqlRes[0].length) {

            let responseBlockDetail: responseBlockDetail = mysqlRes[0][0];
            responseBlockDetail.frontendId = requestBlockDetail.frontendId;
            responseBlockDetail.noRecord = false;

            socketServer.to(dataPoolServerId).emit('responseBlockDetail', (responseBlockDetail));
            console.log(`${currentTimeReadable()} | Emit : 'responseBlockDetail' | To : dataPoolServer | noRecord : ${responseBlockDetail.noRecord}`);

        } else {

            let responseBlockDetail: responseBlockDetail = mysqlRes[0][0];
            responseBlockDetail.frontendId = requestBlockDetail.frontendId;
            responseBlockDetail.noRecord = true;

            socketServer.to(dataPoolServerId).emit('responseBlockDetail', (responseBlockDetail));
            console.log(`${currentTimeReadable()} | Emit : 'responseBlockDetail' | To : dataPoolServer | noRecord : ${responseBlockDetail.noRecord}`);
        }

    });

    //Listener for the requestBlockList event.
    client.on('requestBlockList', async (requestBlockList) => {
        console.log(`${currentTimeReadable()} | Receive : 'requestBlockList' | From : dataPoolServer`);

        const itemsPerPage: number = 25;

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT number
                                                                      FROM blockData
                                                                      ORDER BY number DESC
                                                                      LIMIT 1`);

        let latestBlockNumber: number = mysqlRes[0][0].number;

        let totalPage: number = Math.ceil(latestBlockNumber / itemsPerPage);

        let topBlockNumber: number = latestBlockNumber - (itemsPerPage * requestBlockList.pageOffset);

        let lastBlockNumber: number = topBlockNumber - itemsPerPage;

        mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                  FROM blockData
                                                                  WHERE number >= ${lastBlockNumber}
                                                                    AND number < ${topBlockNumber}
                                                                  ORDER BY number DESC`);

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

        responseBlockList.list = mysqlRes[0];
        responseBlockList.latestBlockNumber = latestBlockNumber;
        responseBlockList.totalPage = totalPage;
        responseBlockList.currentPage = requestBlockList.pageOffset;
        responseBlockList.topBlockNumber = topBlockNumber;
        responseBlockList.lastBlockNumber = lastBlockNumber;
        responseBlockList.itemsPerPage = itemsPerPage;
        responseBlockList.pageOffset = requestBlockList.pageOffset;
        responseBlockList.frontendId = requestBlockList.frontendId;

        socketServer.to(dataPoolServerId).emit('responseBlockList', responseBlockList);
        console.log(`${currentTimeReadable()} | Emit : 'responseBlockList' | To : dataPoolServer`);

    });

    //Listener for the requestBlockListPageByBlockNumber event.
    client.on('requestBlockListPageByBlockNumber', async (requestBlockListPageByBlockNumber: requestBlockListPageByBlockNumber) => {

        console.log(`${currentTimeReadable()} | Input block number : ${requestBlockListPageByBlockNumber.blockNumber}`);

        const itemsPerPage: number = 25;

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT number
                                                                      FROM blockData
                                                                      ORDER BY number DESC
                                                                      LIMIT 1`);

        let latestBlockNumber: number = mysqlRes[0][0].number;

        console.log(`${currentTimeReadable()} | latestBlockNumber : ${latestBlockNumber}`);

        let totalPage: number = Math.ceil(latestBlockNumber / itemsPerPage);

        console.log(`${currentTimeReadable()} | totalPage : ${totalPage}`);

        let currentPage: number = totalPage - (Math.ceil(requestBlockListPageByBlockNumber.blockNumber / itemsPerPage));

        // for (let i = 0; i < totalPage; i++) {
        //     console.log(`${currentTimeReadable()} | i : ${i}`);
        //     console.log(`${currentTimeReadable()} | requestBlockListPageByBlockNumber.blockNumber : ${requestBlockListPageByBlockNumber.blockNumber}`);
        //     console.log(`${currentTimeReadable()} | latestBlockNumber - (itemsPerPage * i) | ${latestBlockNumber - (itemsPerPage * i)}`);
        //     if (latestBlockNumber - (itemsPerPage * i) < requestBlockListPageByBlockNumber.blockNumber) {
        //         console.log(`${currentTimeReadable()} | currentPage : ${currentPage}`);
        //         currentPage = i - 1;
        //         break;
        //     }
        // }
        //
        // console.log(`${currentTimeReadable()} | blockNumber / itemsPerPage : ${Math.ceil(requestBlockListPageByBlockNumber.blockNumber / itemsPerPage)}`);
        // console.log(`${currentTimeReadable()} | new currentPage : ${totalPage - (Math.ceil(requestBlockListPageByBlockNumber.blockNumber / itemsPerPage))}`);

        console.log(`${currentTimeReadable()} | currentPage : ${currentPage}`);

        let topBlockNumber: number = (totalPage - currentPage) * itemsPerPage;

        console.log(`${currentTimeReadable()} | topBlockNumber : ${topBlockNumber}`);

        let lastBlockNumber: number = topBlockNumber - itemsPerPage;

        console.log(`${currentTimeReadable()} | lastBlockNumber : ${lastBlockNumber}`);

        mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                  FROM blockData
                                                                  WHERE number >= ${lastBlockNumber}
                                                                    AND number < ${topBlockNumber}
                                                                  ORDER BY number DESC`);

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

        responseBlockListPageByBlockNumber.list = mysqlRes[0];
        responseBlockListPageByBlockNumber.latestBlockNumber = latestBlockNumber;
        responseBlockListPageByBlockNumber.totalPage = totalPage;
        responseBlockListPageByBlockNumber.currentPage = currentPage;
        responseBlockListPageByBlockNumber.topBlockNumber = topBlockNumber;
        responseBlockListPageByBlockNumber.lastBlockNumber = lastBlockNumber;
        responseBlockListPageByBlockNumber.itemsPerPage = itemsPerPage;
        responseBlockListPageByBlockNumber.pageOffset = currentPage;
        responseBlockListPageByBlockNumber.frontendId = requestBlockListPageByBlockNumber.frontendId;

        socketServer.to(dataPoolServerId).emit('responseBlockList', responseBlockListPageByBlockNumber);
        console.log(`${currentTimeReadable()} | Emit : 'responseBlockListPageByBlockNumber' | To : dataPoolServer`);
    });

});
