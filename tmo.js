const { SerialPort, ReadlineParser  } = require('serialport')
const serialport = new SerialPort({ path: 'COM11', baudRate: 460800 })
const parser = serialport.pipe(new ReadlineParser())
const express = require('express');
var fs = require('fs');
const { convertBinaryToLongitude, convertBinaryToLatitude, convertBinaryPositionErrorToString, convertDirectionBitsToString, convertHorizontalSpeedBitsToInteger }  = require('./conv.js')

const app = express()
const port = 3000

var signalStrength = -128;
var commandQueue = [];
var sdsMessageQueue = [];
var sdsMessages = []
var receivedMessages = [];
var latestGpsPosition = {}
var sdsReady = false;
var countryCode;
var networkCode;
var subscriberNumber;
parser.on('data', receive_data);

//SETUP
sendCommand('AT+CTSP=1,3,130\r\n') //Activate SDS pipe to PEI 
sendCommand('AT+CTSP=1,3,131\r\n') //Activate GPS pipe to PEI
//sendCommand('AT+CTSP=1,2,20\r\n') //Register SDS status handling
sendCommand('AT+CTSP=1,3,10\r\n') //Register GPS LIP hanadling



function sendMessage(message, targetIssi) {
    const refId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sdsMessageQueue.push({body: message, target: targetIssi, refId});

    return refId;
}

function sendSdsDeliveredMessage(messageReference, targetIssi) {
    sendCommand(`AT+CMGS=${targetIssi},32\r\n821000${messageReference}\x1A`);
}

function sendSdsReadMessage(messageReference, targetIssi) {
    sendCommand(`AT+CMGS=${targetIssi},32\r\n821002${messageReference}\x1A`);
}

function _sendSdsMessage(message, targetIssi, refId) {

    const messageId = getSdsReference();

    var hexMessage = Buffer.from(message, 'utf8').toString('hex')
    hexMessage = '01' + hexMessage //Validity Period
    hexMessage = intToHex(messageId) + hexMessage //Message Reference
    //prepend 0x02 to the message (0E = delivery&read, 06 = delivery, 00 = no report)
    hexMessage = '0E' + hexMessage //Message Type 
    hexMessage = '82' + hexMessage //Protocol Identifier
    const hexLength = hexMessage.length*4

    sdsMessages.push({
        id: refId,
        tetraReference: messageId,
        targetIssi: targetIssi,
        message: message,
        failed: false,
        sent: false,
        read: false,
        delivered: false,
    });

    sendCommand(`AT+CMGS=${targetIssi},${hexLength}\r\n${hexMessage}\x1A`);
}

var twoLineCommand = null;
function receive_data(data) {
    //return if empty line or OK response
    data = data.replace(/[\r\n]/g, '')
    if (data === '' || data === '' || data === 'OK') {
        return;
    }

    var oneLineCommands = ['+CMGS', '+CTBCT', '+CSQ', '+CNUM'];
    var twoLineCommands = ['+CTSDSR'];

    var unkownCommand = true;

    if(twoLineCommand != null){
        handleCommand(twoLineCommand, data);
        twoLineCommand = null;
        unkownCommand = false;
        return;
    }

    //check if message starts with item in oneLineCommands
    for (var i = 0; i < oneLineCommands.length; i++) {
        if (data.startsWith(oneLineCommands[i])) {
            handleCommand(data);
            unkownCommand = false;
            return;
        }
    }

    //check if message starts with item in twoLineCommands
    for (var i = 0; i < twoLineCommands.length; i++) {
        if (data.startsWith(twoLineCommands[i])) {
            twoLineCommand = data;
            unkownCommand = false;
            return;
        }
    }

    //if(unkownCommand) console.log(`<- ${data}`)
}

function handleCommand(lineOne, lineTwo = null){
    const {command, value} = extractCommand(lineOne);

    switch(command){
        case '+CTBCT':
            var [zero, state] = value.split(",");
            console.log(`CTBCT state: ${state}`);
            if(state == 'd60') sdsReady = true
            else sdsReady = false;

            break;
        case '+CMGS':
            var [zero, type, messageReference] = value.split(",");
            if(type == null) break;
            var message = sdsMessages.find(m => m.tetraReference == messageReference);
            if(message == null) break;

            console.log(`Message ${message.id} sent to ${message.targetIssi} with reference ${messageReference}`);
            message.sent = true;
            message.sentAt = new Date();

            setTimeout(() => {
                var message = sdsMessages.find(m => m.tetraReference == messageReference);
                if(message.sent && !message.delivered){
                    console.log(`Message ${message.id} failed to deliver to ${message.targetIssi} with reference ${messageReference}`);
                    message.failed = true;
                }
            }, 5000);

            break;
        case '+CTSDSR':
            var [service, callingParty, callingPartyType, calledParty, calledPartyType, messageLength] = value.split(",");

            if(messageLength == 84 && lineTwo.substring(0, 2) == "0A") service = 13;

            if(messageLength == 32 && service == '12'){//SDS ack message
                const messageReference = lineTwo.substring(lineTwo.length - 2);
                const ackType = lineTwo.substring(lineTwo.length - 4, lineTwo.length - 2);
                const messageId = hexToInt(messageReference);

                if(ackType == '00'){ //delivered
                    var message = sdsMessages.find(m => m.tetraReference == messageId);
                    if(message == null) break;

                    message.delivered = true;
                    message.deliveredAt = new Date();
                    console.log(`Message ${message.id} received by ${message.targetIssi} with reference ${messageId}`);
                } else if(ackType == '02'){ //read
                    var message = sdsMessages.find(m => m.tetraReference == messageId);
                    if(message == null) break;

                    message.read = true;
                    message.readAt = new Date();
                    console.log(`Message ${message.id} read by ${message.targetIssi} with reference ${messageId}`);
                }

            } else if(service == '12'){//SDS message{
                var sendReceivedReport = false;
                var sendReadReport = false;

                //get 2 set of 2 characters
                var reportType = lineTwo.substring(2, 4);
                if(reportType == '06' || reportType == '0E' || reportType == '0C' || reportType == '04') sendReceivedReport = true;
                if(reportType == '0E' || reportType == '0C' || reportType == '08' || reportType == '0A') sendReadReport = true; 

                var messageReference = lineTwo.substring(4, 6);
                var validityPeriod = lineTwo.substring(6, 8);
                var message = lineTwo.substring(8);
                message = Buffer.from(message, 'hex').toString('utf8');

                console.log(`received message: ${message} from ${callingParty} to ${calledParty} with report ${reportType}, read: ${sendReadReport}, received: ${sendReceivedReport}`);
            
                const refId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                receivedMessages.push({
                    id: refId,
                    callingParty: callingParty,
                    calledParty: calledParty,
                    message: message,
                    messageReference: messageReference,
                    validityPeriod: validityPeriod,
                    sendReceivedReport: sendReceivedReport,
                    sendReadReport: sendReadReport,
                    receivedAt: new Date()  
                });

                if(sendReceivedReport) sendSdsDeliveredMessage(messageReference, callingParty);
                if(sendReadReport) sendSdsReadMessage(messageReference, callingParty);
            } else if (service == '13'){//GPS message
                var message = lineTwo.substring(2);

                var messageBits = '';
                for (var i = 0; i < message.length; i += 2) {
                    var byte = message.substring(i, i + 2);
                    messageBits += parseInt(byte, 16).toString(2).padStart(8, '0');
                }
                
                var first4Bits = messageBits.substring(0, 4);
                var longitude = messageBits.substring(4, 29);
                var latitude = messageBits.substring(29, 53);
                var positionAcc = messageBits.substring(53, 56);
                var horizontalVelocity = messageBits.substring(56, 63);
                var direction = messageBits.substring(63, 67);

                longitude = convertBinaryToLongitude(longitude);
                latitude = convertBinaryToLatitude(latitude);
                positionAcc = convertBinaryPositionErrorToString(positionAcc);
                horizontalVelocity = convertHorizontalSpeedBitsToInteger(horizontalVelocity);
                direction = convertDirectionBitsToString(direction);

                console.log(`GPS Message from ${callingParty}. longitude ${longitude}, latitude ${latitude}, position accuracy ${positionAcc}, horizontal velocity ${horizontalVelocity}, direction ${direction}`)
                
                //check if gps folder exists
                if (!fs.existsSync('gps')) {
                    fs.mkdirSync('gps');
                }

                //check if gps/issi folder exists
                if (!fs.existsSync(`gps/${callingParty}`)) {
                    fs.mkdirSync(`gps/${callingParty}`);
                }

                const currentTimestamp = new Date().getTime();
                fs.writeFileSync(`gps/${callingParty}/${currentTimestamp}.json`, JSON.stringify({
                    longitude,
                    latitude,
                    positionAcc,
                    horizontalVelocity,
                    direction,
                    timestamp: new Date(currentTimestamp)
                }));

                latestGpsPosition = {
                    longitude,
                    latitude,
                    positionAcc,
                    horizontalVelocity,
                    direction,
                    timestamp: new Date(currentTimestamp)
                };
            }
            break;
        case '+CSQ':
            var valuetmp = parseInt(value.split(",")[0]);
            var startStrength = -113;
            startStrength += 2 * valuetmp;
            signalStrength = startStrength;

            console.log(`Signal strength: ${signalStrength} dBm`);

            break;
        case '+CNUM':
            var [zero, number] = value.split(",");
            countryCode = parseInt(number.substring(0, 3));
            networkCode = parseInt(number.substring(4, 7));
            subscriberNumber = parseInt(number.substring(8));

            //console.log(`Subscriber number: ${countryCode} ${networkCode} ${subscriberNumber}`);
            break;
        default:
            if(lineTwo == null) console.log(`received command: ${command} with value: ${value}`);
            else console.log(`received command: ${command} with value: ${value} and ${lineTwo}`)
            break;
    }
}

function getSdsReference(){
    var id = 0;
    for(var i = 1; i < 200; i++){
        if(sdsMessages.find(m => m.tetraReference == i) == null) id = i;
    }

    if(id == 0) {
        var messagesWithTetrareference = sdsMessages.map(m => m.tetraReference);

        //set tetraReference to 0 on oldest message 
        var oldestMessage = sdsMessages.find(m => m.tetraReference == Math.min(...messagesWithTetrareference));
        oldestMessage.tetraReference = 0;

        //try again
        return getSdsReference();
    }

    return id;
}

function extractCommand(line){
    var command = line.split(":")[0].trim();
    var value = line.split(":")[1].trim();
    return {command, value}
}

function intToHex(int) {
    var val = int.toString(16).toUpperCase()
    return val.length % 2 == 0 ? val : '0' + val
}

function hexToInt(hex) { return parseInt(hex, 16) }
function sendCommand(command) { commandQueue.push(command) }
    
//sendMessage("HALLO COMPILERTJE", "9012113")
//sendMessage("HALLO COMPILERTJE", "9015080")
//sendMessage("HALLO COMPILERTJE", "9018300")

app.get('/', (req, res) => {
    var response = {
        sdsReady: sdsReady,
        signalStrength_dBm: signalStrength,
        receivedMessages: receivedMessages.length,
        sentMessages: sdsMessages.length,
        gpsPosition: latestGpsPosition,
    };

    if(req.query.includeNetworkInfo == 'true'){
        response.networkInfo = {
            countryCode: countryCode,
            networkCode: networkCode,
            subscriberNumber: subscriberNumber
        }
    }

    if(req.query.includeMessages == 'true'){
        response.receivedMessages = receivedMessages.map(m => {
            return {
                id: m.id,
                sender: m.callingParty,
                receiver: m.calledParty,
                message: m.message,
                receivedReport: m.sendReceivedReport,
                sentReport: m.sendReadReport,
                receivedAt: m.receivedAt
            }
        });

        response.sentMessages = sdsMessages.map(m => {
            return {
                id: m.id,
                receiver: m.targetIssi,
                message: m.message,
                failed: m.failed,
                sentAt: m.sentAt,
                delivered: m.delivered,
                deliveredAt: m.deliveredAt,
                read: m.read,
                readAt: m.readAt,
            }
        });
    }

    res.send(response);
})

//get specific message, can be sent or received. also map this to the correct message
app.get('/message/:id', (req, res) => {
    var direction = 'received'
    var message = receivedMessages.find(m => m.id == req.params.id);
    if(message == null) {
        direction = 'sent'
        message = sdsMessages.find(m => m.id == req.params.id);

        if(message == null) return res.status(404).send('Message not found');

        message = {
            id: message.id,
            direction: direction,
            receiver: message.targetIssi,
            message: message.message,
            failed: message.failed,
            sentAt: message.sentAt,
            delivered: message.delivered,
            deliveredAt: message.deliveredAt,
            read: message.read,
            readAt: message.readAt,
        }

    } else {
        message = {
            id: message.id,
            direction: direction,
            sender: message.callingParty,
            receiver: message.calledParty,
            message: message.message,
            receivedReport: message.sendReceivedReport,
            sentReport: message.sendReadReport,
            receivedAt: message.receivedAt
        }
    }

    message.direction = direction;

    if(message == null) return res.status(404).send('Message not found');
    res.send(message);
})

//get gps position of specific issi
app.get('/gps/:issi', (req, res) => {
    const { issi } = req.params;
    const position = latestGpsPosition[issi];

    if(position == null) return res.status(404).send('No gps position found for this issi');

    res.send(position);
})

app.get('/sendmessage', (req, res) => {
    const { target, message } = req.query;

    if(message.length > 150) return res.status(400).send('Message too long');

    const refId = sendMessage(message, target);

    res.json({ refId });
})

//load messages from messages.json
fs.readFile('messages.json', 'utf8', function (err, data) {
    if (err) {
        console.log("An error occured while reading JSON Object from File.");
        return console.log(err);
    }

    var messages = JSON.parse(data);
    receivedMessages = messages.receivedMessages;
    sdsMessages = messages.sdsMessages;
});

//load latest gps position from gps folder
fs.readdir('gps', (err, issis) => {
    if (err) {
        console.error("Could not list the directory.", err);
        return;
    }

    issis.forEach((issi) => {
        fs.readdir(`gps/${issi}`, (err, files) => {
            if (err) {
                console.error("Could not list the directory.", err);
                return;
            }

            //sort by f (timestamp) and get the latest
            files.sort((a, b) => {
                return fs.statSync(`gps/${issi}/${b}`).mtime.getTime() - fs.statSync(`gps/${issi}/${a}`).mtime.getTime();
            });

            const latestFile = files[0];
            if(latestFile == null) return;

            const file = fs.readFileSync(`gps/${issi}/${latestFile}`);
            latestGpsPosition[issi] = JSON.parse(file);
        });
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

//save all messages to messages.json every second
setInterval(() => {
    var fs = require('fs');
    fs.writeFile('messages.json', JSON.stringify({ receivedMessages, sdsMessages }), 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
    });
}, 1000);

setInterval(() => {
    if (commandQueue.length > 0) {
        var command = commandQueue.shift()
        serialport.write(command)
    }
}, 100);

setInterval(() => {
    if (sdsMessageQueue.length > 0 && sdsReady) {
        var command = sdsMessageQueue.shift()
        _sendSdsMessage(command.body, command.target, command.refId)
    }
}, 1500);

setInterval(() => {
    sendCommand('AT+CTBCT?\r\n');
    sendCommand('AT+CSQ?\r\n');
    sendCommand('AT+CNUM?\r\n');
}, 5000);