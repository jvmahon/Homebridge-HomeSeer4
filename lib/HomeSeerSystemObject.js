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
var globals = require("../index").globals;

var exports = module.exports;

class HomeSeerSystem 
{
	constructor()
	{
		this.Initialized = false;
		this.HomeSeerDevices= [];
		this.name = "HomeSeer System";
	}
	
	updateValue(reference, value)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		this.HomeSeerDevices[reference].status.value = value;
		globals.log(red("** Error * - Send function not yet implemented!"));
	}
	
	getValue(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		return this.HomeSeerDevices[reference].status.value;
	}
	
	isValidReference(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if ((this.HomeSeerDevices[ref] !== undefined) && (this.HomeSeerDevices[ref] !== null)){ return true } else { return false};
	}
	
	totalItems()
	{
		return this.HomeSeerDevices.length
	}
	
	getAllControlPairs(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};

		return this.HomeSeerDevices[reference].ControlPairs
	}
	
	getControlPairByUseType(reference, useValue)
	{
		if (this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (isNaN(useValue)) throw new SyntaxError(red("Function getControlPairByUseType was passed a non-numberic UseValue"))
		var theseControls = this.HomeSeerDevices[reference].ControlPairs.find( function (element) { return ((element.Ref === reference) && ( element.ControlUse == useValue ))})
		
		console.log(chalk.blue( JSON.stringify(theseControls) ));

		return theseControls;
	}
	
	displayData(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (reference === undefined)
		{	
				console.log(yellow( JSON.stringify(this.HomeSeerDevices) ));
		}
		else
		{
			console.log(green( JSON.stringify(this.HomeSeerDevices[reference].status) ));
			console.log(yellow( JSON.stringify(this.HomeSeerDevices[reference].ControlPairs) ));
		}
	}
	
	
	async initialize( host = "http://127.0.0.1:80", login = "default", password = "default",  )
	{
		console.log(red("*Debug* - Initializing the HomeSeer System " ));


		const 	statusURL = new URL(host);
				statusURL.password = password;
				statusURL.username = login;
				statusURL.pathname = "JSON";
				statusURL.search = "request=getstatus";

		const 	controlURL = new URL(host);
				controlURL.password = password;
				controlURL.username = login;
				controlURL.pathname = "JSON";
				controlURL.search = "request=getcontrol";
				
		console.log(yellow("*Debug* - status URL: " + statusURL.href ));
		console.log(yellow("*Debug* - control URL: " + controlURL.href ));
						
		var that = this;
		var getStatusInfo = promiseHTTP({ uri:statusURL.href, json:true, strictSSL:false})
		.then( function(HSDevices)
			{
				for(var currentDevice of HSDevices.Devices)
				{
					
					if (that.HomeSeerDevices[currentDevice.ref] === undefined) that.HomeSeerDevices[currentDevice.ref] =  {status: undefined};
					
					that.HomeSeerDevices[currentDevice.ref].status = currentDevice;

				}

				return (1);
			}) // end then's function
			.catch( (err) => 
			{
					switch(err.statusCode)
					{
						case 401:
						{
							console.log(red("*HTTP Error 401 Trying to Make Initial Connection to HomeSeer * - May be due to Improper login and password specified in your config.json setup file. Correct and try again."));
							console.log(red("URL Is: " + statusURL.href));
							break;
						}
						default:
						{
							console.log(red( err));
						}
					}

				throw err;
			} )
			
		var getControlInfo = promiseHTTP({ uri:controlURL.href, json:true, strictSSL:false})
			.then( function(HSControls)
					{
				for(var currentDevice of HSControls.Devices)
				{
					if (that.HomeSeerDevices[currentDevice.ref] === undefined) that.HomeSeerDevices[currentDevice.ref] =  {ControlPairs: undefined};
					
					that.HomeSeerDevices[currentDevice.ref].ControlPairs = currentDevice.ControlPairs;
				}

				return (1);
				
					})
				.catch( (err) => 
					{
							switch(err.statusCode)
							{
								case 401:
								{
									console.log(red("*HTTP Error 401 Trying to Make Initial Connection to HomeSeer * - May be due to Improper login and password specified in your config.json setup file. Correct and try again."));
									break;
								}
								default:
								{
									console.log(red( err ));
								}
							}
						throw err;
					} )

		
		return  Promise.all([getStatusInfo, getControlInfo]).then( function(response) 
		// return  Promise.all([getStatusInfo]).then( function(response) 
						{		console.log(red("*Debug* - Done Initializing the HomeSeer System. Item count is: " + that.HomeSeerDevices.length ));; 
								that.initialized = true;
								return Promise.resolve(true);;
						})
						.catch( function(error) { return Promise.reject(false) })	

			
	}
}


module.exports = HomeSeerSystem;

