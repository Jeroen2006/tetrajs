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


    /**
     * Converts the LocationReportingEnableDisable object to a string representation.
     * @returns {string} The string representation of the LocationReportingEnableDisable object.
     */
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

    /**
     * Calculates the length of the LocationReportingEnableDisable object.
     * 
     * @returns {number} The length of the object in bits.
     */
    length() {
        const string = this.toString();
        return string.length * 4;
    }

    /**
     * Converts the LocationReportingEnableDisable object to AT command format.
     * @returns {string} The AT command string.
     */
    toAT(){
        const data = this.toString();
        const length = this.length();

        return `AT+CMGS=${this.issi},${length}\r\n${data.toUpperCase()}\x1A`;
    }


    /**
     * Parses a string and sets the values of the LocationReportingEnableDisable object.
     * @param {string} string - The input string to parse.
     */
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

module.exports = LocationReportingEnableDisable;