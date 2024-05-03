const TetraController = require('./class/TetraController');

const controller = new TetraController({
    serialPort: 'COM7',
});

controller.on('messageReceived', (message) => {
    if(message.body.length == 0) return;

    console.log(message);
});

//9029999
//controller.setIssi(2045464);
//controller.setIssi(9029999);
//controller.dmo();

controller.on('gps', (message) => {
    console.log(message);
});

controller.on('status', (message) => {
    console.log(message);
});

// controller.on('time', (time) => {
//     console.log(time);
// });

// controller.presenceCheck(9015080).then((response) => {
//     console.log(`9015080: ${response}`);
// });
// // controller.presenceCheck(9019110).then((response) => {
// //     console.log(`9019110: ${response}`);
// // });
// controller.presenceCheck(9012113).then((response) => {
//     console.log(`9012113: ${response}`);
// });
// controller.presenceCheck(9012112).then((response) => {
//     console.log(`9012112: ${response}`);
// });
// controller.presenceCheck(9018300).then((response) => {
//     console.log(`9018300: ${response}`);
// });

//const message1 = controller.sendMessage('Kom ETEN', '9019110', { autoOpen: true, readReport: false, deliveredReport: true });
setTimeout(() => {
    const message1 = controller.sendMessage('TEST', '9015080', { autoOpen: true, readReport: false, deliveredReport: true });
}, 1000);
// const message3 = controller.sendMessage('Kom ETEN', '9018300', { autoOpen: true, readReport: false, deliveredReport: true });
// const message2 = controller.sendMessage('Kom ETEN', '9012112', { autoOpen: true, readReport: false, deliveredReport: true });
// const message4 = controller.sendMessage('Kom ETEN', '9012113', { autoOpen: true, readReport: false, deliveredReport: true });
// const message5 = controller.sendMessage('Kom ETEN', '9015080', { autoOpen: true, readReport: false, deliveredReport: true });

// message1.sentPromise.then(() => {
//     const message2 = controller.sendMessage('Kom ETEN', '9019110', { autoOpen: true, readReport: false,  deliveredReport: false});
//     message2.sentPromise.then(() => {
//         const message3 = controller.sendMessage('Kom ETEN', '9012113', { autoOpen: true, readReport: false,  deliveredReport: false});
//     });
//     // console.log('Message sent');
//     // console.log(message)
// });

// message.deliveredPromise.then(() => {
//     console.log('Message delivered');
//     console.log(message)
// });

// message.readPromise.then(() => {
//     console.log('Message read');
//     console.log(message)
// });
// controller.sendMessage('Hello, World!', '9012113')
// controller.sendMessage('Hello, World!', '9012113')