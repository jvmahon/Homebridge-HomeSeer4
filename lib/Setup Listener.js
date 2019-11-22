// These functions open a Telnet (ASCII) port to HomeSeer and listen for changes to HomeSeer Devices
// On a change, the Update function is then executed.
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

var promiseHTTP = require("request-promise-native");
var net = require('net');
var globals = require("../index").globals;

var pollingCount = 0;

module.exports.setupHomeSeerTelnetPort = function ()
{
	//	globals.log(yellow("Called setupHomeSeerTelnetPort "));
	
	

	var numAttempts     = 0;
	var uri;
	var ASCIIPort = "11000";
	
	function HSData(array) 
	{
		this.command = array[0];
		this.ref = array[1];
		this.newValue = array[2];
		this.oldValue = array[3];
	}
	
	if(globals.platformConfig["ASCIIPort"]) ASCIIPort = globals.platformConfig["ASCIIPort"];

	uri = parseUri(globals.platformConfig["host"]);
	
	globals.log(cyan("Host for ASCII Interface set to: " + uri.host + " at port " + ASCIIPort));
	
	globals.telnetClient = net.createConnection({port:ASCIIPort, host:uri.host});
	
	globals.telnetClient.on('connect', () =>
		{
			globals.log(cyan("Successfully connected to ASCII Control Interface of HomeSeer."));
			numAttempts = 1
			
			let authorization = "au," + globals.platformConfig["login"] + "," + globals.platformConfig["password"] +"\r";
			
			globals.telnetClient.write(authorization, ()=>{globals.log(green("Sent Authorization Data")) } )
		});	

	// Next, set up an event listener to receive any change data from HomeSeer and then update HomeKit		
	
	globals.telnetClient.on('data', (data) => 
		{
		
			//var myData = new HSData(data.toString().slice(0, -2).split(","));
			
			// Remove newline characters from received data.
			var myData = new HSData( data.toString().replace(/(\r\n|\n|\r)/gm,"").split(","));
			
			switch(myData.command)
			{
			case ("ok"):
				{
				if (globals.telnetAuthorized == false) globals.log(yellow("Successfully authorized Telnet port"));
				globals.telnetAuthorized = true;
				break;
				};
			case("DC"): // Handle received data
				{	
					//Only need to do an update if there is HomeKit data associated with it!, Which occurs if the globals.statusObjects array has a non-zero length for the reference reported.
					if( globals.statusObjects[myData.ref])	
					{
						globals.log("Received HomeSeer status update data for HomeSeer device: " + cyan(myData.ref) +", new value: " + cyan(myData.newValue) + ", old value: " + cyan(myData.oldValue));
						globals.HSValues[myData.ref] = 	parseFloat(myData.newValue);	

						var statusObjectGroup = globals.statusObjects[myData.ref];
						for (var thisCharacteristic in statusObjectGroup)
						{
							globals.updateCharacteristicFromHSData(statusObjectGroup[thisCharacteristic], myData.ref, this.config);
						}
					} 
					break;
				};
			case("error"):
			{
				globals.log(red("Warning - Error Received on Telnet port. This maybe due to bad password / login information in your config.json file: " + JSON.stringify(myData).ref ));
				break;
			};
			default:
				{
					globals.log(red("Warning - Unexpected Data Received on Telnet port: " + JSON.stringify(myData) ));
					break;
				}
			}	
		});

	// If the status port closes, print a warning and then try to re-open it in 30 seconds.
	globals.telnetClient.on('close', () => 
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
					// globals.telnetClient = net.createConnection({port:ASCIIPort, host:uri.host});
					globals.telnetClient.connect({port:ASCIIPort, host:uri.host});
				} catch(err)
				{
					globals.log(red("Attempt not successful with error: "));
				}
			}, 30000); // Try to connect every 30 seconds
		
		});
	
		// If there is an error setting up the ASCII status port, print a message. Note that client.on('close', ...) is automatically called
		// by the 'error' listener and will cause code to try and re-open the port after 30 seconds. A new error is raised and this cycle repeats
		// if that fails.
		globals.telnetClient.on('error', (data) => 
			{
				globals.log(red("* Warning * - Unable to connect to HomeSeer ASCII Port: " + ASCIIPort + ". Fatal error."));
				if (ASCIIPort != 11000) 
				{
				globals.log(red("ASCIIPort configuration value of: " + ASCIIPort + " is unusual. Typical value is 11000. Check setting."));
				}
				globals.log(yellow('To enable ASCII Port, see WIKI "Enable the HomeSeer ASCII Commands Interface Port" entry'));
			});
			//Now set up another function that does polling on the JSON interface.
			//In once you have completed the first JSON poll and initialized the devices, repeated polling shouldn't be needed
			// But it is only once every 5 minutes, so it isn't much overhead and its an extra check to make sure data remains consistent.

						var allStatusUrl = globals.platformConfig["host"] + "/JSON?request=getstatus&ref=" + globals.allHSRefs.concat()
						function pollHomeSeer()
						{
							promiseHTTP({ uri: allStatusUrl, json:true})
							.then( function(json) 
								{
									globals.currentHSDeviceStatus = json.Devices;
									globals.log(cyan("Poll # " + pollingCount) + ": Retrieved values for " + cyan(globals.currentHSDeviceStatus.length) + " HomeSeer devices.");
									// globals.log(cyan(JSON.stringify(globals.currentHSDeviceStatus) ));

									for (var index in globals.currentHSDeviceStatus)
									{
										globals.HSValues[globals.currentHSDeviceStatus[index].ref] = parseFloat(globals.currentHSDeviceStatus[index].value);
									} //endfor

										globals.updateAllFromHSData(pollingCount);
										pollingCount++; 
								} // end then's function
								) // end then
							.catch(function(err)
								{
									globals.log("HomeSeer poll attempt failed with error %s", err);
								} // end catch's function
								);//end catch
						}
						// Now set up the polling
					pollHomeSeer();
					setInterval( () => 	{ pollHomeSeer() }, 300000 );
} // End Function



















////////////////////////   Code to Parse a URI and separate out Host and Port /////////////
// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License

function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};

