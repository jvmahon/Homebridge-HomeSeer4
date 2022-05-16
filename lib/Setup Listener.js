// These functions open a Telnet (ASCII) port to HomeSeer and listen for changes to HomeSeer Devices
// On a change, the Update function is then executed.
var fetch = require("node-fetch");
var net = require('net');
var globals = require("../index").globals;

var pollingCount = 0;
var HomeSeerData = require("../index.js").HomeSeer;

module.exports.setupHomeSeerTelnetPort = function ()
{
	var numAttempts     = 0;

	function HSData(array)  {
		this.command = array[0];
		this.ref = array[1];
		this.newValue = array[2];
		this.oldValue = array[3];
	}
	
	const myURL = new URL(HomeSeerData.network.host);
	
	globals.log("Host for ASCII Interface set to: " + myURL.hostname + " at port " + HomeSeerData.network.asciiPort);
	
	HomeSeerData.network.telnetClient = net.createConnection({port:HomeSeerData.network.asciiPort, host:myURL.hostname});
	
	HomeSeerData.network.telnetClient
		.on('connect', () => {
			globals.log("Successfully connected to ASCII Control Interface of HomeSeer.");
			HomeSeerData.network.telnetClient.setKeepAlive(true);
			numAttempts = 1

			let authorization = "au," + HomeSeerData.network.login + "," + HomeSeerData.network.password +"\r";
			
			HomeSeerData.network.telnetClient.write(authorization, ()=> { globals.log("Sent Authorization Data") } )
		});	

	// Next, set up an event listener to receive any change data from HomeSeer and then update HomeKit		
	
	HomeSeerData.network.telnetClient
		.on('data', (data) =>  {
			const allPendingUpdates = data.toString().split(/\r\n|\n|\r/)
			
			allPendingUpdates?.forEach((thisUpdate) => {
				var myData = [];
				if (thisUpdate == "") return;

				switch(true) {
					case (thisUpdate.startsWith("ok")): 
						// The following 'if' is only true the first time 'ok' was received!
						if (HomeSeerData.network.telnetAuthorized === false) globals.log("Successfully authorized Telnet port");
						HomeSeerData.network.telnetAuthorized = true;
						break;
					case(thisUpdate.startsWith("DC")): // Handle received data
						myData = new HSData( thisUpdate.split(","));
						//Only need to do an update if there is HomeKit data associated with it!, Which occurs if the notifyObjects array is not undefined.
						if( (HomeSeerData.HomeSeerDevices[myData.ref]?.notifyObjects !== undefined) )	 {
							globals.log(`HomeSeer device: ${myData.ref}: new value ${myData.newValue}, had old value ${myData.oldValue}` );
							
							HomeSeerData.processReceivedData(myData.ref, parseFloat(myData.newValue))
						} 
						break;
					case(thisUpdate.startsWith("error")):
						globals.log("Warning - Error Received on Telnet port. If this occurred during startup, this maybe due to bad password / login information in your config.json file. Received data: " + thisUpdate);
						break;
					default:
							globals.log("Warning - Unexpected Data Received on Telnet port. Data was: " + thisUpdate);
							break;
				}
			})
		});

		// If the status port closes, print a warning and then try to re-open it in 30 seconds.
		HomeSeerData.network.telnetClient.on('close', () =>  {
			globals.log("* Warning * - ASCII Port closed - Critical Failure!. Restart system if failure continues.");
			
			// Try to re-connect every 30 seconds If there is a failure, another error will be generated
			// which will cause this code to run again.
			setTimeout( ()=> {
					numAttempts = numAttempts +1;
					try {
						globals.log("Attempting to re-start ASCII Port Interface, Attempt: " + numAttempts);
						HomeSeerData.network.telnetClient.connect({port:HomeSeerData.network.asciiPort, host:myURL.hostname});
					} catch(err) {
						globals.log("Attempt not successful with error: " + err);
					}
				}, 30000); // Try to connect every 30 seconds
		});
	
		// If there is an error setting up the ASCII status port, print a message. Note that client.on('close', ...) is automatically called by the 'error' listener and will cause code to try and re-open the port after 30 seconds. A new error is raised and this cycle repeats if that fails.
		HomeSeerData.network.telnetClient
			.on('error', (data) =>  {
				globals.log(`* Warning * - Unable to connect to HomeSeer ASCII Port: ${HomeSeerData.network.asciiPort}. Fatal error.`);
				if (HomeSeerData.network.asciiPort != 11000) {
					globals.log(`ASCIIPort configuration value of: ${HomeSeerData.network.asciiPort} is unusual. Typical value is 11000. Check setting.`);
				}
				globals.log('To enable ASCII Port, see WIKI "Enable the HomeSeer ASCII Commands Interface Port" entry');
			});

			async function pollHomeSeer() {
				var result = await fetch(HomeSeerData.network.statusURL, HomeSeerData.network.requestBody).then( result => result.json());

				result.Devices?.forEach( (item) => {
					HomeSeerData.processReceivedData(item.ref, parseFloat(item.value))
				})
				pollingCount++; 
			}
		// Now set up the polling
		pollHomeSeer();
		setInterval( () => 	{ pollHomeSeer() }, 300000 );
} // End Function
