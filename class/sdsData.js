const Byte = require('./Byte.js');

class SDSData {
    constructor(sentTo, data, messageId) {
        this.sentTo = parseInt(sentTo);
        this.body = data;
        this.messageId = messageId;
        this.protocol = 199

        this.sent = false;
        this.sentAt = null;
        this.sentPromise = new Promise((resolve, reject) => this.sentResolve = resolve);
    }

    toSerial(){
        var hexMessage = Buffer.from(this.body, 'utf8').toString('hex')
        hexMessage = '01' + hexMessage //Validity Period
        hexMessage = intToHex(this.messageId) + hexMessage //Message Reference
        hexMessage = '00' + hexMessage //Message Type 
        hexMessage = intToHex(this.protocol) + hexMessage //Protocol Identifier //82,89
        return hexMessage.toUpperCase();
    }
}

function intToHex(int) {
    var val = int.toString(16).toUpperCase()
    return val.length % 2 == 0 ? val : '0' + val
}

module.exports = SDSData;