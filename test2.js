var message = '0A4EE49F1900BDF5E93E9F42220200';


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

//5 bits, after time type
const day = parseInt(messageBits.substring(8, 13), 2);

//5 bits, after day
const hour = parseInt(messageBits.substring(13, 18), 2);

//6 bits, after hour
const minute = parseInt(messageBits.substring(18, 24), 2);

//6 bits, after minute
const second = parseInt(messageBits.substring(24, 30), 2);

console.log('day', day);
console.log('hour', hour);
console.log('minute', minute);
console.log('second', second);



console.log(messageBits);