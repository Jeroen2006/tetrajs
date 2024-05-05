const Byte = require('../class/Byte.js');
const SDSReceivedMessage = require('../class/SDSReceivedMessage.js');
const { convertBinaryToLongitude, convertBinaryToLatitude, convertBinaryPositionErrorToString, convertDirectionBitsToString, convertHorizontalSpeedBitsToInteger }  = require('./gpsConvert.js')

var twoLineCommand = null;
function serialParser(data, serialPort) {
    //return if empty line or OK response
    data = data.replace(/[\r\n]/g, '')
    if (data === '' || data === '' || data === 'OK') {
        return;
    }

    var oneLineCommands = ['+CMGS', '+CTBCT', '+CSQ', '+CNUM', '+CTOM', '+CCLK'];
    var twoLineCommands = ['+CTSDSR'];

    var unkownCommand = true;

    if(twoLineCommand != null){
        const result = handleCommand(twoLineCommand, data, serialPort);
        twoLineCommand = null;
        unkownCommand = false;
        return result;
    }

    //check if message starts with item in oneLineCommands
    for (var i = 0; i < oneLineCommands.length; i++) {
        if (data.startsWith(oneLineCommands[i])) {
            const result = handleCommand(data, null, serialPort);
            unkownCommand = false;
            return result;
        }
    }

    //check if message starts with item in twoLineCommands
    for (var i = 0; i < twoLineCommands.length; i++) {
        if (data.startsWith(twoLineCommands[i])) {
            twoLineCommand = data;
            unkownCommand = false;
            return null;
        }
    }
}

function handleCommand(lineOne, lineTwo = null, serialPort){
    const {command, value} = extractCommand(lineOne);

    switch(command){
        case '+CCLK':
            var [date, time] = value.split(",");
            var [year, month, day] = date.split("/");
            var [hours, minutes, seconds] = time.split(":");
            seconds = seconds.split("+")[0];
            var halfHoursOffset = parseInt(time.split("+")[1]);
            hours = parseInt(hours) + (halfHoursOffset / 2);

            var date = new Date(parseInt(year) + 2000, parseInt(month) - 1, day, hours, minutes, seconds);

            return { date };
            break;
        case '+CTOM':
            return { type: 'operatingMode', mode: value };
            break;
        case '+CTBCT':
            state = new Byte(value.split(",")[1]);
            const sdsAvailable = state.getBit(6);
            return { sdsAvailable };
            break;
        case '+CSQ':
            var signalStrengthOffset = parseInt(value.split(",")[0]);
            var signalStrength = -113;
            signalStrength += 2 * signalStrengthOffset;
            if(signalStrengthOffset == 99) signalStrength = 0;
            return { signalStrength };
            break;
        case '+CNUM':
            var [zero, number] = value.split(",");
            countryCode = parseInt(number.substring(0, 3));
            networkCode = parseInt(number.substring(4, 8));
            subscriberNumber = parseInt(number.substring(8));
            return { countryCode, networkCode, subscriberNumber };
            break;
        case '+CTSDSR':
            var [service] = value.split(",");
            const isGpsMessage = lineTwo.substring(0, 2) == "0A";

            if(service == '12' && !isGpsMessage) return handleDataMessage(value, lineTwo, serialPort);
            if(service == '12' && isGpsMessage) return handleGpsMessage(value, lineTwo, serialPort);
            if(service == '13') return handleStatusMessage(value, lineTwo, serialPort);
        case '+CMGS':
            var [zero, type, messageReference] = value.split(",");
            if(type == null) break;
            return {
                type: 'messageSent',
                messageId: messageReference
            }
    }

}

function handleStatusMessage(value, lineTwo, serialPort){
    var [service, callingParty, callingPartyType, calledParty, calledPartyType, messageLength] = value.split(",");

    return {
        type: 'statusMessage',
        callingParty,
        status: hexToInt(lineTwo),
    }

}

function handleGpsMessage(value, lineTwo, serialPort){
    var [service, callingParty, callingPartyType, calledParty, calledPartyType, messageLength] = value.split(",");
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

    return {
        type: 'gpsMessage',
        issi: callingParty,
        longitude,
        latitude,
        positionAccuracy: positionAcc,
        horizontalVelocity,
        direction
    }

    //console.log(`GPS Message from ${callingParty}. longitude ${longitude}, latitude ${latitude}, position accuracy ${positionAcc}, horizontal velocity ${horizontalVelocity}, direction ${direction}`)
}

function handleDataMessage(value, lineTwo, serialPort){
    var [service, callingParty, callingPartyType, calledParty, calledPartyType, messageLength] = value.split(",");
    const isReceivedReceipt = lineTwo.substring(4, 6) == "00";
    const isReadReceipt = lineTwo.substring(4, 6) == "02";
    const isMessage = !isReceivedReceipt && !isReadReceipt;

    if(isMessage){
        const receivedAt = new Date();
        const message = Buffer.from(lineTwo.substring(8), 'hex').toString('utf8');
        const messageReference = lineTwo.substring(4, 6);
        const reportType = new Byte(lineTwo.substring(2, 4));
        const protocolIdentifier = lineTwo.substring(0, 2)

        const sendReceived = reportType.getBit(2);
        const sendRead = reportType.getBit(3);

        if(sendReceived) serialPort.write(`AT+CMGS=${callingParty},32\r\n821000${messageReference}\x1A`);
        if(sendRead) setTimeout(() => { serialPort.write(`AT+CMGS=${callingParty},32\r\n821002${messageReference}\x1A`); }, 4000);

        console.log(protocolIdentifier)
        if(protocolIdentifier == 'C9'){
            console.log(messageReference, lineTwo)
        }

        return new SDSReceivedMessage(callingParty, calledParty, message, receivedAt, sendReceived, sendRead);
    } else if(isReceivedReceipt || isReadReceipt){
        const messageReference = lineTwo.substring(lineTwo.length - 2);
        const messageId = hexToInt(messageReference);

        if(isReceivedReceipt) return {
            type: 'receivedReceipt',
            messageId
        } 
        if(isReadReceipt) return {
            type: 'readReceipt',
            messageId
        }
    }
}


function extractCommand(line){
    var command = line.split(":")[0].trim();
    var value = line.split(":")[1].trim();

    //its possible that the value also contains : so we need to join the rest of the line
    for(var i = 2; i < line.split(":").length; i++){
        value += ':' + line.split(":")[i].trim();
    }

    return {command, value}
}

function hexToInt(hex) { return parseInt(hex, 16) }

module.exports = serialParser;