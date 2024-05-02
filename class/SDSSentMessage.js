const Byte = require('./Byte.js');

class SDSSentMessage {
    constructor(sentTo, messageBody, messageId, createdAt, sent, sentAt, deliveredReport, delivered, deliveredAt, readReport, read, readAt) {
        this.sentTo = sentTo;
        this.body = messageBody;
        this.messageId = messageId;
        this.createdAt = createdAt || new Date();
        this.sent = sent || false;
        this.sentAt = sentAt || null;
        this.deliveredReport = deliveredReport || true;
        this.delivered = delivered || false;
        this.deliveredAt = deliveredAt || null;
        this.readReport = readReport || true;
        this.read = read || false;
        this.readAt = readAt || null;

        this.sentPromise = new Promise((resolve, reject) => this.sentResolve = resolve);
        this.deliveredPromise = new Promise((resolve, reject) => this.deliveredResolve = resolve);
        this.readPromise = new Promise((resolve, reject) => this.readResolve = resolve);
    }

    //methods
    /**
     * Returns the message in a format that can be sent over the serial port.
     */
    toSerial(presCheck = false){
        var reportByte = new Byte(0);
        if(this.deliveredReport || this.readReport) reportByte.setBit(2, true);
        if(this.deliveredReport) reportByte.setBit(2, true);
        if(this.readReport) reportByte.setBit(3, true);

        var hexMessage = Buffer.from(this.body, 'utf8').toString('hex') //body
        if(presCheck == false) hexMessage = '01' + hexMessage //Validity Period
        if(presCheck == true) hexMessage = 'A0' + hexMessage //Validity Period

        hexMessage = intToHex(this.messageId) + hexMessage //Message Reference
        hexMessage = reportByte.hex + hexMessage //Message Type 
        hexMessage = '82' + hexMessage //Protocol Identifier

        return hexMessage.toUpperCase();
    }

    toWeb(){
        return {
            sentTo: this.sentTo,
            body: this.body,
            messageId: this.messageId,
            createdAt: this.createdAt,
            sent: this.sent,
            sentAt: this.sentAt,
            deliveredReport: this.deliveredReport,
            delivered: this.delivered,
            deliveredAt: this.deliveredAt,
            readReport: this.readReport,
            read: this.read,
            readAt: this.readAt
        }
    }
}

function intToHex(int) {
    var val = int.toString(16).toUpperCase()
    return val.length % 2 == 0 ? val : '0' + val
}

module.exports = SDSSentMessage;