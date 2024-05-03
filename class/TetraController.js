const { MotorolaSerialPort, SDSReceivedMessage, SDSSentMessage, SDSData } = require('./export');
const serialParser = require('../utils/serialParser');

class TetraController {
    #serialPort = null
    #eventCallbacks = [];
    #sentMessages = []

    /**
     * Creates an instance of TetraController.
     * @param {string} port - The port to connect to.
     */
    constructor({ serialPort, baudRate}) {
        this.#serialPort = new MotorolaSerialPort(serialPort, baudRate);
        this.#serialPort.on('data', this.#onData.bind(this));

        this.countryCode = null;
        this.networkCode = null;
        this.subscriberNumber = null;
        this.signalStrength = null;
        this.sdsAvailable = true;
        this.operatingMode = null;

        this.#serialPort.on('open', () =>{
            this.#serialPort.write('AT+CTSP=1,3,199\r\n') // 
            this.#serialPort.write('AT+CTSP=1,3,130\r\n') //Activate SDS pipe to PEI 
            this.#serialPort.write('AT+CTSP=1,3,131\r\n') //Activate GPS pipe to PEI
            this.#serialPort.write('AT+CTSP=1,3,10\r\n') //Register GPS LIP hanadling
            this.#serialPort.write('AT+CTSP=1,2,20\r\n') //Register SDS status handling
    
            this.#serialPort.write('AT+CREG?\r\n');
            this.#serialPort.write('AT+CTBCT?\r\n');
            this.#serialPort.write('AT+CTOM?\r\n');
            this.#serialPort.write('AT+CNUM?\r\n');
        });

        setInterval(() => {
            this.#serialPort.write('AT+CSQ?\r\n');
            this.#serialPort.write('AT+CCLK?\r\n');
        }, 1000);

        var self = this;
    }

    sendData(data, recipient){
        const messageId = this._getMessageId();

        const sdsData = new SDSData(recipient, data, messageId);
        this.#sentMessages.push(sdsData);

        if(this.#sentMessages.length == 1) this.#sendMessages(this);

        return sdsData;
    }

    sendMessage(message, recipient, options){
        //message length must be 160 characters or less
        if(message.length > 160) return;

        const messageId = this._getMessageId();
        const sdsMessage = new SDSSentMessage(recipient, message, messageId, new Date(), false, null, options?.deliveredReport, false, null, options?.readReport);
        sdsMessage.autoOpen = options?.autoOpen || false;
        this.#sentMessages.push(sdsMessage);
        if(this.#sentMessages.length == 1) this.#sendMessages(this);

        this.#eventCallbacks.forEach(callback => {
            if(callback.event == 'sentMessageCreate'){
                callback.callback(sdsMessage);
            }
        });

        return sdsMessage;
    }

    setIssi(issi){
        setTimeout(() => {
            if(this.subscriberNumber == issi) return;
            this.#serialPort.write(`AT+CNUMF=0,${issi}\r\n`);
        }, 2000);
    }

    tmo(){
        this.#serialPort.write('AT+CTOM=0\r\n');
    }

    dmo(){
        this.#serialPort.write('AT+CTOM=1\r\n');
    }

    presenceCheck(issi, timeout = 10000){
        return new Promise(res=>{
            const messageId = this._getMessageId();
            const sdsMessage = new SDSSentMessage(issi, 'PRESCHECK', messageId, new Date(), false, null, true, true, null, false);
            sdsMessage.presenceCheck = true;
            this.#sentMessages.push(sdsMessage);

            var unsentMessages = this.#sentMessages.filter(m => m.sent == false && m.sentAt == null);
            if(unsentMessages.length == 1) this.#sendMessages(this);

            const callbackIndex = this.#eventCallbacks.push({
                event: 'messageReceived',
                callback: (message) => {
                    if(parseInt(message.sentBy) == issi){
                        this.#eventCallbacks.splice(callbackIndex, 1);
                        res(true);
                    }
                }
            });

            setTimeout(() => {
                this.#eventCallbacks.splice(callbackIndex, 1);
                res(false);
            }, timeout);

        })
    }

    on(event, callback){
        this.#eventCallbacks.push({event, callback});
    }

    #sendMessages(self){
        var unsentMessages = self.#sentMessages.find(m => m.sent == false && m.sentAt == null);
        if(unsentMessages && self.sdsAvailable){
            const serialData = unsentMessages.toSerial(unsentMessages?.presenceCheck || false)
            const hexLength = serialData.length*4
            unsentMessages.sentAt = new Date();
            
            this.#serialPort.write(`AT+CMGS=${unsentMessages.sentTo},${hexLength}\r\n${serialData}\x1A`);

            if(unsentMessages.deliveredReport != true) unsentMessages.sentPromise.then(() => {
                self.#sendMessages(self);
            });
            if(unsentMessages.deliveredReport == true) {
                var autoSendTimeout = setTimeout(() => {
                    self.#sendMessages(self);
                }, 5000);
                unsentMessages.deliveredPromise.then(() => {
                    self.#sendMessages(self);
                    clearTimeout(autoSendTimeout);
                });
            }
        }
    }

    #onData(data) {
        const serialData = serialParser(data, this.#serialPort);
        if(serialData == null) return;

        if(serialData?.countryCode) this.countryCode = serialData.countryCode;
        if(serialData?.networkCode) this.networkCode = serialData.networkCode;
        if(serialData?.subscriberNumber) this.subscriberNumber = serialData.subscriberNumber;
        if(serialData?.signalStrength) this.signalStrength = serialData.signalStrength;
        if(serialData?.sdsAvailable) this.sdsAvailable = serialData.sdsAvailable;

        //log type of message
        if(serialData instanceof SDSReceivedMessage){
            this.#eventCallbacks.forEach(callback => {
                if(callback.event == 'messageReceived'){
                    callback.callback(serialData);
                }
            });
        }

        if(serialData?.date != null){
            this.#eventCallbacks.forEach(callback => {
                if(callback.event == 'time'){
                    callback.callback(serialData.date);
                }
            });
        }

        if(serialData?.type == 'statusMessage'){
            this.#eventCallbacks.forEach(callback => {
                if(callback.event == 'status'){
                    callback.callback(serialData);
                }
            });
        }

        if(serialData?.type == 'operatingMode'){
            switch(serialData.mode){
                case '0':
                    this.operatingMode = 'TMO';
                    break;
                case '1':
                    this.operatingMode = 'DMO';
                    break;
                case '6,0':
                    this.operatingMode = 'DMO REPEATER';
                    break;
                case '5,3':
                    this.operatingMode = 'GATEWAY';
                    break;
            }
        
            this.#eventCallbacks.forEach(callback => {
                if(callback.event == 'operatingMode'){
                    callback.callback(this.operatingMode);
                }
            });
        }

        if(serialData?.type == 'gpsMessage'){
            this.#eventCallbacks.forEach(callback => {
                if(callback.event == 'gps'){
                    callback.callback(serialData);
                }
            });
        }



        if(serialData?.type == 'receivedReceipt' || serialData?.type == 'readReceipt' || serialData?.type == 'messageSent'){
            var message = this.#sentMessages.find(m => m.messageId == serialData.messageId);
            if(message == null) return;

            if(serialData.type == 'messageSent') {
                message.sent = true;
                message.sentAt = new Date();
                message.sentResolve(true);

                this.#eventCallbacks.forEach(callback => {
                    if(callback.event == 'sendMessageSent'){
                        callback.callback(message);
                    }
                });

            }

            if(serialData.type == 'receivedReceipt') {
                message.deliveredAt = new Date();
                message.delivered = true;
                message.deliveredResolve(true);

                this.#eventCallbacks.forEach(callback => {
                    if(callback.event == 'sendMessageReceived'){
                        callback.callback(message);
                    }
                });
            }

            if(serialData.type == 'readReceipt') {
                message.readAt = new Date();
                message.read = true;
                message.readResolve(true);

                this.#eventCallbacks.forEach(callback => {
                    if(callback.event == 'sendMessageRead'){
                        callback.callback(message);
                    }
                });
            }
        }
    }

    _getMessageId(){
        var id = 0;
        for(var i = 1; i < 200; i++){
            if(this.#sentMessages.find(m => m.messageId == i) == null) id = i;
        }
    
        if(id == 0) {
            var messagesWithTetrareference = this.#sentMessages.map(m => m.messageId);
    
            //set tetraReference to 0 on oldest message 
            var oldestMessage = his.#sentMessages.find(m => m.messageId == Math.min(...messagesWithTetrareference));
            oldestMessage.messageId = 0;
    
            //try again
            return this._getMessageId();
        }
    
        return id;
    }


}

module.exports = TetraController;