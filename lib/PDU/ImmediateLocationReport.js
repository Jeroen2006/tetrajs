const Byte = require('../Byte.js');
const EventEmitter = require('events');
class ImmediateLocationReport {
    #eventEmitter = new EventEmitter();
    
    constructor({ issi = 0, reportType = 'short' } = {}) {
        this.issi = parseInt(issi);
        this.reportType = reportType;
    }

    /**
     * Converts the ImmediateLocationReport object to a string representation.
     * @returns {string} The string representation of the ImmediateLocationReport object.
     */
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

    /**
     * Calculates the length of the ImmediateLocationReport object.
     * @returns {number} The length of the ImmediateLocationReport object.
     */
    length() {
        const string = this.toString();
        return string.length * 4;
    }

    /**
     * Converts the ImmediateLocationReport object to an AT command string.
     * @returns {string} The AT command string.
     */
    toAT(){
        const data = this.toString();
        const length = this.length();

        return `AT+CMGS=${this.issi},${length}\r\n${data.toUpperCase()}\x1A`;
    }


    fromString(string) {

    }

    /**
     * Adds an event listener for the specified event.
     * @param {string} event - The name of the event.
     * @param {Function} listener - The event listener function.
     */
    on(event, listener) {
        this.#eventEmitter.on(event, listener);
    }

    /**
     * Removes an event listener for the specified event.
     * @param {string} event - The name of the event.
     * @param {Function} listener - The event listener function.
     */
    off(event, listener) {
        this.#eventEmitter.off(event, listener);
    }

    /**
     * Adds a one-time event listener for the specified event.
     * @param {string} event - The name of the event.
     * @param {Function} listener - The event listener function.
     */
    once(event, listener) {
        this.#eventEmitter.once(event, listener);
    }

    /**
     * Returns the underlying event emitter object.
     * @returns {EventEmitter} The event emitter object.
     */
    _getEventEmitter() {
        return this.#eventEmitter;
    }
}

module.exports = ImmediateLocationReport;