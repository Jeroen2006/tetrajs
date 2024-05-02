const { SerialPort, ReadlineParser  } = require('serialport')

/**
 * Represents a Motorola Serial Port.
 */
class MotorolaSerialPort {
    #listeners = []
    #writeQueue = []
    #reconnect = false

    /**
     * Creates an instance of MotorolaSerialPort.
     * @param {string} path - The path to the serial port.
     * @param {number} [baudRate=460800] - The baud rate of the serial port.
     * @param {object} [options={}] - Additional options for the serial port.
     */
    constructor(path, baudRate = 460800, options = {}) {
        this._serialport = new SerialPort({ path, baudRate })
        this._parser = this._serialport.pipe(new ReadlineParser())
        this._parser.on('data', this.#onData.bind(this));

        this._serialport.on('open', () => {
            setInterval(() => {
                if (this.#writeQueue.length > 0) {
                    const data = this.#writeQueue.shift()
                    this._serialport.write(data)
                }
            }, 100);
        })
    }

    /**
     * Event handler for incoming data.
     * @private
     * @param {any} data - The incoming data.
     */
    #onData(data) {
        this.#listeners.forEach(listener => {
            if (listener.event === 'data') {
                listener.callback(data)
            }
        })
    }

    write(data) {
        //console.log('write', data)
        this.#writeQueue.push(data)
    }

    /**
     * Registers an event listener.
     * @param {string} event - The event name.
     * @param {function} callback - The callback function to be executed when the event occurs.
     */
    on(event, callback) {
        this.#listeners.push({
            event,
            callback
        })
    }
}

module.exports = MotorolaSerialPort