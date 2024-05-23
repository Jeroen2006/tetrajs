var message = '0A620101CC91E8844288071D020700'

//0A620100CC 010885100E39340E3C
//0A620101CC 91E8844288071D020700
//0A623701CC 91D8844288071D02071E


//strip first 2 characters (protocol identifier)
message = message.substring(2);

const resultCodes = {
    0: 'Success',
    1: 'System Failure',
    2: 'Unspecified Error',
    3: 'Unauthorizd Application',
    4: 'Unkown Subscriber',
    5: 'Absent Subscriber',
    6: 'Congestion in provider',
    7: 'Congestion in mobile network',
    8: 'Unsupported version',
    9: 'Unsufficent resource',
    10: 'Syntax Error',
    11: 'Protocol element not supported',
    12: 'Service not supported',
    13: 'Protocol element value not supported',
    14: 'Type of information not currently available',
    15: 'Required accuracy not achieved',
    16: 'Reserved',
    17: 'Reporting will stop',
    18: 'Time expired',
    19: 'Disallowed by local regulations',
    20: 'Reserved',
    21: 'No such request',
    22: 'User disabled location information report sending',
    23: 'Parameter values modified',
    24: 'Accepted',
    25: 'Accepted, but some of the triggers or accuracies are modified or are not supported',
    26: 'Triggers not supported',
    27: 'Report complete'
}

const reportTypes = {
    0: 'Long location report preferred with no time information',
    1: 'Long location report preferred with time type "Time elapsed"',
    2: 'Long location report preferred with time type "Time of position"',
    3: 'Short location report preferred, see note'
}

var messageBits = '';
for (var i = 0; i < message.length; i += 2) {
    var byte = message.substring(i, i + 2);
    messageBits += parseInt(byte, 16).toString(2).padStart(8, '0');
}

const isResponse = parseInt(messageBits.substring(6, 7), 2);
console.log('isResponse', isResponse);

//next 8 bits, result code
const resultCode = parseInt(messageBits.substring(7, 15), 2);
console.log('resultCode: ', resultCodes[resultCode]);

//next 8 bits, location reporting enable flags
const locationReportingEnableFlags = parseInt(messageBits.substring(15, 23), 2);
console.log('locationReportingEnableFlags', locationReportingEnableFlags);

//next 2 bits, reprt type
const reportType = parseInt(messageBits.substring(23, 25), 2);
console.log('reportType: ', reportTypes[reportType]);

//next 4 bits, Address or identification type
const addressOrIdentificationType = parseInt(messageBits.substring(25, 29), 2);
console.log('addressOrIdentificationType', addressOrIdentificationType);

var bitCounter = 29;
if(addressOrIdentificationType == 9){
    //next 25 bits, ssi
    const ssi = parseInt(messageBits.substring(bitCounter, bitCounter + 25), 2);
    bitCounter += 25;
    console.log('ssi', ssi);

    // //esnd, 4 bits
    // const esnd = parseInt(messageBits.substring(bitCounter, bitCounter + 4), 2);
    // bitCounter += 4;
    // console.log('esnd', esnd);
}

//next 8 bits, trigger type
const triggerType = parseInt(messageBits.substring(bitCounter, bitCounter + 8), 2);
bitCounter += 8;
console.log('triggerType', triggerType);

//next 1 bit, oneshot, recurring
const oneshotRecurring = parseInt(messageBits.substring(bitCounter, bitCounter + 1), 2);
bitCounter += 1;
console.log('oneshotRecurring', oneshotRecurring);
