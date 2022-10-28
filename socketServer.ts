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
    netStatsArray,
    recordOfEthDB,
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
let socketClientId: string = '';

//Define socket-io client name.
const minutelyBasicNetStatsMakerName: string = 'minutelyBasicNetStatsMaker';
const hourlyBasicNetStatsMakerName: string = 'hourlyBasicNetStatsMaker';
const dailyBasicNetStatsMakerName: string = 'dailyBasicNetStatsMaker';
const weeklyBasicNetStatsMakerName: string = 'weeklyBasicNetStatsMaker';

const minutelyAddressCounterName: string = 'minutelyAddressCounter';
const hourlyAddressCounterName: string = 'hourlyAddressCounter';
const dailyAddressCounterName: string = 'dailyAddressCounter';
const weeklyAddressCounterName: string = 'weeklyAddressCounter';

const blockDataRecorderName: string = 'blockDataRecorder';
const newAddressRecorderName: string = 'newAddressRecorder';
const dataPoolServerName: string = "dataPoolServer";

//Define control minutely data emitter variables.
let minutelyBasicNetStatsDate: number | null;
let minutelyBasicNetStatsData: recordOfEthDB | null;
let minutelyAddressCountDate: number | null;
let minutelyAddressCountData: numberOfAddress | null;

let hourlyBasicNetStatsDate: number | null;
let hourlyBasicNetStatsData: recordOfEthDB | null;
let hourlyAddressCountDate: number | null;
let hourlyAddressCountData: numberOfAddress | null;

let dailyBasicNetStatsDate: number | null;
let dailyBasicNetStatsData: recordOfEthDB | null;
let dailyAddressCountDate: number | null;
let dailyAddressCountData: numberOfAddress | null;

let weeklyBasicNetStatsDate: number | null;
let weeklyBasicNetStatsData: recordOfEthDB | null;
let weeklyAddressCountDate: number | null;
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
            socketClientId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${dataPoolServerName}`);
            break;
    }

    //Listener for the block data recorder.
    client.on("newBlockDataRecorded", (blockNumberWithTimestamp: blockNumberWithTimestamp) => {
        socketServer.to(minutelyBasicNetStatsMakerId).emit("newBlockDataRecorded", blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> minutelyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
        socketServer.to(hourlyBasicNetStatsMakerId).emit('newBlockDataRecorded', blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> hourlyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
        socketServer.to(dailyBasicNetStatsMakerId).emit('newBlockDataRecorded', blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> dailyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
        socketServer.to(weeklyBasicNetStatsMakerId).emit('newBlockDataRecorded', blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> weeklyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
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
    client.on("minutelyBasicNetStatsRecorded", (recordOfEthDB: recordOfEthDB) => {

        console.log(`${currentTimeReadable()} | Receive : 'minutelyBasicNetStatsRecorded' | From : minutelyBasicNetStatsRecorder`);

        minutelyBasicNetStatsData = recordOfEthDB;
        minutelyBasicNetStatsDate = recordOfEthDB.startTimeUnix;

        if (minutelyBasicNetStatsData && minutelyAddressCountData) {
            if (minutelyBasicNetStatsDate === minutelyAddressCountDate) {
                let newMinutelyNetStats: netStats = {
                    ...recordOfEthDB,
                    numberOfAddress: minutelyAddressCountData.numberOfAddress,
                }
                client.to(socketClientId).emit('newMinutelyNetStats', newMinutelyNetStats);
                console.log(`${currentTimeReadable()} | Emit : minutelyNetStats | To : dataPoolServer | Trigger event : 'minutelyBasicNetStatsRecorded'`);
                minutelyBasicNetStatsData = null;
                minutelyAddressCountData = null;
            }
        }
    });

    //Listener for the minutely address counter.
    client.on("minutelyAddressCountRecorded", (minutelyAddressCount: numberOfAddress) => {

        console.log(`${currentTimeReadable()} | Receive : 'minutelyAddressCountRecorded' | From : minutelyAddressCounter`);

        minutelyAddressCountData = minutelyAddressCount;
        minutelyAddressCountDate = minutelyAddressCount.startTimeUnix;

        if (minutelyAddressCountData && minutelyBasicNetStatsData) {
            if (minutelyBasicNetStatsDate === minutelyAddressCountDate) {
                let newMinutelyNetStats: netStats = {
                    ...minutelyBasicNetStatsData,
                    numberOfAddress: minutelyAddressCount.numberOfAddress,
                }
                client.timeout(5000).to(socketClientId).emit('newMinutelyNetStats', newMinutelyNetStats);
                console.log(`${currentTimeReadable()} | Emit : 'newMinutelyNetStats' | To : dataPoolServer | Trigger event : 'minutelyAddressCountRecorded'`);
                minutelyBasicNetStatsData = null;
                minutelyAddressCountData = null;
            }
        }
    });

    //Listener for a socketClient of the dataPoolServer.
    client.on("requestInitialMinutelyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestMinutelyInitialNetStats' | From : dataPoolServer`);

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM minutelyAddressCount
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 61`);

        let minutelyAddressCount: Array<numberOfAddress> = mysqlRes[0];

        mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                  FROM ethereum.minutelyBasicNetStats
                                                                  WHERE endTimeUnix <= ${minutelyAddressCount[0].endTimeUnix}
                                                                  ORDER BY endTimeUnix DESC
                                                                  LIMIT 61`);

        let minutelyBasicInitialNetStats: Array<recordOfEthDB> = mysqlRes[0];

        let initialMinutelyNetStats: netStatsArray = [];

        for (let i = 0; i < minutelyAddressCount.length; i++) {
            initialMinutelyNetStats.push({
                ...minutelyBasicInitialNetStats[i],
                numberOfAddress: minutelyAddressCount[i].numberOfAddress,
            });
        }

        initialMinutelyNetStats.reverse();

        socketServer.to(socketClientId).emit("initialMinutelyNetStats", initialMinutelyNetStats);
        console.log(`${currentTimeReadable()} | Emit : 'initialMinutelyNetStats' | To : dataPoolServer`);
    });

    //
    //Hourly events emitter and recorder
    //"hourlyAddressCountRecorded" & "hourlyBasicNetStatsRecorded" are exclusive events.
    //

    //Listener for the minutely net stats.
    client.on("hourlyBasicNetStatsRecorded", (recordOfEthDB: recordOfEthDB) => {

        console.log(`${currentTimeReadable()} | Received : 'hourlyBasicNetStatsRecorded' | From : hourlyBasicNetStatsRecorder`);

        hourlyBasicNetStatsData = recordOfEthDB;
        hourlyBasicNetStatsDate = recordOfEthDB.startTimeUnix;

        if (hourlyBasicNetStatsData && hourlyAddressCountData) {
            if (hourlyBasicNetStatsDate === hourlyAddressCountDate) {
                let newHourlyNetStats: netStats = {
                    ...recordOfEthDB,
                    numberOfAddress: hourlyAddressCountData.numberOfAddress,
                }
                client.to(socketClientId).emit('newHourlyNetStats', newHourlyNetStats);
                hourlyBasicNetStatsData = null;
                hourlyAddressCountData = null;
            }
        }
    });

    //Listener for the minutely address counter.
    client.on("hourlyAddressCountRecorded", (hourlyAddressCount: numberOfAddress) => {

        console.log(`${currentTimeReadable()} | Receive : 'hourlyAddressCountRecorded' | From : hourlyAddressCountRecorder`);

        hourlyAddressCountData = hourlyAddressCount;
        hourlyAddressCountDate = hourlyAddressCount.startTimeUnix;

        if (hourlyAddressCountData && hourlyBasicNetStatsData) {
            if (hourlyBasicNetStatsDate === hourlyAddressCountDate) {
                let newHourlyNetStats: netStats = {
                    ...hourlyBasicNetStatsData,
                    numberOfAddress: hourlyAddressCount.numberOfAddress,
                }
                client.to(socketClientId).emit('newHourlyNetStats', newHourlyNetStats);
                console.log(`${currentTimeReadable()} | Emit : 'newHourlyNetStats' | To : dataPoolServer`);
                hourlyBasicNetStatsData = null;
                hourlyAddressCountData = null;
            }
        }
    });

    //Listener for a socketClient of the dataPoolServer.
    client.on("requestInitialHourlyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestHourlyInitialNetStats' | From : dataPoolServer`);

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM hourlyAddressCount
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 25`);

        let hourlyAddressCount: Array<numberOfAddress> = mysqlRes[0];

        mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                  FROM ethereum.hourlyBasicNetStats
                                                                  WHERE endTimeUnix <= ${hourlyAddressCount[0].endTimeUnix}
                                                                  ORDER BY endTimeUnix DESC
                                                                  LIMIT 25`);

        let hourlyBasicInitialNetStats: Array<recordOfEthDB> = mysqlRes[0];

        let initialHourlyNetStats: netStatsArray = [];

        for (let i = 0; i < hourlyAddressCount.length; i++) {
            initialHourlyNetStats.push({
                ...hourlyBasicInitialNetStats[i],
                numberOfAddress: hourlyAddressCount[i].numberOfAddress,
            });
        }

        initialHourlyNetStats.reverse();

        socketServer.to(socketClientId).emit("initialHourlyNetStats", initialHourlyNetStats);
        console.log(`${currentTimeReadable()} | Emit : 'initialHourlyNetStats' | To : dataPoolServer`);
    });

    //
    //Daily events emitter and recorder
    //"dailyAddressCountRecorded" & "dailyBasicNetStatsRecorded" are exclusive events.
    //

    //Listener for the minutely net stats.
    client.on("dailyBasicNetStatsRecorded", (recordOfEthDB: recordOfEthDB) => {

        console.log(`${currentTimeReadable()} | Received : 'dailyBasicNetStatsRecorded' | From : dailyBasicNetStatsRecorder`);

        dailyBasicNetStatsData = recordOfEthDB;
        dailyBasicNetStatsDate = recordOfEthDB.startTimeUnix;

        if (dailyBasicNetStatsData && dailyAddressCountData) {
            if (dailyBasicNetStatsDate === dailyAddressCountDate) {
                let newDailyNetStats: netStats = {
                    ...recordOfEthDB,
                    numberOfAddress: dailyAddressCountData.numberOfAddress,
                }
                client.to(socketClientId).emit('newHourlyNetStats', newDailyNetStats);
                dailyBasicNetStatsData = null;
                dailyAddressCountData = null;
            }
        }
    });

    //Listener for the minutely address counter.
    client.on("dailyAddressCountRecorded", (dailyAddressCount: numberOfAddress) => {

        console.log(`${currentTimeReadable()} | Receive : 'dailyAddressCountRecorded' | From : dailyAddressCountRecorder`);

        dailyAddressCountData = dailyAddressCount;
        dailyAddressCountDate = dailyAddressCount.startTimeUnix;

        if (dailyAddressCountData && dailyBasicNetStatsData) {
            if (dailyBasicNetStatsDate === dailyAddressCountDate) {
                let newDailyNetStats: netStats = {
                    ...dailyBasicNetStatsData,
                    numberOfAddress: dailyAddressCount.numberOfAddress,
                }
                client.to(socketClientId).emit('newDailyNetStats', newDailyNetStats);
                console.log(`${currentTimeReadable()} | Emit : 'newDailyNetStats' | To : dataPoolServer`);
                dailyBasicNetStatsData = null;
                dailyAddressCountData = null;
            }
        }
    });

    //Listener for a socketClient of the dataPoolServer.
    client.on("requestInitialDailyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestDailyInitialNetStats' | From : dataPoolServer`);

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM dailyAddressCount
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 8`);

        let dailyAddressCount: Array<numberOfAddress> = mysqlRes[0];

        mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                  FROM ethereum.dailyBasicNetStats
                                                                  WHERE endTimeUnix <= ${dailyAddressCount[0].endTimeUnix}
                                                                  ORDER BY endTimeUnix DESC
                                                                  LIMIT 8`);

        let dailyBasicInitialNetStats: Array<recordOfEthDB> = mysqlRes[0];

        let initialDailyNetStats: netStatsArray = [];

        for (let i = 0; i < dailyAddressCount.length; i++) {
            initialDailyNetStats.push({
                ...dailyBasicInitialNetStats[i],
                numberOfAddress: dailyAddressCount[i].numberOfAddress,
            });
        }

        initialDailyNetStats.reverse();

        socketServer.to(socketClientId).emit("initialDailyNetStats", initialDailyNetStats);
        console.log(`${currentTimeReadable()} | Emit : 'initialDailyNetStats' | To : dataPoolServer`);
    });

    //
    //Weekly events emitter and recorder
    //"weeklyAddressCountRecorded" & "weeklyBasicNetStatsRecorded" are exclusive events.
    //

    //Listener for the minutely net stats.
    client.on("weeklyBasicNetStatsRecorded", (recordOfEthDB: recordOfEthDB) => {

        console.log(`${currentTimeReadable()} | Received : 'weeklyBasicNetStatsRecorded' | From : weeklyBasicNetStatsRecorder`);

        weeklyBasicNetStatsData = recordOfEthDB;
        weeklyBasicNetStatsDate = recordOfEthDB.startTimeUnix;

        if (weeklyBasicNetStatsData && weeklyAddressCountData) {
            if (weeklyBasicNetStatsDate === weeklyAddressCountDate) {
                let newDailyNetStats: netStats = {
                    ...recordOfEthDB,
                    numberOfAddress: weeklyAddressCountData.numberOfAddress,
                }
                client.to(socketClientId).emit('newHourlyNetStats', newDailyNetStats);
                weeklyBasicNetStatsData = null;
                weeklyAddressCountData = null;
            }
        }
    });

    //Listener for the minutely address counter.
    client.on("weeklyAddressCountRecorded", (weeklyAddressCount: numberOfAddress) => {

        console.log(`${currentTimeReadable()} | Receive : 'weeklyAddressCountRecorded' | From : weeklyAddressCountRecorder`);

        weeklyAddressCountData = weeklyAddressCount;
        weeklyAddressCountDate = weeklyAddressCount.startTimeUnix;

        if (weeklyAddressCountData && weeklyBasicNetStatsData) {
            if (weeklyBasicNetStatsDate === weeklyAddressCountDate) {
                let newWeeklyNetStats: netStats = {
                    ...weeklyBasicNetStatsData,
                    numberOfAddress: weeklyAddressCount.numberOfAddress,
                }
                client.to(socketClientId).emit('newWeeklyNetStats', newWeeklyNetStats);
                console.log(`${currentTimeReadable()} | Emit : 'newWeeklyNetStats' | To : dataPoolServer`);
                weeklyBasicNetStatsData = null;
                weeklyAddressCountData = null;
            }
        }
    });

    //Listener for a socketClient of the dataPoolServer.
    client.on("requestInitialWeeklyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestWeeklyInitialNetStats' | From : dataPoolServer`);

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM weeklyAddressCount
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 8`);

        let weeklyAddressCount: Array<numberOfAddress> = mysqlRes[0];

        mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                  FROM ethereum.weeklyBasicNetStats
                                                                  WHERE endTimeUnix <= ${weeklyAddressCount[0].endTimeUnix}
                                                                  ORDER BY endTimeUnix DESC
                                                                  LIMIT 8`);

        let weeklyBasicInitialNetStats: Array<recordOfEthDB> = mysqlRes[0];

        let initialWeeklyNetStats: netStatsArray = [];

        for (let i = 0; i < weeklyAddressCount.length; i++) {
            initialWeeklyNetStats.push({
                ...weeklyBasicInitialNetStats[i],
                numberOfAddress: weeklyAddressCount[i].numberOfAddress,
            });
        }

        initialWeeklyNetStats.reverse();

        socketServer.to(socketClientId).emit("initialWeeklyNetStats", initialWeeklyNetStats);
        console.log(`${currentTimeReadable()} | Emit : 'initialWeeklyNetStats' | To : dataPoolServer`);
    });

});
