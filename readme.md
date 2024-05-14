
  

# TetraJS

A library that simplifies sending/receiving data over a TETRA network using a Motorola mobile/handheld radio.

With this library you can send and receive various kinds of data from other radios. It also supports machine-to-machine communication (TMO Only). Currently the library supports the following types of data:

  

- Normal Text Messages
- Immidiate Text Messages 
- GPS LIP Short Location reports
- Request GPS Config
- Request GPS Position


  

# Tested Hardware

The library should work with every Motorola TETRA radio that has a PEI interface (and all features on the interface are enabled). But just to be sure, it has been tested on the following models:

- MTM5400 (TMO & DMO)
- MTP6550 (TMO & DMO)

  

# Docs

## Class 'TetraJS'

    //Put the connected radio in TMO mode, returns null
    TetraJS.dmo(); 

	//Put the connected radio in TMO mode, returns null
    TetraJS.tmo(); 

	//Change ISSI of the radio (will cause the radio to reboot!), returns null
    TetraJS.setIssi(ISSI);

	//Send a presence check over the network, returns 'SDSPresenceDetection' object
    radio.sendPresenceCheck({
		issi: //Target radio ISSI
	})

	//Send message to a radio, returns 'SDSMessage' object
	TetraJS.sendMessage({
		issi: //Target radio ISSI
		body: //Message body
		instantMessage: //Automatically open on radio
		deliveryReport: //Send report on delivery
		consumedReport: //Send report on consumed (read)
	});

	//Enable GPS LIP reports on radio, returns 'LocationReportingEnableDisable' object
	TetraJS.enableGpsReporting({
		issi: //Target radio ISSI
		enableReporting: //Enable LIP Trigger reporting (true/false)
		enableBacklog: //Enable backlog reporting (true/false)
	})
	
	//Request immediate location from radio, returns 'ImmediateLocationReport' object
	TetraJS.requestImmediateLocationReport({
		issi:  12543343,
		shortReport:  true
	});

	//'gps' event is triggered when the radio receives a GPS report
	radio.on('gps', function (message) {
	});

    //'received-message' event is triggered when the radio receives a message (normal or instant)
	radio.on('received-message', function (message) {
	});
		
## Class 'SDSMessage'
	//'sendPrepared' event is triggered when the message has been sent to the connected radio. 
	SDSMessage.on('sendPrepared', function (message) {
	});
	
	//'sent' event is triggered when the message has been sent over the network. 
	SDSMessage.on('sent', function (message) {
	});

	//'delivered' event is triggered when the message has been delivered to the target radio. 
	SDSMessage.on('delivered', function (message) {
	});
		
	//'consumed' event is triggered when the message has been read by the receiver. 
	SDSMessage.on('consumed', function (message) {
	});
	
	//'change' event is triggered when 'sendPrepared', 'sent', 'delivered' or 'consumed' is triggered
	SDSMessage.on('change', function (message) {
	});

## Class 'SDSPresenceDetection'
	//'sendPrepared' event is triggered when the message has been sent to the connected radio. 
	SDSPresenceDetection.on('sendPrepared', function (message) {
	});
	
	//'sent' event is triggered when the message has been sent over the network. 
	SDSPresenceDetection.on('sent', function (message) {
	});
	
	//'delivered' event is triggered when the message has been delivered to the target radio.
	SDSPresenceDetection.on('delivered', function (message) {
	});
	
	//'result' event is triggered when the message has been delivered or the timeout has been reached
	SDSPresenceDetection.on('result', function (result) {
	});
	
## Class 'LocationReportingEnableDisable'
	//'sendPrepared' event is triggered when the message has been sent to the connected radio. 
	LocationReportingEnableDisable.on('sendPrepared', function (message) {
	});
	
	//'sent' event is triggered when the message has been sent over the network. 
	LocationReportingEnableDisable.on('sent', function (message) {
	});
	
	//'delivered' event is triggered when the message has been delivered to the target radio.
	LocationReportingEnableDisable.on('delivered', function (message) {
	});

## Class 'ImmediateLocationReport'
	//'sendPrepared' event is triggered when the message has been sent to the connected radio. 
	ImmediateLocationReport.on('sendPrepared', function (message) {
	});
	
	//'sent' event is triggered when the message has been sent over the network. 
	ImmediateLocationReport.on('sent', function (message) {
	});
	
	//'delivered' event is triggered when the message has been delivered to the target radio.
	ImmediateLocationReport.on('delivered', function (message) {
	});