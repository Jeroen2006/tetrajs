const SDSTransfer = require('../PDU/SDSTransfer');
const EventEmitter = require('events');

class SDSMessage{
    #eventEmitter = new EventEmitter();

    constructor({issi = 0, body = '', instantMessage = false, deliveryReport = false, consumedReport = false, messageReference = 0, uuid = null} = {}){
        this.issi = issi;
        this.body = body;
        this.instantMessage = instantMessage;
        this.deliveryReport = deliveryReport;
        this.consumedReport = consumedReport;
        this.messageReference = messageReference;
        
        if(uuid) this.uuid = uuid;

        this.status = {
            sendPrepared: false,
            sendPreparedAt: null,
            sent: false,
            sentAt: null,
            delivered: false,
            deliveredAt: null,
            consumed: false,
            consumedAt: null,
        }
    }

    toAT(){
        const sdsTransfer = new SDSTransfer({
            protocolIdentifier: this.instantMessage ? 130 : 137,
            deliveryReport: this.deliveryReport,
            consumedReport: this.consumedReport,
            allowGroupService: true,
            storageForwardControl: false,
            messageReference: this.messageReference,
            validityPeriod: 0,
            body: this.body
        });

        const data = sdsTransfer.toString();
        const length = sdsTransfer.length();

        return `AT+CMGS=${this.issi},${length}\r\n${data.toUpperCase()}\x1A`;
    }

    on(event, listener){
        this.#eventEmitter.on(event, listener);
    }

    once(event, listener){
        this.#eventEmitter.once(event, listener);
    }

    _getEventEmitter(){
        return this.#eventEmitter;
    }
}

module.exports = SDSMessage;