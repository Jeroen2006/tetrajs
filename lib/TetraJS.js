const MotorolaSerialPort = require('./MotorolaSerialPort');
const SerialParser = require('./SerialParser');
const SDSMessage = require('./SDS/SDSMessage');
const EventEmitter = require('events');
const SDSReport = require('./PDU/SDSReport');
const SDSGPSShort = require('./SDS/SDSGPSShort');
const SDSPresenceDetection = require('./SDS/SDSPresenceDetection');
const LocationReportingEnableDisable = require('./PDU/LocationReportingEnableDisable');
const BasicLocationParameters = require('./PDU/BasicLocationParameters');
const ImmediateLocationReport = require('./PDU/ImmediateLocationReport');

/**
 * Represents a TetraJS object that handles communication with a Motorola Tetra device.
 * @class
 */
class TetraJS {
    #serialPort = null
    #serialParser = null
    #sdsMessages = []
    #sdsLastSentMessageAt = new Date();
    #waitingForMessageSentAck = false;
    #eventEmitter = new EventEmitter();

    constructor(serialPort, baudRate, options) {
        this.#serialPort = new MotorolaSerialPort(serialPort, baudRate);
        this.#serialParser = new SerialParser(this.#serialPort);

        this.#serialPort.write('AT+CTSP=1,3,130\r\n')   //Activate SDS pipe to PEI 
        this.#serialPort.write('AT+CTSP=1,3,131\r\n')   //Activate GPS pipe to PEI
        this.#serialPort.write('AT+CTSP=1,3,10\r\n')    //Register GPS LIP hanadling
        this.#serialPort.write('AT+CTSP=1,2,20\r\n')    //Register SDS status handling
        this.#serialPort.write('AT+CNUMF?\r\n');         //Get the current ISSI
        this.#serialPort.write('AT+CTOM?\r\n');         //Get the current operating mode

        this.network = {
            time: null,
            mode: null,
            signalStrength: null,
            countryCode: null,
            networkCode: null,
            issi: null
        }

        var self = this
        setInterval(() => {
            if(this.network.mode == 'TMO') this.#serialPort.write('AT+CSQ?\r\n');
            this.#serialPort.write('AT+CCLK?\r\n');
            this.#serialPort.write('AT+CNUMF?\r\n');
        //     this.#serialPort.write('AT+CTOCP?\r\n');
        //      this.#serialPort.write('AT+CTBCT?\r\n');
        //     // this.#serialPort.write('AT+CPAS?\r\n');
        }, 1000000);
        // this.#serialPort.write(`AT+CMGS=${12543343},${24}\r\n${gpsloc.toString()}\x1A`);


        this.#serialParser.on('CMGS', ({messageReference, sdsStatus}) => {
            const message = this.#sdsMessages.find(msg => msg.messageReference == messageReference);
            if (message) { //sdsStatus 4 = sent, 5 - failed
                if(sdsStatus != 4){
                    message.status.sendPrepared = false;
                    message.status.sendPreparedAt = null;

                    setTimeout(() => {
                        this.#waitingForMessageSentAck = false;
                    }, 1000);

                    return;
                }

                const isSdsReport = message instanceof SDSReport;
                if(isSdsReport){
                    this.#sdsMessages.splice(this.#sdsMessages.indexOf(message), 1);

                    return;
                }


                message.status.sent = true;
                message.status.sentAt = new Date();

                if(message.deliveryReport == false && message.consumedReport == false) this.#waitingForMessageSentAck = false;

                var messageAutoTimeout = setTimeout(() => {
                    this.#waitingForMessageSentAck = false;
                }, 5000);

                if(message.deliveryReport == true){
                    message.once('delivered', () =>{
                        this.#waitingForMessageSentAck = false;
                        clearTimeout(messageAutoTimeout);
                    });
                }

                message._getEventEmitter().emit('sent', message);
                message._getEventEmitter().emit('change', message);
            } else {
                //check if first message in queue has no messageReference
                const message = this.#sdsMessages.find(msg => msg.messageReference == null);
                if(message && sdsStatus == 4){
                    message._getEventEmitter().emit('sent', message);
                    message._getEventEmitter().emit('change', message);
                    this.#sdsMessages.splice(this.#sdsMessages.indexOf(message), 1);
                }

                this.#waitingForMessageSentAck = false;
            }

            
        });

        this.#serialParser.on('CTOM', (operatingMode) => {
            if(operatingMode == 'DMO') this.network.signalStrength = null;

            this.network.mode = operatingMode;
            this.#eventEmitter.emit('operatingmode', operatingMode);
        });

        this.#serialParser.on('CNUMF', ({countryCode, networkCode, subscriberNumber}) => {
            this.network.issi = subscriberNumber;
            this.#eventEmitter.emit('issi', subscriberNumber);

            this.network.networkCode = networkCode;
            this.network.countryCode = countryCode;
            this.#eventEmitter.emit('network', {countryCode, networkCode, issi: subscriberNumber});
        });

        this.#serialParser.on('CSQ' , (signalStrength) => {
            this.network.signalStrength = signalStrength;
            this.#eventEmitter.emit('signal', signalStrength);
        });

        this.#serialParser.on('SDSREPORT', (sdsReport) => {
            const message = this.#sdsMessages.find(msg => msg.messageReference == sdsReport.messageReference);
            if(sdsReport.deliveryStatus == 'delivered' && message?.status){
                message.status.delivered = true;
                message.status.deliveredAt = new Date();

                message._getEventEmitter().emit('delivered', message);
                message._getEventEmitter().emit('change', message);

            } else if(sdsReport.deliveryStatus == 'consumed' && message?.status){
                message.status.consumed = true;
                message.status.consumedAt = new Date();

                message._getEventEmitter().emit('consumed', message);
                message._getEventEmitter().emit('change', message);
            }
        });

        this.#serialParser.on('SDSTRANSFER-WITH-METADATA', ({sdsTransfer, callingParty}) => {
            if(sdsTransfer.deliveryReport){
                const sdsReport = new SDSReport({
                    protocolIdentifier: sdsTransfer.protocolIdentifier,
                    ackRequired: false,
                    storageForwardControl: false,
                    deliveryStatus: 'delivered',
                    messageReference: sdsTransfer.messageReference,
                    issi: callingParty
                });

                this.#sdsMessages.push(sdsReport);
            }

            if(sdsTransfer.consumedReport){
                const sdsReport = new SDSReport({
                    protocolIdentifier: sdsTransfer.protocolIdentifier,
                    ackRequired: false,
                    storageForwardControl: false,
                    deliveryStatus: 'consumed',
                    messageReference: sdsTransfer.messageReference,
                    issi: callingParty
                });

                this.#sdsMessages.push(sdsReport);
            }


            if(sdsTransfer.protocolIdentifier == 130 || sdsTransfer.protocolIdentifier == 137){
                const sdsTransferMessage = new SDSMessage({
                    issi: sdsTransfer.issi,
                    body: sdsTransfer.body,
                    instantMessage: sdsTransfer.protocolIdentifier != 130,
                    deliveryReport: sdsTransfer.deliveryReport,
                    consumedReport: sdsTransfer.consumedReport,
                    messageReference: sdsTransfer.messageReference
                });

                this.#eventEmitter.emit('received-message', sdsTransferMessage);
            } else if (sdsTransfer.protocolIdentifier == 10){
                const gpsShort = new SDSGPSShort({
                    issi: sdsTransfer.issi
                });
                gpsShort.fromString(sdsTransfer.sourceString);

                this.#eventEmitter.emit('gps', gpsShort);
                this.#eventEmitter.emit('gps-short', gpsShort);
            } else {
                console.log('SDS Transfer:', sdsTransfer);
            }
        });

        this.#serialParser.on('CCLK', (time) => {
            this.network.time = new Date(time);

            this.#eventEmitter.emit('time', this.network.time);
        });

        setInterval(() => {
            const timeSinceLastMessage = new Date() - this.#sdsLastSentMessageAt;
            
            var pendingMessages = this.#sdsMessages.filter(msg => !msg?.status?.sendPrepared || msg instanceof SDSReport);
            pendingMessages.sort((a, b) => {
                if(a instanceof SDSReport && !(b instanceof SDSReport)) return -1;
                if(!(a instanceof SDSReport) && b instanceof SDSReport) return 1;
                return 0;
            });

            if (pendingMessages.length > 0 && timeSinceLastMessage > 100 && (this.#waitingForMessageSentAck == false || timeSinceLastMessage > 5000)) {
                const message = pendingMessages[0];

                const atCommand = message.toAT()
                this.#serialPort.write(atCommand);
                this.#sdsLastSentMessageAt = new Date();
                this.#waitingForMessageSentAck = true;

                if(message?.status) {
                    message.status.sendPrepared = true;
                    message.status.sendPreparedAt = this.#sdsLastSentMessageAt;
    
                    message._getEventEmitter().emit('sendPrepared', message);
                    message._getEventEmitter().emit('change', message);
                }
            }
        }, 100);

        //end of constructor
    }

    /**
     * Sends a message.
     *
     * @param {Object} options - The options for the message.
     * @param {number} [options.issi=0] - The ISSI (Individual Short Subscriber Identity) of the recipient.
     * @param {string} [options.body=''] - The body of the message.
     * @param {boolean} [options.instantMessage=false] - Indicates if the message is an instant message.
     * @param {boolean} [options.deliveryReport=false] - Indicates if a delivery report is requested.
     * @param {boolean} [options.consumedReport=false] - Indicates if a consumed report is requested.
     * @returns {SDSMessage} - The sent SDSMessage object.
     */
    sendMessage({issi = 0, body = '', instantMessage = false, deliveryReport = false, consumedReport = false}){
        const messageReference = this.#getMessageReference();
        const uuid = require('crypto').randomBytes(16).toString('hex');

        const sdsMessage = new SDSMessage({
            uuid: uuid,
            issi: issi,
            body: body,
            instantMessage: instantMessage,
            deliveryReport: deliveryReport,
            consumedReport: consumedReport,
            messageReference: messageReference,
        });

        this.#sdsMessages.push(sdsMessage);

        return sdsMessage;
    }

    enableGpsReporting({issi = 0, enableReporting = true, enableBacklog = false}){
        const gpsloc = new LocationReportingEnableDisable({
            issi: issi,
            enableReporting: enableReporting,
            enableBacklog: enableBacklog,
        })
        this.#sdsMessages.push(gpsloc);

        return gpsloc;
    }

    requestBasicLocationParameters({issi = 0}){
        const basicLocationParameters = new BasicLocationParameters({
            issi: issi
        });

        this.#sdsMessages.push(basicLocationParameters);

        return basicLocationParameters;
    }

    requestImmediateLocationReport({issi = 0, shortReport = true}){
        const immediateLocationReport = new ImmediateLocationReport({
            issi: issi,
            reportType: shortReport ? 'short' : 'long'
        });

        this.#sdsMessages.push(immediateLocationReport);

        return immediateLocationReport;
    }

    sendPresenceCheck({issi = 0}){
        const messageReference = this.#getMessageReference();
        const uuid = require('crypto').randomBytes(16).toString('hex');

        const sdsMessage = new SDSPresenceDetection({
            uuid: uuid,
            issi: issi,
            messageReference: messageReference,
        });

        this.#sdsMessages.push(sdsMessage);

        return sdsMessage;
    }

    /**
     * Registers an event listener for the specified event.
     *
     * @param {string} eventName - The name of the event to listen for.
     * @param {Function} callback - The callback function to be executed when the event is triggered.
     */
    on(eventName, callback){
        this.#eventEmitter.on(eventName, callback);
    }

    /**
     * Unsubscribes a callback function from an event.
     *
     * @param {string} eventName - The name of the event to unsubscribe from.
     * @param {Function} callback - The callback function to unsubscribe.
     */
    off(eventName, callback){
        this.#eventEmitter.off(eventName, callback);
    }

    /**
     * Adds a one-time listener function for the specified event.
     *
     * @param {string} eventName - The name of the event to listen for.
     * @param {Function} callback - The function to be called when the event is triggered.
     */
    once(eventName, callback){
        this.#eventEmitter.once(eventName, callback);
    }


    #getMessageReference() {
        for (let i = 1; i < 256; i++) {
            if (!this.#sdsMessages.some(msg => msg.messageReference === i)) {
                return i;
            }
        }
        throw new Error('No available message reference');
    }
}

module.exports = TetraJS;