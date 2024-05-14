const Byte = require('../Byte.js');
const EventEmitter = require('events');
class ImmediateLocationReport {
    #eventEmitter = new EventEmitter();
    
    constructor({ issi = 0, reportType = 'short' } = {}) {
        this.issi = parseInt(issi);
        this.reportType = reportType;
    }

    toString(){
        const byte1 = new Byte();
        const byte2 = new Byte();

        //PDU Type
        byte1.setBit(7, 0);
        byte1.setBit(6, 1);
        
        //PDU Type Extension
        byte1.setBit(5, 0);
        byte1.setBit(4, 0);
        byte1.setBit(3, 0);
        byte1.setBit(2, 1);

        //Request/Response
        byte1.setBit(1, 0); // we will always send a request

        //we want short location report
        if(this.reportType == 'short'){
            byte1.setBit(0, 1); 
            byte2.setBit(7, 1);
        } else {
            //Long location report preferred with time type "Time of position"
            byte1.setBit(0, 1); 
            byte2.setBit(7, 0);
        }

        return '0A' + byte1.hex + byte2.hex;
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

module.exports = ImmediateLocationReport;