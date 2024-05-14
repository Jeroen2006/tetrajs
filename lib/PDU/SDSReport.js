const Byte = require('../Byte');

const deliveryStatusMapping = {
    '00000000': 'delivered',
    '00000001': 'receivedAck',
    '00000010': 'consumed',
    '00000011': 'consumedAck',
    '00000100': 'forwardedToExternal',
    '00000101': 'groupAckPrevented',
    '00000110': 'concatPartAck',
    '00100000': 'congestionRetry',
    '00100001': 'stored',
    '00100010': 'destinationUnavailable',
    '01000000': 'networkOverload',
    '01000010': 'serviceNotAvailable',
    '01000001': 'serviceNotSupported',
    '01000011': 'senderNotAuthorized',
    '01000100': 'destinationNotAuthorized',
    '01000101': 'unkownDestination',
    '01000110': 'unknownSender',
    '01000111': 'groupWithIndividualServiceNotSupported',
    '01001000': 'validityPeriodExpired',
}


class SDSReport {
    constructor({protocolIdentifier = 130, ackRequired = false, storageForwardControl = false, deliveryStatus = 'delivered', messageReference = 0, issi = 0, direction = 'sent'} = {}) {
        this.protocolIdentifier = protocolIdentifier;
        this.ackRequired = ackRequired;
        this.storageForwardControl = storageForwardControl;
        this.deliveryStatus = deliveryStatus;
        this.messageReference = messageReference;
        this.issi = parseInt(issi);
        this.direction = direction;
    }

    /**
     * Converts the SDSReport object to a string representation.
     * @returns {string} The string representation of the SDSReport object.
     */
    toString(){
        var byte1 = new Byte();
        byte1.decimal = this.protocolIdentifier;

        var byte2 = new Byte();
        //set bit 4 to 1, so message type is SDS-ACK
        byte2.setBit(4, true);
        
        byte2.setBit(3, this.ackRequired);
        byte2.setBit(0, this.storageForwardControl);

        var byte3 = new Byte();

        //convert deliveryStatus to binary

        const reverseDeliveryStatusMapping = Object.keys(deliveryStatusMapping).reduce((acc, key) => {
            acc[deliveryStatusMapping[key]] = key;
            return acc;
        }, {});

        byte3.binary = reverseDeliveryStatusMapping[this.deliveryStatus] || '00000000';

        var byte4 = new Byte();
        byte4.decimal = this.messageReference;

        return byte1.hex + byte2.hex + byte3.hex + byte4.hex;
    }

    /**
     * Converts the SDSReport object to AT command format.
     * @returns {string} The AT command string.
     */
    toAT(){
        const data = this.toString();
        const length = this.length();

        return `AT+CMGS=${this.issi},${length}\r\n${data.toUpperCase()}\x1A`;
    }

    /**
     * Parses a string representation of a SDS report and sets the corresponding properties.
     * @param {string} string - The string representation of the SDS report.
     */
    fromString(string) {
        var byte1 = new Byte();
        byte1.hex = string.substring(0, 2);

        var byte2 = new Byte();
        byte2.hex = string.substring(2, 4);

        var byte3 = new Byte();
        byte3.hex = string.substring(4, 6);

        var byte4 = new Byte();
        byte4.hex = string.substring(6, 8);
        this.messageReference = byte4.decimal;

        this.protocolIdentifier = byte1.decimal;
        this.ackRequired = byte2.getBit(3);
        this.storageForwardControl = byte2.getBit(0);

        const byte3Binary = byte3.binary;
        this.deliveryStatus = deliveryStatusMapping[byte3Binary] || 'delivered';
    }

    /**
     * Calculates the length of the SDSReport in bytes.
     * 
     * @returns {number} The length of the SDSReport in bytes.
     */
    length() {
        const string = this.toString();
        return string.length * 4;
    }
}

module.exports = SDSReport;