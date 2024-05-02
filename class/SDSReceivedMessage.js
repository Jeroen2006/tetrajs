/**
 * Represents a received SDS (Short Data Service) message.
 */
class SDSReceivedMessage {
    constructor(sentBy, sentTo, messageBody, receivedAt, receiveReport, readReport) {
        this.sentBy = sentBy;
        this.sentTo = sentTo;
        this.body = messageBody;
        this.receivedAt = receivedAt;
        this.receiveReport = receiveReport;
        this.readReport = readReport;
    }
}

module.exports = SDSReceivedMessage;