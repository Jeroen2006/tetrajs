const SDSTransfer = require('../PDU/SDSTransfer');
const EventEmitter = require('events');

/**
 * Represents an SDS (Short Data Service) message.
 */
class SDSMessage {
    #eventEmitter = new EventEmitter();

    /**
     * Constructs a new SDSMessage object.
     * @param {Object} options - The options for the SDSMessage.
     * @param {number} options.issi - The ISSI (Individual Short Subscriber Identity) of the message recipient.
     * @param {string} options.body - The body of the message.
     * @param {boolean} [options.instantMessage=false] - Indicates if the message is an instant message.
     * @param {boolean} [options.deliveryReport=false] - Indicates if delivery report is requested.
     * @param {boolean} [options.consumedReport=false] - Indicates if consumed report is requested.
     * @param {number} [options.messageReference=0] - The reference number of the message.
     * @param {string} [options.uuid=null] - The UUID (Universally Unique Identifier) of the message.
     */
    constructor({ issi = 0, body = '', instantMessage = false, deliveryReport = false, consumedReport = false, messageReference = 0, uuid = null } = {}) {
        this.issi = issi;
        this.body = body;
        this.instantMessage = instantMessage;
        this.deliveryReport = deliveryReport;
        this.consumedReport = consumedReport;
        this.messageReference = messageReference;

        if (uuid) this.uuid = uuid;

        this.status = {
            sendPrepared: false,
            sendPreparedAt: null,
            sent: false,
            sentAt: null,
            delivered: false,
            deliveredAt: null,
            consumed: false,
            consumedAt: null,
        };
    }

    /**
     * Converts the SDSMessage object to an AT command string.
     * @returns {string} The AT command string.
     */
    toAT() {
        const sdsTransfer = new SDSTransfer({
            protocolIdentifier: this.instantMessage ? 137 : 130,
            deliveryReport: this.deliveryReport,
            consumedReport: this.consumedReport,
            allowGroupService: true,
            storageForwardControl: false,
            messageReference: this.messageReference,
            validityPeriod: 0,
            body: this.body,
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

module.exports = SDSMessage;