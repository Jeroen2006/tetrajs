function convertLatitudeToBinary(latitude) {
    // Check if latitude is within the valid range
    if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude out of range. It should be between -90 and 90 degrees.');
    }

    // Convert latitude to the required format
    const scaleFactor = Math.pow(2, 24);
    const latitudeBinary = Math.round((latitude / 180) * scaleFactor).toString(2);

    // Pad the binary representation to 24 bits
    const paddedLatitudeBinary = '0'.repeat(24 - latitudeBinary.length) + latitudeBinary;

    return paddedLatitudeBinary;
}

function convertBinaryToLatitude(binaryString) {
    // Check if the binary string is 24 bits long
    if (binaryString.length !== 24) {
        throw new Error('Invalid binary string length. It should be 24 bits.');
    }

    // Convert binary string to decimal
    const scaleFactor = Math.pow(2, 24);
    const latitudeDecimal = parseInt(binaryString, 2);

    // Scale back to latitude in the range -90 to 90 degrees
    const latitude = (latitudeDecimal / scaleFactor) * 180;


    //round to 6 decimal places
    return Math.round(latitude * 1000000) / 1000000;
}

function convertLongitudeToBinary(longitude) {
    // Check if longitude is within the valid range
    if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude out of range. It should be between -180 and 180 degrees.');
    }

    // Convert longitude to the required format
    const scaleFactor = Math.pow(2, 25);
    const longitudeBinary = Math.round((longitude / 360) * scaleFactor).toString(2);

    // Pad the binary representation to 25 bits
    const paddedLongitudeBinary = '0'.repeat(25 - longitudeBinary.length) + longitudeBinary;

    return paddedLongitudeBinary;
}

// Function to convert binary to longitude
function convertBinaryToLongitude(binaryString) {
    // Check if the binary string is 25 bits long
    if (binaryString.length !== 25) {
        throw new Error('Invalid binary string length. It should be 25 bits.');
    }

    // Convert binary string to decimal
    const scaleFactor = Math.pow(2, 25);
    const longitudeDecimal = parseInt(binaryString, 2);

    // Scale back to longitude in the range -180 to 180 degrees
    const longitude = (longitudeDecimal / scaleFactor) * 360;

    //round to 6 decimal places
    return Math.round(longitude * 1000000) / 1000000;
}


function convertBinaryPositionErrorToString(positionError) {
    const positionErrorMap = {
        '000': '< 2m',
        '001': '< 20m',
        '010': '< 200m',
        '011': '< 2km',
        '100': '< 20km',
        '101': '< 200km',
        '110': '> 200km',
        '111': 'Not known'
    };

    return positionErrorMap[positionError];
}

//convert direction bits(4) to string
function convertDirectionBitsToString(direction) {
    const directionMap = {
        '0000': 'N',
        '0001': 'NNE',
        '0010': 'NE',
        '0011': 'ENE',
        '0100': 'E',
        '0101': 'ESE',
        '0110': 'SE',
        '0111': 'SSE',
        '1000': 'S',
        '1001': 'SSW',
        '1010': 'SW',
        '1011': 'WSW',
        '1100': 'W',
        '1101': 'WNW',
        '1110': 'NW',
        '1111': 'NNW'
    };

    return directionMap[direction];
}

//convert horizontal speed bits(7) to integer
//bit value, speed, steps
// 0	0 km/h	Steps 1 km/h
// 1	1 km/h	
// 2	2 km/h	
// etc.	etc.	
// 28	28 km/h	
// 29	29,1 km/h	3,8 % steps
// 30	30,2 km/h	
// 31	31,3 km/h	
// etc.	etc.	
// 38	40,6 km/h	
// etc.	etc.	
// 44	50,8 km/h	
// etc.	etc.	
// 56	79,5 km/h	
// etc.	etc.	
// 62	99,5 km/h	
// etc.	etc.	
// 67	120 km/h	
// etc.	etc.	
// 81	202 km/h	
// etc.	etc.	
// 92	305 km/h	
// etc.	etc.	
// 105	495km/h	
// etc.	etc.	
// 114	692km/h	
// etc.	etc.	
// 124	1 005 km/h	
// 125	1 043 km/h	3,8 % steps
// 126	More than 1 043 km/h	
// 127	Horizontal speed is not known	See note
function convertHorizontalSpeedBitsToInteger(speed) {
    if (speed === '1111111') {
        return 'Not known';
    }

    const speedInt = parseInt(speed, 2);
    if (speedInt <= 28) {
        return speedInt;
    } else if (speedInt <= 38) {
        return (speedInt - 29) * 3.8 + 29.1;
    } else if (speedInt <= 44) {
        return speedInt * 1.6;
    } else if (speedInt <= 56) {
        return speedInt * 1.7;
    } else if (speedInt <= 62) {
        return speedInt * 2;
    } else if (speedInt <= 67) {
        return speedInt * 2.5;
    } else if (speedInt <= 81) {
        return speedInt * 4;
    } else if (speedInt <= 92) {
        return speedInt * 6;
    } else if (speedInt <= 105) {
        return speedInt * 8;
    } else if (speedInt <= 114) {
        return speedInt * 10;
    } else if (speedInt <= 124) {
        return speedInt * 15;
    } else if (speedInt === 125) {
        return 1043;
    } else {
        return 'More than 1043';
    }
}



module.exports = {
    convertLatitudeToBinary,
    convertBinaryToLatitude,
    convertLongitudeToBinary,
    convertBinaryToLongitude,
    convertBinaryPositionErrorToString,
    convertDirectionBitsToString,
    convertHorizontalSpeedBitsToInteger
};
