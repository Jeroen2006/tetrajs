
# TetraJS
A library that simplifies sending/receiving data over a TETRA network using a Motorola mobile/handheld radio. 
With this library you can send and receive various kinds of data from other radios. It also supports machine-to-machine communication (TMO Only). Currently the library supports the following types of data:

 - Normal Text Messages
 - Immidiate Text Messages
 - GPS LIP Location reports
 - Status Messages

 

# Tested Hardware
The library should work with every Motorola TETRA radio that has a PEI interface (and all features on the interface are enabled). But just to be sure, it has been tested on the following models (and they work ofcourse):

- MTM5400 (TMO & DMO)
- MTP6550 (TMO & DMO)
- MTP850s (TMO & DMO)
- MTP850 (TMO & DMO) 

# API (Incomplete)
    controller.dmo();
Will switch the radio to DMO operation.


    controller.tmo();
Will switch the radio to TMO operation.

    controller.setIssi(ISSI);
Change the ISSI of the radio (will cause the radio to reboot!).
