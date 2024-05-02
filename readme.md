# Motorola Tetra Network Controller

This project aims to solve a very specific problem; being able to control & monitor your radios on a TETRA network. 


# Goals

 1. Webinterface/Dashboard
 2. ~~Send & Receive SDS messages~~
 3. ~~Receive GPS Locations~~
 4. ~~Presence check~~
 5. SDS Remote Control
 6. ~~Status Support~~
 7. ~~DMO Support~~ (Tested)
 8. Talkgroup monitoring?

# Running yourself
I cannot guarantee this will work on all Motorola radios... I'm using mtm5400, mtp850(s) and mtp6550 radios so I suggest you use one of those too (mtm5400 is preferred). 
1. Make sure the PEI interface on the device is enabled and set to the correct baudrate (either change this on the device or in the code).
2. Enable all features on the interface
3. If you want to use GPS you need to set the target ISSI to the ISSI of the radio connected to the software.
4. Set the correct device in the code.


If everything is configured properly you can run `node test.js` and it should start working. I'm developing while being registered on a TMO network, but it should also work in DMO. 