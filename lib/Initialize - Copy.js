'use strict';
var net = require('net');
var promiseHTTP = require("request-promise-native");
var globals = require("../index.js").globals
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

function HSData(array) 
{
	this.command = array[0];
	this.ref = array[1];
	this.newValue = array[2];
	this.oldValue = array[3];
}
	
module.exports.initialize = function(platformConfig)
{
	this.Devices = [];
	this.telnetClient = [];
	var self = this;
	this.platformConfig = platformConfig
	
	// Get the value of a device with a specific reference
	this.getValue = function(reference)
	{
		return this.Devices[reference].value
	}
	// set the value of all HomeKit devices having a particular reference;
	this.processReceivedData = function(reference, newValue)
	{
		this.Devices[reference].priorValue = this.Devices[reference].value
		this.Devices[reference].value = newValue
		var charObject;
		for (charObject of this.Devices[reference].HomeKitObjects)
		{
			if (this.Devices[reference].priorValue != newValue) charObject.emit('HSUpdate', newValue, charObject);
		}
		return this;
	}
	this.priorValue = function(reference)
	{
		return this.priorValue
	}
	this.RegisterHomeKitObject = function(reference, HomeKitObject)
	{	
		this.Devices[reference].HomeKitObjects.push(HomeKitObject);
		console.log(yellow("Registered an object at reference: " + reference +", with total number of items: " + this.Devices[reference].HomeKitObjects.length));
	}
	
	
		var getStatusInfo = promiseHTTP({ uri:platformConfig["host"] + "/JSON?request=getstatus", json:true})
		.then( (data) => { 
					// console.log(yellow("Initialized status: " + JSON.stringify(data)));
					return data
				});
		var getControlInfo = promiseHTTP({ uri:platformConfig["host"] + "/JSON?request=getcontrol", json:true})
		.then( (data) => { 					
					// console.log(cyan("Initialized status: " + JSON.stringify(data)));;
					return data	
				});
		
		Promise.all([getStatusInfo, getControlInfo]).then((data)=> 
		{
			
			var deviceStatus, deviceControl;
			for ( deviceStatus of data[0].Devices)
			{
				this.Devices[deviceStatus.ref] = Object.assign([], deviceStatus)
				this.Devices[deviceStatus.ref].priorValue = this.Devices[deviceStatus.ref].value;
				this.Devices[deviceStatus.ref].HomeKitObjects=[];
			}
			for ( deviceControl of data[1].Devices)
			{
				this.Devices[deviceControl.ref].ControlPairs = deviceControl.ControlPairs;
			}
		}
		)		
		.catch( (err) => 
			{
				if( err.message.includes("ECONNREFUSED") ) 
					{
						err = red( err + "\nError getting device control info. Check if HomeSeer is running, then start homebridge again.");
					}
				throw err;
			} )	
		.then(function(data) {
				// next promise resolves once connction is established.
				return new Promise( function(resolve, reject) {
					
						self.telnetClient = net.createConnection({port:"11000", host:"192.168.1.1"}, 
							(data) => {	
											console.log(green("Connection Established inside Initialize Promise with response: " + data)); 
											
			
			let authorization = "au," + self.platformConfig["login"] + "," + self.platformConfig["password"] +"\r";
			
			self.telnetClient.write(authorization, ()=>{console.log(green("Sent Authorization Data")) } )
			
											self.telnetAuthorized = true;
											
											resolve(data)
											});
				}
		)})
			
		.then( () =>
		{
			
			function HSData(array) 
					{
						this.command = array[0];
						this.ref = array[1];
						this.newValue = array[2];
						this.oldValue = array[3];
					}
			self.telnetClient.on('data', (data) => 
			{
				// Remove newline characters from received data and split at the commas.
				var myData = new HSData( data.toString().replace(/(\r\n|\n|\r)/gm,"").split(","));
				
				switch(myData.command)
				{
				case ("ok"):
					{
					if (self.telnetAuthorized == false) globals.log(yellow("Successfully authorized Telnet port"));
					self.telnetAuthorized = true;
					break;
					};
				case("DC"): // Handle received data
					{	
						console.log(chalk.cyan("Need to emit updates!: " + JSON.stringify(myData)));
						this.processReceivedData(myData.ref, myData.newValue);

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
		
		}).then( ()=> {return this});	

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




