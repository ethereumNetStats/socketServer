//Import environment variables.
import "dotenv/config";

//Import packages.
import {Server} from "socket.io";

//Import self-made packages.
import {currentTimeReadable, unixTimeReadable} from "@pierogi.dev/readable_time";
import {getMysqlConnection, RowDataPacket} from "@pierogi.dev/get_mysql_connection";

//Import socket event definitions.
import type {ClientToServerEvents, ServerToClientEvents} from "./socketEvents";

//Import types.
import type {
    blockNumberWithTimestamp,
    numberOfAddress,
    netStats,
    netStatsArray,
    recordOfEthDB,
} from "./types";

import type {Pool} from "@pierogi.dev/get_mysql_connection";

const mysqlConnection: Pool = await getMysqlConnection(false);

//Launch a socket-io server.
const socketServer: Server<ClientToServerEvents, ServerToClientEvents> = new Server(6000);

//Define socket-io client id variable.
let minutelyBasicNetStatsMakerId: string = '';
let hourlyBasicNetStatsMakerId: string = '';
let minutelyAddressCounterId: string = '';
let hourlyAddressCounterId: string = '';
let blockDataRecorderId: string = '';
let newAddressRecorderId: string = '';
let socketClientId: string = '';

//Define socket-io client name.
const minutelyBasicNetStatsMakerName: string = 'minutelyBasicNetStatsMaker';
const hourlyBasicNetStatsMakerName: string = 'hourlyBasicNetStatsMaker';
const minutelyAddressCounterName: string = 'minutelyAddressCounter';
const hourlyAddressCounterName: string = 'hourlyAddressCounter';
const blockDataRecorderName: string = 'blockDataRecorder';
const newAddressRecorderName: string = 'newAddressRecorder';
const socketClientName: string = "socketClient";

//Define control minutely data emitter variables.
let minutelyBasicNetStatsDate: number | null;
let minutelyBasicNetStatsData: recordOfEthDB | null;
let minutelyAddressCountDate: number | null;
let minutelyAddressCountData: numberOfAddress | null;
let hourlyBasicNetStatsDate: number | null;
let hourlyBasicNetStatsData: recordOfEthDB | null;
let hourlyAddressCountDate: number | null;
let hourlyAddressCountData: numberOfAddress | null;

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

        case minutelyAddressCounterName:
            minutelyAddressCounterId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${minutelyAddressCounterName}`);
            break;

        case hourlyAddressCounterName:
            hourlyAddressCounterId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${hourlyAddressCounterName}`);
            break;

        case blockDataRecorderName:
            blockDataRecorderId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${blockDataRecorderName}`);
            break;

        case newAddressRecorderName:
            newAddressRecorderId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${newAddressRecorderName}`);
            break;

        case socketClientName:
            socketClientId = client.id;
            console.log(`${currentTimeReadable()} | Connect : ${socketClientName}`);
            break;
    }

    //Listener for the block data recorder.
    client.on("newBlockDataRecorded", (blockNumberWithTimestamp: blockNumberWithTimestamp) => {
        socketServer.to(minutelyBasicNetStatsMakerId).emit("newBlockDataRecorded", blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> minutelyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
        socketServer.to(hourlyBasicNetStatsMakerId).emit('newBlockDataRecorded', blockNumberWithTimestamp);
        console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> hourlyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
    });

    //Listener for the new address recorder.
    client.on("addressChecked", (blockNumber: number) => {
        socketServer.to(minutelyAddressCounterId).emit("addressChecked", blockNumber);
        console.log(`${currentTimeReadable()} | Proxy : newAddressRecorder -> minutelyAddressCounter | Event : 'addressChecked' | Block number : ${blockNumber}`);
        socketServer.to(hourlyAddressCounterId).emit("addressChecked", blockNumber);
        console.log(`${currentTimeReadable()} | Proxy : newAddressRecorder -> hourlyAddressCounter | Event : 'addressChecked' | Block number : ${blockNumber}`);
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
                minutelyBasicNetStatsData = null;
                minutelyAddressCountData = null;
            }
        }
    });

    //Listener for a socketClient of the dataPoolServer.
    client.on("requestInitialHourlyNetStats", async () => {
        console.log(`${currentTimeReadable()} | Receive : 'requestHourlyInitialNetStats' | From : dataPoolServer`);

        let mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                      FROM hourlyAddressCount
                                                                      ORDER BY endTimeUnix DESC
                                                                      LIMIT 61`);

        let hourlyAddressCount: Array<numberOfAddress> = mysqlRes[0];

        mysqlRes = await mysqlConnection.query<RowDataPacket[0]>(`SELECT *
                                                                  FROM ethereum.hourlyBasicNetStats
                                                                  WHERE endTimeUnix <= ${hourlyAddressCount[0].endTimeUnix}
                                                                  ORDER BY endTimeUnix DESC
                                                                  LIMIT 61`);

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

});





