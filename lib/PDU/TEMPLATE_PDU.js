const Byte = require('../Byte.js');
const EventEmitter = require('events');
class BasicLocationParameters {
    #eventEmitter = new EventEmitter();
    
    constructor({ issi = 0 } = {}) {
        this.issi = parseInt(issi);

    }


    toString(){

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

module.exports = BasicLocationParameters;