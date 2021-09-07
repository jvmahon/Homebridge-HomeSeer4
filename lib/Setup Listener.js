// These functions open a Telnet (ASCII) port to HomeSeer and listen for changes to HomeSeer Devices
// On a change, the Update function is then executed.
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var URL = require('url').URL;
// var promiseHTTP = require("request-promise-native");
import fetch  from "node-fetch";
var net = require('net');
var globals = require("../index").globals;
// var url = require('url');

var pollingCount = 0;
var HomeSeerData = require("../index.js").HomeSeer;


module.exports.setupHomeSeerTelnetPort = function ()
{
	var numAttempts     = 0;
	
	function HSData(array) 
	{
		this.command = array[0];
		this.ref = array[1];
		this.newValue = array[2];
		this.oldValue = array[3];
	}
	
	const myURL = new URL(HomeSeerData.network.host);
	
	globals.log(cyan("Host for ASCII Interface set to: " + myURL.hostname + " at port " + HomeSeerData.network.asciiPort));
	
	HomeSeerData.network.telnetClient = net.createConnection({port:HomeSeerData.network.asciiPort, host:myURL.hostname});
	
	HomeSeerData.network.telnetClient.on('connect', () =>
		{
			globals.log(cyan("Successfully connected to ASCII Control Interface of HomeSeer."));
			HomeSeerData.network.telnetClient.setKeepAlive(true);
			numAttempts = 1

			let authorization = "au," + HomeSeerData.network.login + "," + HomeSeerData.network.password +"\r";
			
			HomeSeerData.network.telnetClient.write(authorization, ()=>{globals.log(green("Sent Authorization Data")) } )
		});	

	// Next, set up an event listener to receive any change data from HomeSeer and then update HomeKit		
	
	HomeSeerData.network.telnetClient.on('data', (data) => 
		{
		
		const allPendingUpdates = data.toString().split(/\r\n|\n|\r/)
		
		for (const thisUpdate of allPendingUpdates)
		{
			var myData = [];
			if (thisUpdate == "") continue;

			switch(true)
			{
			case (thisUpdate.startsWith("ok")):
				{
				// The following 'if' is only true the first time 'ok' was received!
				if (HomeSeerData.network.telnetAuthorized === false) globals.log(yellow("Successfully authorized Telnet port"));
				HomeSeerData.network.telnetAuthorized = true;
				// globals.log(yellow("*Debug* - Received ok on Telnet port"))
				break;
				};

			case(thisUpdate.startsWith("DC")): // Handle received data
				{	
				myData = new HSData( thisUpdate.split(","));
					//Only need to do an update if there is HomeKit data associated with it!, Which occurs if the notifyObjects array is not undefined.
					if( (HomeSeerData.HomeSeerDevices[myData.ref]) && (HomeSeerData.HomeSeerDevices[myData.ref].notifyObjects !== undefined) )	
					{
						globals.log(`HomeSeer device: ${cyan(myData.ref)}: new value ${cyan(myData.newValue)}, had old value ${cyan(myData.oldValue)}` );
						
						HomeSeerData.processReceivedData(myData.ref, parseFloat(myData.newValue))
					} 
					break;
				};
				
			case(thisUpdate.startsWith("error")):
			{
				globals.log(red("Warning - Error Received on Telnet port. If this occurred during startup, this maybe due to bad password / login information in your config.json file. Received data: " + thisUpdate));

				break;
			};
			default:
				{
					globals.log(red("Warning - Unexpected Data Received on Telnet port. Data was: " + thisUpdate));
					break;
				}
			}
		}
		});

	// If the status port closes, print a warning and then try to re-open it in 30 seconds.
	HomeSeerData.network.telnetClient.on('close', () => 
		{
			globals.log(red("* Warning * - ASCII Port closed - Critical Failure!. Restart system if failure continues."));
			
			// Try to re-connect every 30 seconds If there is a failure, another error will be generated
			// which will cause this code to run again.
			setTimeout( ()=>
			{
				numAttempts = numAttempts +1;
				try
				{
					globals.log(red("Attempting to re-start ASCII Port Interface, Attempt: " + numAttempts));
					// globals.telnetClient = net.createConnection({port:ASCIIPort, host:myURL.host});
					HomeSeerData.network.telnetClient.connect({port:HomeSeerData.network.asciiPort, host:myURL.hostname});
				} catch(err)
				{
					globals.log(red("Attempt not successful with error: " + err));
				}
			}, 30000); // Try to connect every 30 seconds
		
		});
	
		// If there is an error setting up the ASCII status port, print a message. Note that client.on('close', ...) is automatically called
		// by the 'error' listener and will cause code to try and re-open the port after 30 seconds. A new error is raised and this cycle repeats
		// if that fails.
		HomeSeerData.network.telnetClient.on('error', (data) => 
			{
				globals.log(red("* Warning * - Unable to connect to HomeSeer ASCII Port: " + HomeSeerData.network.asciiPort + ". Fatal error."));
				if (HomeSeerData.network.asciiPort != 11000) 
				{
				globals.log(red("ASCIIPort configuration value of: " + HomeSeerData.network.asciiPort + " is unusual. Typical value is 11000. Check setting."));
				}
				globals.log(yellow('To enable ASCII Port, see WIKI "Enable the HomeSeer ASCII Commands Interface Port" entry'));
			});
		
		

			async function pollHomeSeer()
			{
			//	var result = await promiseHTTP({ uri: HomeSeerData.network.statusURL.href, json:true, strictSSL:false})
				var result = await fetch(HomeSeerData.network.statusURL).then( result => result.json());

				for(var item of result.Devices)
				{
					HomeSeerData.processReceivedData(item.ref, parseFloat(item.value))
				}

				pollingCount++; 
			}
		// Now set up the polling
		pollHomeSeer();
		setInterval( () => 	{ pollHomeSeer() }, 300000 );
		
} // End Function
