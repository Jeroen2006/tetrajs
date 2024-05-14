/**
 * Represents a byte value in hexadecimal format.
 */
class Byte {
    /**
     * Creates a new instance of the Byte class.
     * @param {string} hexInput - The hexadecimal input value.
     */
    constructor(hexInput) {
        this.decimal = parseInt(hexInput, 16);
    }

    /**
     * Gets the hexadecimal representation of the byte.
     * @returns {string} The hexadecimal value.
     */
    get hex() {
        var hex = this.decimal.toString(16).toUpperCase();
        return hex.length % 2 ? '0' + hex : hex;
    }

    /**
     * Sets the hexadecimal value of the Byte.
     * @param {string} hexInput - The hexadecimal value to set.
     */
    set hex(hexInput) {
        this.decimal = parseInt(hexInput, 16);
    }

    /**
     * Get the binary representation of the decimal value.
     * @returns {string} The binary representation of the decimal value.
     */
    get binary() {
        return this.decimal.toString(2).padStart(8, '0');
    }

    set binary(binaryInput) {
        this.decimal = parseInt(binaryInput, 2);
    }

    /**
     * Sets the decimal value of the byte.
     * @param {number} value - The decimal value to set.
     */
    setInt(value) {
        this.decimal = value;
    }

    /**
     * Sets the value of a specific bit in the byte.
     * @param {number} bit - The bit position (0-7).
     * @param {boolean} value - The value to set (true or false).
     */
    setBit(bit, value) {
        if (value) {
            this.decimal |= 1 << bit;
        } else {
            this.decimal &= ~(1 << bit);
        }
    }

    /**
     * Gets the value of a specific bit in the byte.
     * @param {number} bit - The bit position (0-7).
     * @returns {boolean} The value of the bit (true or false).
     */
    getBit(bit) {
        return (this.decimal & (1 << bit)) !== 0;
    }
}

module.exports = Byte;