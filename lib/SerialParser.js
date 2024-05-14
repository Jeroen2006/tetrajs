const EventEmitter = require('node:events');
const Byte = require('./Byte');
const SDSTransfer = require('./PDU/SDSTransfer');
const SDSReport = require('./PDU/SDSReport');
const LocationReportingEnableDisable = require('./PDU/LocationReportingEnableDisable');
const BasicLocationParameters = require('./PDU/BasicLocationParameters');

/**
 * Represents a Serial Parser that parses data received from a serial port.
 */
class SerialParser {
    #serialPort = null;
    #eventEmitter = null;
    #twoLineCommandData = null;
    
    /**
     * Creates an instance of SerialParser.
     * @param {SerialPort} serialPort - The serial port to listen for data.
     */
    constructor(serialPort) {
        this.#serialPort = serialPort;
        this.#eventEmitter = new EventEmitter();

        this.#serialPort.on('data', this.#parseData.bind(this));
    }

    /**
     * Parses the received data.
     * @param {Buffer} data - The data received from the serial port.
     */
    #parseData(data) {
        data = data.replace(/[\r\n]/g, '');
        if (data === '' || data === '' || data === 'OK') return;

        //console.log(data);

        const oneLineCommands = ['+CMGS', '+CTBCT', '+CSQ', '+CNUMF', '+CTOM', '+CCLK', '+CTOCP'];
        const twoLineCommands = ['+CTSDSR'];

        if(this.#twoLineCommandData != null){
            this.#parseCommand(this.#twoLineCommandData, data);
            this.#twoLineCommandData = null;
            return;
        } 

        for (var i = 0; i < oneLineCommands.length; i++) {
            if (data.startsWith(oneLineCommands[i])) {
                this.#parseCommand(data, null);
                return;
            }
        }

        for (var i = 0; i < twoLineCommands.length; i++) {
            if (data.startsWith(twoLineCommands[i])) {
                this.#twoLineCommandData = data;
                return;
            }
        }
    }

    /**
     * Parses the command and value from the given input lines.
     *
     * @private
     * @param {string} lineOne - The first line of input.
     * @param {string} lineTwo - The second line of input.
     */
    #parseCommand(lineOne, lineTwo){
        const { command, value } = this.#extractCommand(lineOne);

        switch(command){
            case '+CCLK': // Date and time (GPS in DMO, Network time in TMO)
                const [date, time] = value.split(",");
                const [year, month, day] = date.split("/");
                const [hours, minutes, seconds] = time.split(":").map((item, index) => index === 2 ? item.split("+")[0] : item);
                const halfHoursOffset = parseInt(time.split("+")[1]);
                const dateObj = new Date(parseInt(year) + 2000, parseInt(month) - 1, day, parseInt(hours) + (halfHoursOffset / 2), minutes, seconds);

                this.#eventEmitter.emit('CCLK', dateObj);
                break;


            case '+CSQ': // Signal strength (TMO only)
                const signalStrengthOffset = parseInt(value.split(",")[0]);
                let signalStrength = signalStrengthOffset === 99 ? 0 : -113 + 2 * signalStrengthOffset;

                this.#eventEmitter.emit('CSQ', signalStrength);
                break;


            case '+CTOM': // Operating mode
                const modeMapping = {
                    '0': 'TMO',
                    '1': 'DMO',
                    '6': 'REPEATER',
                    '5': 'GATEWAY'
                };
                
                const operatingMode = modeMapping[value.split(",")[0]] || "DMO";
                this.#eventEmitter.emit('CTOM', operatingMode);
                break;

            case '+CNUMF':
                var [zero, number] = value.split(",");
                const countryCode = parseInt(number.substring(0, 3));
                const networkCode = parseInt(number.substring(4, 8));
                const subscriberNumber = parseInt(number.substring(8));

                this.#eventEmitter.emit('CNUMF', {
                    countryCode,
                    networkCode,
                    subscriberNumber
                });
                break;
            
            case '+CMGS':
                var [sdsStack, sdsStatus, messageReference] = value.split(",");
                if(sdsStatus == null) break;

                messageReference = messageReference.split("\r")[0];
                this.#eventEmitter.emit('CMGS', {
                    messageReference: parseInt(messageReference),
                    sdsStatus: parseInt(sdsStatus)
                });
                break;


            case '+CTSDSR':
                var [service, callingParty, callingPartyType, calledParty, calledPartyType, messageLength] = value.split(",");

                const byte2 = new Byte(lineTwo.substring(2, 4));
                const byte1 = new Byte(lineTwo.substring(0, 2));

                //get messageType
                const bit8 = byte2.getBit(7);
                const bit7 = byte2.getBit(6);
                const bit6 = byte2.getBit(5);
                const bit5 = byte2.getBit(4);
                //0 0 0 0; SDS-TRANSFER
                //0 0 0 1; SDS-REPORT
                //0 0 1 0; SDS-ACK

                //GPS
                if(byte1.hex == '0A') {
                    const bit4 = byte2.getBit(3);
                    const bit3 = byte2.getBit(2);
                    
                    if(byte2.hex == '00' || byte2.hex == '10' || byte2.hex == '30'){ //GPS position report
                        const sdsTransfer = new SDSTransfer({
                            issi: callingParty,
                            direction: 'received'
                        });
                        sdsTransfer.fromString(lineTwo);
    
                        this.#eventEmitter.emit('CTSDST', sdsTransfer);
                        this.#eventEmitter.emit('SDSTRANSFER', sdsTransfer);
                        this.#eventEmitter.emit('SDSTRANSFER-WITH-METADATA', {
                            sdsTransfer,
                            service,
                            callingParty,
                            callingPartyType,
                            calledParty,
                            calledPartyType,
                            messageLength
                        });
                    } else if(bit6 == 1 && bit5 == 0 && bit4 == 1 && bit3 == 0){ //1 0 1 0; Location Reporting Enable/Disable
                        const locationReporting = new LocationReportingEnableDisable({
                            issi: callingParty,
                        });
                        locationReporting.fromString(lineTwo);
                    } else if(bit6 == 1 && bit5 == 0 && bit4 == 0 && bit3 == 1){ //1 0 0 1; Basic Location Parameters
                        const locationReporting = new BasicLocationParameters({
                            issi: callingParty,
                        });
                        locationReporting.fromString(lineTwo);
                    }



                    return;
                }

                

                if(bit8 == 0 && bit7 == 0 && bit6 == 0 && bit5 == 0){
                    const sdsTransfer = new SDSTransfer({
                        issi: callingParty,
                        direction: 'received'
                    });
                    sdsTransfer.fromString(lineTwo);

                    this.#eventEmitter.emit('CTSDST', sdsTransfer);
                    this.#eventEmitter.emit('SDSTRANSFER', sdsTransfer);
                    this.#eventEmitter.emit('SDSTRANSFER-WITH-METADATA', {
                        sdsTransfer,
                        service,
                        callingParty,
                        callingPartyType,
                        calledParty,
                        calledPartyType,
                        messageLength
                    });
                } else if(bit8 == 0 && bit7 == 0 && bit6 == 0 && bit5 == 1){
                    const sdsReport = new SDSReport({
                        issi: callingParty,
                        direction: 'received'
                    });
                    sdsReport.fromString(lineTwo);

                    this.#eventEmitter.emit('CTSDSR', sdsReport);
                    this.#eventEmitter.emit('SDSREPORT', sdsReport);
                } else if(bit8 == 0 && bit7 == 0 && bit6 == 1 && bit5 == 0){
                    //SDS-ACK
                }
            }
    }

    /**
     * Extracts the command and value from a given line.
     *
     * @param {string} line - The input line to extract the command and value from.
     * @returns {Object} An object containing the extracted command and value.
     */
    #extractCommand(line){
        var command = line.split(":")[0].trim();
        var value = line.split(":")[1].trim();
        for(var i = 2; i < line.split(":").length; i++){
            value += ':' + line.split(":")[i].trim();
        }

        return { command, value }
    }

    /**
     * Registers an event listener for the specified event.
     * @param {string} event - The name of the event to listen for.
     * @param {Function} listener - The callback function to be executed when the event is emitted.
     * @returns {EventEmitter} The EventEmitter instance for chaining.
     */
    on(event, listener) {
        return this.#eventEmitter.on(event, listener);
    }
}

module.exports = SerialParser;