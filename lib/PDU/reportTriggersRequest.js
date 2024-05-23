const Byte = require('../Byte.js');
const EventEmitter = require('events');
class ReportTriggersRequest {
    #eventEmitter = new EventEmitter();
    
    constructor({ issi = 0 } = {}) {
        this.issi = parseInt(issi);

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
        byte1.setBit(2, 0);

        //Request/Response
        byte1.setBit(1, 0);

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

module.exports = ReportTriggersRequest;