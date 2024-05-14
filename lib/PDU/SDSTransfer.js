const Byte = require('../Byte');

/**
 * Represents an SDS (Short Data Service) Transfer.
 */
class SDSTransfer {
    #sourceString = '';

    /**
     * Creates a new instance of SDSTransfer.
     * @param {Object} options - The options for the SDSTransfer.
     * @param {number} [options.protocolIdentifier=130] - The protocol identifier.
     * @param {boolean} [options.deliveryReport=false] - Indicates if delivery report is requested.
     * @param {boolean} [options.consumedReport=false] - Indicates if consumed report is requested.
     * @param {boolean} [options.allowGroupService=false] - Indicates if group service is allowed.
     * @param {boolean} [options.storageForwardControl=false] - Indicates if storage and forward control is enabled.
     * @param {number} [options.messageReference=0] - The message reference.
     * @param {number} [options.validityPeriod=0] - The validity period.
     * @param {string} [options.body=''] - The message body.
     */
    constructor({
        protocolIdentifier = 130,
        deliveryReport = false,
        consumedReport = false,
        allowGroupService = false,
        storageForwardControl = false,
        messageReference = 0,
        validityPeriod = 0,
        issi = 0,
        body = '',
        direction = 'sent'
    } = {}) {
        this.protocolIdentifier = protocolIdentifier;
        this.deliveryReport = deliveryReport;
        this.consumedReport = consumedReport;
        this.allowGroupService = allowGroupService;
        this.storageForwardControl = storageForwardControl;
        this.messageReference = messageReference;
        this.validityPeriod = validityPeriod;
        this.body = body;
        this.issi = parseInt(issi);
        this.direction = direction;
    }

    /**
     * Calculates the length of the SDS Transfer.
     * @returns {number} The length of the SDS Transfer in bits.
     */
    length() {
        const string = this.toString();
        return string.length * 4;
    }

    /**
     * Converts the SDS Transfer to a string representation.
     * @returns {string} The string representation of the SDS Transfer.
     */
    toString() {
        var byte1 = new Byte();
        var byte2 = new Byte();
        var byte3 = new Byte();
        var byte4 = new Byte();

        //all 8 bits are used for the protocol identifier 
        //(ETSI EN 300 392-2 - V3.8.1 -> 29.4.3.9)
        byte1.setInt(this.protocolIdentifier);

        //Message type, always 0000 for SDS transfer 
        //(ETSI EN 300 392-2 - V3.8.1 -> 29.4.3.8)
        byte2.setBit(7, 0);
        byte2.setBit(6, 0);
        byte2.setBit(5, 0);
        byte2.setBit(4, 0);

        //Delivery report request
        //(ETSI EN 300 392-2 - V3.8.1 -> 29.4.3.3)
        byte2.setBit(2, this.deliveryReport);
        byte2.setBit(3, this.consumedReport);

        //Service selection/short form report (aka allow group service)
        //(ETSI EN 300 392-2 - V3.8.1 -> 29.4.3.10)
        byte2.setBit(1, this.allowGroupService);

        //Storage and forward control
        //(ETSI EN 300 392-2 - V3.8.1 -> 29.4.3.12)
        byte2.setBit(0, this.storageForwardControl);

        //Message reference
        //(ETSI EN 300 392-2 - V3.8.1 -> 29.4.3.7)
        byte3.setInt(this.messageReference);

        //Validity period
        //(ETSI EN 300 392-2 - V3.8.1 -> 29.4.3.14)
        //to be implemented in the future

        //Forward Address type, for now this is always 001
        //(ETSI EN 300 392-2 - V3.8.1 -> 29.4.3.5)
        byte4.setBit(2, 0);
        byte4.setBit(1, 0);
        byte4.setBit(0, 1);

        var hexBody = Buffer.from(this.body, 'utf8').toString('hex');

        return byte1.hex + byte2.hex + byte3.hex + byte4.hex + hexBody;
    }

    /**
     * Parses a string representation of a SDS transfer and sets the corresponding properties.
     * @param {string} string - The string representation of the SDS transfer.
     */
    fromString(string) {
        //get fist 2 characters
        var byte1 = new Byte();
        byte1.hex = string.substring(0, 2);

        //get next 2 characters
        var byte2 = new Byte();
        byte2.hex = string.substring(2, 4);

        //get next 2 characters
        var byte3 = new Byte();
        byte3.hex = string.substring(4, 6);

        //get next 2 characters
        var byte4 = new Byte();
        byte4.hex = string.substring(6, 8);

        //get the rest of the string
        var hexBody = string.substring(8);

        this.protocolIdentifier = byte1.decimal;
        this.deliveryReport = byte2.getBit(2);
        this.consumedReport = byte2.getBit(3);
        this.allowGroupService = byte2.getBit(1);
        this.storageForwardControl = byte2.getBit(0);
        this.messageReference = byte3.decimal;
        this.validityPeriod = 0; //to be implemented in the future
        this.body = Buffer.from(hexBody, 'hex').toString('utf8');   

        this.#sourceString = string;
    }

    get sourceString() {
        return this.#sourceString;
    }

    get bodyRaw() {
        return Buffer.from(this.body, 'utf8');
    }
}

module.exports = SDSTransfer;