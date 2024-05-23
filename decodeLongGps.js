const { convertBinaryToLatitude, convertBinaryToLongitude } = require('./lib/gpsUtils');

var message = '0A4EEBC72100BDF4893E9D41E00200';


//strip first 2 characters (protocol identifier)
message = message.substring(2);

var messageBits = '';
for (var i = 0; i < message.length; i += 2) {
    var byte = message.substring(i, i + 2);
    messageBits += parseInt(byte, 16).toString(2).padStart(8, '0');
}

//2 bits, skip first 6 bits
const timeType = parseInt(messageBits.substring(6, 8), 2);
console.log('timeType', timeType);
//we know its time type 2 (Time of position)

//get next 5 bits, day of month
const dayOfMonth = parseInt(messageBits.substring(8, 13), 2);
console.log('dayOfMonth', dayOfMonth);


//get next 4 bits, location shape
const locationShape = parseInt(messageBits.substring(30, 34), 2);
console.log('locationShape', locationShape);

//get next 25 bits, longitude
const longitude = convertBinaryToLongitude(messageBits.substring(34, 59));
console.log('longitude', longitude);

//get next 24 bits, latitude
const latitude = convertBinaryToLatitude(messageBits.substring(59, 83));
console.log('latitude', latitude);

//get next bit, altitude type
const altitudeType = parseInt(messageBits.substring(83, 84), 2);
if(altitudeType == 0){
    const altitudeData = parseInt(messageBits.substring(84, 95), 2);
    var altitude = 0;
    if (altitudeData <= 1200) {
        altitude = altitudeData - 200;
    } else {
        altitude = altitudeData + 1000;
    }

    console.log('altitude', altitude);
}




console.log(messageBits);