const { SerialPort, ReadlineParser  } = require('serialport')

/**
 * Represents a Motorola Serial Port.
 */
class MotorolaSerialPort {
    #listeners = []
    #writeQueue = []
    #serialport = null
    #parser = null
    #reconnect = true

    /**
     * Creates an instance of MotorolaSerialPort.
     * @param {string} path - The path to the serial port.
     * @param {number} [baudRate=460800] - The baud rate of the serial port.
     * @param {object} [options={}] - Additional options for the serial port.
     */
    constructor(path, baudRate = 460800, options = {}) {
        this.#serialport = new SerialPort({ path, baudRate })
        this.#parser = this.#serialport.pipe(new ReadlineParser())
        this.#parser.on('data', this.#onData.bind(this));

        this.#serialport.on('open', () => {
            setInterval(() => {
                if (this.#writeQueue.length > 0) {
                    const data = this.#writeQueue.shift()
                    this.#serialport.write(data)
                }
            }, 100);

            this.#listeners.forEach(listener => {
                if (listener.event === 'open') {
                    listener.callback()
                }
            })
        })

        this.#serialport.on('error', (error) => {
            console.log('error', error)
            this.#listeners.forEach(listener => {
                if (listener.event === 'error') {
                    listener.callback(error)
                }
            })
        })

        this.#serialport.on('close', () => {
            console.log('close')
            if (this.#reconnect) {
                setTimeout(() => {
                    this.#serialport.open()
                }, 1000)
            }

            this.#listeners.forEach(listener => {
                if (listener.event === 'close') {
                    listener.callback()
                }
            })
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

    /**
     * Writes data to the serial port.
     * @param {any} data - The data to be written.
     */
    write(data) {
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