//Import environment variables.
import "dotenv/config";

//Import packages.
import {Server} from "socket.io";
import {io} from "socket.io-client";

//Import self-made packages.
import {currentTimeReadable, unixTimeReadable} from "@pierogi.dev/readable_time";

//Import types.
import type {blockNumberWithTimestamp, minutelyAddressCount, minutelyNetStats, recordOfEthDB} from "./types";

//Launch a socket-io server.
const socketServer: Server = new Server(6000);

//Launch a socket-io client.
const socketClient = io(`${process.env.DATA_POOL_SERVER}`);

//Define socket-io client id variable.
let minutelyBasicNetStatsMakerId: string = '';
let minutelyAddressCounterId: string = '';
let blockDataRecorderId: string = '';
let newAddressRecorderId: string = '';

//Define socket-io client name.
const minutelyBasicNetStatsMakerName: string = 'minutelyBasicNetStatsMaker';
const minutelyAddressCounterName: string = 'minutelyAddressCounter';
const blockDataRecorderName: string = 'blockDataRecorder';
const newAddressRecorderName: string = 'newAddressRecorder';

//Define control minutely data emitter variables.
let basicNetStatsDate: number | null;
let basicNetStatsData: recordOfEthDB | null;
let addressCountDate: number | null;
let addressCountData: minutelyAddressCount | null;

socketServer.on('connection', (client) => {
    console.log(`${currentTimeReadable()} | Connect with a socket client. ID : ${client.id}`);

    //Store client socket id.
    switch (client.handshake.query.name) {

        case minutelyBasicNetStatsMakerName:
            minutelyBasicNetStatsMakerId = client.id;
            console.log(`${currentTimeReadable()} | The minutelyBasicNetStatsMaker is connected.`);
            break;

        case minutelyAddressCounterName:
            minutelyAddressCounterId = client.id;
            console.log(`${currentTimeReadable()} | The minutelyAddressCounter is connected.`);
            break;

        case blockDataRecorderName:
            blockDataRecorderId = client.id;
            console.log(`${currentTimeReadable()} | The blockDataRecorder is connected.`);
            break;

        case newAddressRecorderName:
            newAddressRecorderId = client.id;
            console.log(`${currentTimeReadable()} | The newAddressRecorder is connected.`);
            break;

    }

    //Listener for the block data recorder.
    client.on("newBlockDataRecorded", (blockNumberWithTimestamp: blockNumberWithTimestamp, ack: Function) => {
        ack(`Received | Event 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber}`);
        socketServer.to(minutelyBasicNetStatsMakerId).emit("newBlockDataRecorded", blockNumberWithTimestamp, () => {
            console.log(`${currentTimeReadable()} | Proxy : blockDataRecorder -> minutelyBasicNetStatsMaker | Event : 'newBlockDataRecorded' | Block number : ${blockNumberWithTimestamp.blockNumber} | Block timestamp : ${unixTimeReadable(Number(blockNumberWithTimestamp.timestamp))}`);
        });
    });

    //Listener for the new address recorder.
    client.on("addressChecked", (blockNumber: number, ack: Function) => {
        ack(`Received | Event 'addressChecked' | Block number : ${blockNumber}`);
        socketServer.to(minutelyAddressCounterId).emit("addressChecked", blockNumber, () => {
            console.log(`${currentTimeReadable()} | Proxy : newAddressRecorder -> minutelyAddressCounter | Event : 'addressChecked' | Block number : ${blockNumber}`);
        });
    });

    //Listener for the minutely basic net stats' maker.
    client.on("minutelyBasicNetStatsRecorded", (data: recordOfEthDB, ack: Function) => {
        ack(`Received | Event 'addressChecked' | Datetime : ${data.startTimeReadable} - ${data.endTimeReadable}`);

        console.log(`${currentTimeReadable()} | Received | Event : minutelyBasicNetStatsRecorded.`);

        basicNetStatsData = data;
        basicNetStatsDate = data.startTimeUnix;

        if (basicNetStatsData && addressCountData) {
            if (basicNetStatsDate === addressCountDate) {
                let emitData: minutelyNetStats = {
                    ...data,
                    numberOfAddress: addressCountData.numberOfAddress,
                }
                socketClient.emit('minutelyNetStats', emitData, (response: any) => {
                    console.log(`${currentTimeReadable()} | Ack : ${response}`);
                });
                console.log(`${currentTimeReadable()} | Emit | Event : minutelyNetStats | Trigger event : minutelyBasicNetStatsRecorded.`);
                basicNetStatsData = null;
                addressCountData = null;
            }
        }
    });

    //Listener for the minutely address counter.
    client.on("minutelyAddressCountRecorded", (data: minutelyAddressCount, ack: Function) => {
        ack(`Received | Event 'minutelyAddressCountRecorded' | Datetime : ${data.startTimeReadable} - ${data.endTimeReadable}`);

        console.log(`${currentTimeReadable()} | Received | Event : minutelyAddressCountRecorded.`);

        addressCountData = data;
        addressCountDate = data.startTimeUnix;

        if (addressCountData && basicNetStatsData) {
            if (basicNetStatsDate === addressCountDate) {
                let emitData: minutelyNetStats = {
                    ...basicNetStatsData,
                    numberOfAddress: data.numberOfAddress,
                }
                socketClient.emit('minutelyNetStats', emitData, (response: any) => {
                    console.log(`${currentTimeReadable()} | Ack : ${response}`);
                });
                console.log(`${currentTimeReadable()} | Emit | Event : minutelyNetStats | Trigger event : minutelyAddressCountRecorded.`);
                basicNetStatsData = null;
                addressCountData = null;
            }
        }
    });

});





