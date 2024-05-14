const gpsUtils = require('../gpsUtils');

const sendingReasons = {
    0: 'Powered On',
    1: 'Powered Off',
    2: 'Emergency',
    3: 'PTT',
    4: 'Status',
    5: 'TXI On',
    6: 'TXI Off',
    7: 'Entered TMO',
    8: 'Entered DMO',
    9: 'Service Restored',
    10: 'Service Lost',
    11: 'Cell Change',	
    12: 'Low Battery',
    13: 'Connected to Car Kit',
    14: 'Disconnected from Car Kit',
    15: 'Transfer Initialization Configuration',
    16: 'Arrived at Destination',
    17: 'Arrived at Location',
    18: 'Approaching Location',
    19: 'SDS type 1',
    20: 'User Application',
    21: 'GPS Lock Lost',
    22: 'GPS Lock Restored',
    23: 'Leaving Location',
    24: 'Ambiance Listening',
    25: 'Temporary Reporting',
    26: 'Normal Reporting',
    27: 'Call Setup Type 1',
    28: 'Call Setup Type 2',
    32: 'Immediate Reporting',
    129: 'Max Interval Reached',
    130: 'Max Distance Reached',
}

class SDSGPSShort {
    constructor(
        {
            lat = 0,
            lon = 0,
            accuracy = 'Not known',
            horizontalVelocity = 0,
            direction = 0,
            issi = 0
        } = {}) {
        this.latitude = lat;
        this.longitude = lon;
        this.accuracy = accuracy;
        this.horizontalVelocity = horizontalVelocity;
        this.direction = direction;
        this.issi = issi
        this.reasonForSending = 'Unknown';
    }

    /**
     * Parses a string representation of a GPS message and extracts relevant information.
     * @param {string} string - The string representation of the GPS message.
     */
    fromString(string){
        //remove first 2 characters (protocol identifier)
        string = string.substring(2);

        var messageBits = '';
        for (var i = 0; i < string.length; i += 2) {
            var byte = string.substring(i, i + 2);
            messageBits += parseInt(byte, 16).toString(2).padStart(8, '0');
        }
        
        var longitude = messageBits.substring(4, 29);
        var latitude = messageBits.substring(29, 53);
        var positionAcc = messageBits.substring(53, 56);
        var horizontalVelocity = messageBits.substring(56, 63);
        var direction = messageBits.substring(63, 67);
        var reasonForSending = messageBits.substring(68, 76);
        reasonForSending = parseInt(reasonForSending, 2);
        
        this.reasonForSending = sendingReasons[reasonForSending] || 'Unknown';
        

        this.longitude = gpsUtils.convertBinaryToLongitude(longitude);
        this.latitude = gpsUtils.convertBinaryToLatitude(latitude);
        this.accuracy = gpsUtils.convertBinaryPositionErrorToString(positionAcc);
        this.horizontalVelocity = gpsUtils.convertHorizontalSpeedBitsToInteger(horizontalVelocity);
        this.direction = gpsUtils.convertDirectionBitsToString(direction);
    }

}

module.exports = SDSGPSShort;