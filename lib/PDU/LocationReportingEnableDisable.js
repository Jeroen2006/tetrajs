const Byte = require('../Byte.js');
const EventEmitter = require('events');
class LocationReportingEnableDisable {
    #eventEmitter = new EventEmitter();
    
    constructor({ issi = 0, isRespose = false, ackRequest = false, enableReporting = false, enableBacklog = false} = {}) {
        this.issi = parseInt(issi);
        this.isRespose = isRespose;
        this.ackRequest = ackRequest;
        this.enableReporting = enableReporting;
        this.enableBacklog = enableBacklog;
    }


    toString(){
        const byte1 = new Byte();
        const byte2 = new Byte();

        //PDU Type
        byte1.setBit(7, 0);
        byte1.setBit(6, 1);

        //PDU Type Extension
        byte1.setBit(5, 1);
        byte1.setBit(4, 0);
        byte1.setBit(3, 1);
        byte1.setBit(2, 0);

        //Request/Response
        byte1.setBit(1, this.isRespose);
        byte1.setBit(0, this.ackRequest);

        //Reporting flags
        byte2.setBit(0, this.enableReporting);
        byte2.setBit(1, this.enableBacklog);

        return '0A' + byte1.hex + byte2.hex; //0A is protocol identifier for simple gps
    }

    length() {
        const string = this.toString();
        return string.length * 4;
    }

    toAT(){
        const data = this.toString();
        const length = this.length();

        return `AT+CMGS=${this.issi},${length}\r\n${data.toUpperCase()}\x1A`;
    }

    fromString(string) {
        var byte1 = new Byte();
        byte1.hex = string.substring(2, 4);

        var byte2 = new Byte();
        byte2.hex = string.substring(4, 6);

        this.isRespose = byte1.getBit(1);
        if(this.isRespose == false){
            this.ackRequest = byte1.getBit(0);
            this.enableReporting = byte2.getBit(0);
            this.enableBacklog = byte2.getBit(1);
        } else {
            console.log(byte1.binary, byte2.binary)
            this.ackRequest = false
            this.enableReporting = false
            this.enableBacklog = false
        }
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

module.exports = LocationReportingEnableDisable;