const Byte = require('../Byte.js');
const EventEmitter = require('events');
class BasicLocationParameters {
    #eventEmitter = new EventEmitter();
    
    constructor({ issi = 0 } = {}) {
        this.issi = parseInt(issi);
        this.isRespose = false;
        this.enableReporting = false;
        this.enableBacklog = false;

    }

    toString(){
        const byte1 = new Byte();

        //PDU Type
        byte1.setBit(7, 0);
        byte1.setBit(6, 1);
        
        //PDU Type Extension
        byte1.setBit(5, 1);
        byte1.setBit(4, 0);
        byte1.setBit(3, 0);
        byte1.setBit(2, 1);

        //Request/Response
        byte1.setBit(1, 0); // we will always send a request

        return '0A' + byte1.hex
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

        var byte3 = new Byte();
        byte3.hex = string.substring(6, 8);

        var byte4 = new Byte();
        byte4.hex = string.substring(8, 10);

        this.isRespose = byte1.getBit(1);

        //next 8 bits is result code, we will ignore it for now
        //next 8 bits is the location reporting flags. get the last 2 bits  
        this.enableReporting = byte2.getBit(0);
        this.enableBacklog = byte2.getBit(1);

        //we dont care about the rest of the bits for now
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

module.exports = BasicLocationParameters;