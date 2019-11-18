
var net = require('net');
var globals = require("../index").globals;



module.exports.setupHomeSeerTelnetPort = function ()
{
	var client;
	var numAttempts     = 0;
	var uri;
	var ASCIIPort = "11000";
	
	function HSData(array) 
	{
		this.ref = array[1];
		this.newValue = array[2];
		this.oldValue = array[3];
	}
	
	if(globals.platformConfig["ASCIIPort"]) ASCIIPort = globals.platformConfig["ASCIIPort"];

	uri = parseUri(globals.platformConfig["host"]);
	
	globals.log("Host for ASCII Interface set to: " + uri.host + " at port " + ASCIIPort);
	
	client = net.createConnection({port:ASCIIPort, host:uri.host});
	
	client.on('connect', () =>
		{
			globals.log(green("Successfully connected to ASCII Control Interface of HomeSeer. Instant Status Enabled."));
			numAttempts = 1
			instantStatusEnabled = true;
			// resolve(true);
		});	

	// Next, set up an event listener to receive any change data from HomeSeer and then update HomeKit				
	client.on('data', (data) => 
		{
			// console.log(red("Received ASCII data, config host is :" + this.config.host));
			
			var myData = new HSData(data.toString().slice(0, -2).split(","));
			
			//Only need to do an update if there is HomeKit data associated with it!
			// Which occurs if the _statusObjects array has a non-zero length for the reference reported.
			if( _statusObjects[myData.ref])
			{
				this.log("Received HomeSeer status update data for HomeSeer device: " + cyan(myData.ref) +", new value: " + cyan(myData.newValue) + ", old value: " + cyan(myData.oldValue));
				_HSValues[myData.ref] = 	parseFloat(myData.newValue);	

				var statusObjectGroup = _statusObjects[myData.ref];
				for (var thisCharacteristic in statusObjectGroup)
				{
					updateCharacteristicFromHSData(statusObjectGroup[thisCharacteristic], myData.ref, this.config);
				}
			} 
		});

	// If the status port closes, print a warning and then try to re-open it in 30 seconds.
	client.on('close', () => 
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
					// client = net.createConnection({port:ASCIIPort, host:uri.host});
					client.connect({port:ASCIIPort, host:uri.host});
				} catch(err)
				{
					globals.log(red("Attempt not successful with error: "));
				}
			}, 30000); // Try to connect every 30 seconds
		
		});
	
		// If there is an error setting up the ASCII status port, print a message. Note that client.on('close', ...) is automatically called
		// by the 'error' listener and will cause code to try and re-open the port after 30 seconds. A new error is raised and this cycle repeats
		// if that fails.
		client.on('error', (data) => 
			{
				globals.log(red("* Warning * - Unable to connect to HomeSeer ASCII Port: " + ASCIIPort + ". Fatal error"));
				if (ASCIIPort != 11000) 
				{
				globals.log(red("ASCIIPort configuration value of: " + ASCIIPort + " is unusual. Typical value is 11000. Check setting."));
				}
				globals.log(yellow('To enable ASCII Port, see WIKI "Enable the HomeSeer ASCII Commands Interface Port" entry'));
				resolve(false)
			});

}



















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

