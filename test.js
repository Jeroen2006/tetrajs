const TetraJS = require('./index');
const radio = new TetraJS('COM6', 460800);

// setInterval(() => {
//     console.log(radio)
// }, 5000);


// var presenceCheck = radio.sendPresenceCheck({
//     issi: 12543343
// })

// presenceCheck.on('result', function (result) {
//     console.log('Presence check result: ', result);
// });

// presenceCheck.on('delivered', function () {
//     console.log('Message delivered!');
// });



// radio.enableGpsReporting({
//     issi: 12543343,
//     enableReporting: false,
//     enableBacklog: false,
// })


// radio.enableGpsReporting({
//     issi: 9018300,
//     enableReporting: false,
//     enableBacklog: false,
// })

// var gpsReporting = radio.enableGpsReporting({
//     issi: 15432342,
//     enableReporting: false,
// })

// gpsReporting.on('sendPrepared', (message)=>{
//     console.log('GPS Reporting sent: ', message)

// })

// radio.sendMessage({
//     issi: 15432342,
//     body: 'Hello World!',
//     instantMessage: false,
//     deliveryReport: true,
//     consumedReport: false
// });

// radio.requestImmediateLocationReport({
//     issi: 15432342,
//     shortReport: true
// });

// radio.sendMessage({
//     issi: '9015080',
//     body: `sdsdsd`,
//     instantMessage: true,
//     deliveryReport: true,
//     consumedReport: false
// });

var report = radio.requestImmediateLocationReport({
    issi: 15432342,
    shortReport: true
});

var report2 = radio.requestImmediateLocationReport({
    issi: 12543343,
    shortReport: true
});

var report3 = radio.requestImmediateLocationReport({
    issi: 9018300,
    shortReport: true
});


report.once('received', (msg)=>{
    console.log('Received1: ', msg)

    radio.sendMessage({
        issi: msg.issi,
        body: `${msg.latitude}, ${msg.longitude}`,
        instantMessage: true,
        deliveryReport: true,
        consumedReport: false
    });
    
})

report2.once('received', (msg)=>{
    console.log('Received2: ', msg)

    radio.sendMessage({
        issi: msg.issi,
        body: `${msg.latitude}, ${msg.longitude}`,
        instantMessage: true,
        deliveryReport: true,
        consumedReport: false
    });
})

report3.once('received', (msg)=>{
    console.log('Received3: ', msg)

    radio.sendMessage({
        issi: msg.issi,
        body: `${msg.latitude}, ${msg.longitude}`,
        instantMessage: true,
        deliveryReport: true,
        consumedReport: false
    });
})


// radio.requestImmediateLocationReport({
//     issi: 12543343,
//     shortReport: true
// });

radio.on('gps', function (message) {
    console.log('GPS received: ', message);
});



// radio.requestBasicLocationParameters({
//     issi: 15432342
// });

//SEND MESSAGE
// 

// message.on('sent', function () {
//     console.log('Message sent!');
// });

// message.on('delivered', function () {
//     console.log('Message delivered!');
// });

// message.on('consumed', function () {
//     console.log('Message consumed!');
// });

radio.on('received-message', function (message) {
    console.log('Message received: ', message);
});
