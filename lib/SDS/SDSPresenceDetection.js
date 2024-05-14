const SDSTransfer = require('../PDU/SDSTransfer');
const EventEmitter = require('events');

/**
 * Represents a presence detection message for SDS (Short Data Service).
 */
class SDSPresenceDetection{
    #eventEmitter = new EventEmitter();
    #responseTimeout = null;

    constructor({issi = 0, messageReference = 0, uuid = null} = {}){
        //generate random 12 character string
        this.issi = issi;
        this.body = Math.random().toString(36).substring(2, 14);;
        this.deliveryReport = true;
        this.consumedReport = false;
        this.messageReference = messageReference;
        
        if(uuid) this.uuid = uuid;

        this.status = {
            sendPrepared: false,
            sendPreparedAt: null,
            sent: false,
            sentAt: null,
            delivered: false,
            deliveredAt: null,
        }

        this.#eventEmitter.once('sent', () => {
            this.#responseTimeout = setTimeout(() => {
                this.#eventEmitter.emit('result', {
                    status: 'timeout',
                    timePassed: 10000
                });
            }, 10000);
        });

        this.#eventEmitter.once('delivered', () => {
            if(this.#responseTimeout){
                clearTimeout(this.#responseTimeout);
                this.#responseTimeout = null;

                var timePassed = new Date().getTime() - this.status.sentAt.getTime();
                this.#eventEmitter.emit('result', {
                    status: 'delivered',
                    timePassed: timePassed
                });
            }
        });
    }

    toAT(){
        const sdsTransfer = new SDSTransfer({
            protocolIdentifier: 199, //random prootcol so it will not be recognized as a message and will return error from radio
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

module.exports = SDSPresenceDetection;