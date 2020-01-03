'use strict';
var net = require('net');
var promiseHTTP = require("request-promise-native");
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var URL = require('url').URL;

var exports = module.exports;

class HomeSeerSystem 
{
	constructor()
	{
		this.Initialized = false;
		this.HSDevices = [];
		this.name = "HomeSeer System";
	}
	updateValue(reference, value)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
	}
	getValue(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		return this.HSDevices[reference].value;
	}
	isValidReference(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
	}
	totalItems()
	{
		return this.HSDevices.length
	}
	async initialize()
	{
		console.log(red("*Debug* - Initializing the HomeSeer System " ));

		var host = "http://127.0.0.1:80"
		var password
		var username
		var login;

		const 	statusURL = new URL(host);
				// statusURL.password = password || "default";
				// statusURL.username = login || "default";
				statusURL.pathname = "JSON";
				statusURL.search = "request=getstatus";

		const 	controlURL = new URL(host);
				// controlURL.password = password || "default";
				// controlURL.username = login || "default";
				controlURL.pathname = "JSON";
				controlURL.search = "request=getcontrol";
						
		var that = this;
		var getStatusInfo = promiseHTTP({ uri:statusURL.href, json:true, strictSSL:false})
		.then( function(HSDevices)
			{
				console.log(red("*Debug* - Got Status Info " + Object.getOwnPropertyNames(HSDevices) ));

				for(var currentDevice of HSDevices.Devices)
				{
					console.log(green("*Debug* - Got Status Info " + Object.getOwnPropertyNames(currentDevice) )  );
					console.log(yellow(Object.getOwnPropertyNames(that.HSDevices)) +",  " + cyan(that.HSDevices.length)   );
					
					if (that.HSDevices[currentDevice.ref] === undefined) that.HSDevices[currentDevice.ref] =  [];
					
					that.HSDevices[currentDevice.ref].status = currentDevice;
				}


				return (1);
			}) // end then's function
			.catch( (err) => 
			{
					switch(err.statusCode)
					{
						case 401:
						{
							console.log(red("Line 192 - Error is: " + err));
							console.log(red("*HTTP Error 401 - line 84 * - May be due to Improper login and password specified in your config.json setup file. Correct and try again."));
							console.log(red("URL Is: " + statusURL.href));
							break;
						}
						default:
						{
							console.log(red( err + " : Error line 90 - error getting device status info. Check if HomeSeer is running and that JSON interface is enabled, then start homebridge again. Status code: " + err.statusCode));
						}
					}

				throw err;
			} )
			
		var getControlInfo = promiseHTTP({ uri:controlURL.href, json:true, strictSSL:false})
					.then( function(HSControls)
					{
						console.log(red("*Debug* - Got Control Info " ));
						
						for(var currentDevice of HSControls.Devices)
						{
							that.HSDevices[currentDevice.ref] = Object.assign(that.HSDevices[currentDevice.ref], currentDevice);
						}

						return(true);
				
					})
				.catch( (err) => 
					{
							switch(err.statusCode)
							{
								case 401:
								{
									console.log(red("Line 191 - Error is: " + err));
									console.log(red("*HTTP Error 401 - line 117 * - Improper login and password specified in your config.json setup file. Correct and try again."));
									break;
								}
								default:
								{
									console.log(red( err + " : Error line 122 - error getting device Control info. Check if HomeSeer is running and that JSON interface is enabled, then start homebridge again. Status code: " + err.statusCode));
								}
							}
						throw err;
					} )
			
		const result = await Promise.all([getStatusInfo, getControlInfo]).then( function(response) 
						{		console.log(red("*Debug* - Done Initializing the HomeSeer System. Item count is: " + that.HSDevices.length ));; 
								that.initialized = true;
								return true;
						});	
		return true;
			
	}
}
module.exports = HomeSeerSystem;


