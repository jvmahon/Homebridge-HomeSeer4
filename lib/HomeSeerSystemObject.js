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


/*
	this.HomeSeerDevices[XXX].status. . .
			{ 
			ref: 299,
			name: 'Floods',
			location: 'Guest Bedroom',
			location2: '1 - First Floor',
			value: 0,
			status: 'Off',
			device_type_string: 'Z-Wave Switch Multilevel',
			last_change: '/Date(1517009446329)/',
			relationship: 4,
			hide_from_view: false,
			associated_devices: [ 297 ],
			device_type:
				 { Device_API: 4,
				   Device_API_Description: 'Plug-In API',
				   Device_Type: 0,
				   Device_Type_Description: 'Plug-In Type 0',
				   Device_SubType: 38,
				   Device_SubType_Description: '' 
				   },
			device_image: '',
			UserNote: '',
			UserAccess: 'Any',
			status_image: '/images/HomeSeer/status/off.gif',
			voice_command: '',
			misc: 4864 },
									
	this.HomeSeerDevices[XXX].ControlPairs[0]. . .
		 {
			"Do_Update": true,
			"SingleRangeEntry": true,
			"ControlButtonType": 0,
			"ControlButtonCustom": "",
			"CCIndex": 1,
			"Range": {
					"RangeStart": 1,
					"RangeEnd": 98,
					"RangeStatusDecimals": 0,
					"RangeStatusValueOffset": 0,
					"RangeStatusDivisor": 0,
					"ScaleReplace": "",
					"HasScale": false,
					"RangeStatusPrefix": "Dim ",
					"RangeStatusSuffix": "%"
				  },
			"Ref": 213,
			"Label": "Dim (value)%",
			"ControlType": 7,
			"ControlLocation": {
					"Row": 1,
					"Column": 2,
					"ColumnSpan": 0
				  },
			"ControlLoc_Row": 1,
			"ControlLoc_Column": 2,
			"ControlLoc_ColumnSpan": 0,
			"ControlUse": 3,
			"ControlValue": 1,
			"ControlString": "",
			"ControlStringList": null,
			"ControlStringSelected": null,
			"ControlFlag": false
			},	
*/	


			
			

class HomeSeerSystem 
{

	constructor()
	{
		this.Initialized = false;
		this.HomeSeerDevices = [];
		this.name = "HomeSeer System";
		this.network = { host:"127.0.0.180", login:"default", password:"default", asciiPort: 11000, telnetClient: false, telnetAuthorized:false};
		this.controlUses = [ 
			{
				NotSpecified: 0,	On: 1,				Off: 2,					Dim: 3,				OnAlternate: 4,
				Play: 5,			Pause: 6,			Stop: 7,				Forward: 8,			Rewind: 9,
				Repeat: 10,			Shuffle: 11,		HeatSetPoint: 12,		CoolSetPoint: 13,	ThermModeOff: 14,
				ThermModeHeat: 15,	ThermModeCool: 16,	ThermModeAuto: 17,		DoorLock: 18,		DoorUnLock: 19,
				ThermFanAuto: 20,	ThermFanOn: 21,		ColorControl: 22,		DimFan: 23,			MotionActive: 24,
				MotionInActive: 25,	ContactActive: 26,	ContactInActive: 27,	Mute: 28,			UnMute: 29,
				MuteToggle: 30,		Next: 31,			Previous: 32,			Volume: 33
			}
		]
	}

	
	getValue(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		
		// console.log(yellow("*Debug* - getting value for reference %s, undefined: %s"), reference, (this.HomeSeerDevices[reference] === undefined) );
		if (this.HomeSeerDevices[reference] === undefined) return undefined;
		// console.log(yellow("*Debug* -  value for reference %s, is: %s"), reference, this.HomeSeerDevices[reference].status.value );

		return this.HomeSeerDevices[reference].status.value;
	}
	sendDataValue = function(ref, newValue, sendOnlyOnChange) 
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};

		if( ref == null || newValue === undefined ) throw new SyntaxError(red("Called updateValue with incorrect parameters. Need to specify both a reference and a Value. Reference was: " + ref + ", Value was: " + newValue));
		
		if (	((sendOnlyOnChange === undefined) || (sendOnlyOnChange === true) )
					&& (this.HomeSeerDevices[ref].status.value == newValue) )
			{
				console.log(yellow("*Debug Experimental * - Inhibiting send of value %s to reference %s because HomeSeer already has that value"), newValue, ref);
				return;
			}

			let commandstring = "cv," + ref + "," + newValue + "\r";
			
			console.log(yellow("Sending new value to HomeSeer on ASCII Port, HomeSeer device: '" + ref +"', sent value: '" + newValue + "'"));
			this.network.telnetClient.write(commandstring);
			
			this.HomeSeerDevices[ref].status.priorUpdateTime = this.HomeSeerDevices[ref].status.updateTime
			this.HomeSeerDevices[ref].status.priorValue = this.HomeSeerDevices[ref].status.value
			this.HomeSeerDevices[ref].status.updatTime = Date.now();
			
			this.HomeSeerDevices[ref].status.value = newValue;
	}
	processReceivedData(ref, newValue)
	{
		if (this.HomeSeerDevices[ref] === undefined) return undefined;
		
		this.HomeSeerDevices[ref].status.priorValueUpdateTime = this.HomeSeerDevices[ref].status.valueUpdateTime
		this.HomeSeerDevices[ref].status.priorValue = this.HomeSeerDevices[ref].status.value
		this.HomeSeerDevices[ref].status.valueUpdateTime = Date.now();
		this.HomeSeerDevices[ref].status.value = parseFloat(newValue);
	
		if( this.HomeSeerDevices[ref].notifyObjects === undefined) return;
		for(var thisObject of this.HomeSeerDevices[ref].notifyObjects)
		{
			thisObject.emit("HSvalueChanged", newValue, thisObject)
		}
	}
	registerObjectToReceiveUpdates(ref, object)
	{		
		if (this.HomeSeerDevices[ref] === undefined) return undefined;
		if (this.HomeSeerDevices[ref].notifyObjects === undefined) this.HomeSeerDevices[ref].notifyObjects = [];
		
				if (this.HomeSeerDevices[ref].notifyObjects.includes(object) === false)
				{
					this.HomeSeerDevices[ref].notifyObjects.push(object);
				}
				else
				{
					console.log(red("*Warning* - tried to add an item to HomeSeerDevices[ref].notifyObjects that already existed!"));
				}
		// console.log(yellow("*Debug* - Registered an object to receive change notifications for reference %s, total number registered %s"), ref, this.HomeSeerDevices[ref].notifyObjects.length);
	
	}
	
	getLocation(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (this.HomeSeerDevices[reference] === undefined) return undefined;
		return this.HomeSeerDevices[reference].status.location;
	}
	getLocation2(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (this.HomeSeerDevices[reference] === undefined) return undefined;
		return this.HomeSeerDevices[reference].status.location2;
	}
	getStatusField(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (this.HomeSeerDevices[reference] === undefined) return undefined;
		return this.HomeSeerDevices[reference].status.status;
	}
	getName(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (this.HomeSeerDevices[reference] === undefined) return undefined;
		return this.HomeSeerDevices[reference].status.name;
	}
	getStatusData(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (this.HomeSeerDevices[reference] === undefined) return undefined;
		
		return this.HomeSeerDevices[reference].status;

	}	
	isRootDevice(reference)
	{
		// if (this.HomeSeerDevices[reference].status.device_type_string.indexOf("Root Device") != (-1)) return true;
		
		// Plug-In Root Device
		if ( 		(this.HomeSeerDevices[reference].status.device_type.Device_API === 4)
					&& 	(this.HomeSeerDevices[reference].status.device_type.Device_Type === 999) )
					return true;		
		// Thermostat
		if ( 		(this.HomeSeerDevices[reference].status.device_type.Device_API === 16)
					&& 	(this.HomeSeerDevices[reference].status.device_type.Device_Type === 99)
					&&	(this.HomeSeerDevices[reference].status.device_type.Device_SubType === 0) )
					return true;
					
		// Music Root Device
		if ( 		(this.HomeSeerDevices[reference].status.device_type.Device_API === 32)
					&& 	(this.HomeSeerDevices[reference].status.device_type.Device_Type === 99)
					&&	(this.HomeSeerDevices[reference].status.device_type.Device_SubType === 0) )
					return true;			
					
		return false;
	}
	getRootDevice(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (this.HomeSeerDevices[reference] === undefined) return undefined;
		
		if (this.isRootDevice(reference)) return reference;
		
		if (this.HomeSeerDevices[reference].status.associated_devices === undefined) return undefined;
		
		for (var candidate of this.HomeSeerDevices[reference].status.associated_devices)
		{
			if (this.isRootDevice(candidate)) 	return candidate;
		}
		return undefined
	}
	
	isBatteryDevice(reference)
	{
		if (this.HomeSeerDevices[reference] === undefined) return undefined;

		// Plug-In Battery Device
		if ( 		(this.HomeSeerDevices[reference].status.device_type.Device_API === 4)
					&& 	(this.HomeSeerDevices[reference].status.device_type.Device_Type === 0)
					&&	(this.HomeSeerDevices[reference].status.device_type.Device_SubType === 128) )
					return true;
					
		// Or if it seems to be a battery
		if (this.HomeSeerDevices[reference].status.device_type_string.indexOf("Battery") != (-1)) return true;
				
		return false;
	}
	
	findBattery(findRef)
		{
			if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
			if (this.HomeSeerDevices[findRef] === undefined) return undefined;
			if (this.isBatteryDevice(findRef)) return findRef; // already at the battery device!
			
			var rootDeviceReference = this.getRootDevice(findRef);
			if (rootDeviceReference == undefined) return undefined;

			for (var candidateDevice of this.HomeSeerDevices[rootDeviceReference].status.associated_devices)
			{
				if (this.isBatteryDevice(candidateDevice)) return candidateDevice;
			}
			
			return undefined;
		}

	
	getInterfaceName(reference)
	{
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (this.HomeSeerDevices[reference] === undefined) return undefined;
		return this.HomeSeerDevices[reference].status.interface_name;
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
		if (this.HomeSeerDevices[reference] === undefined) return undefined;

		return this.HomeSeerDevices[reference].ControlPairs
	}
	
	getControlPairByUseType(reference, useValue)
	{
		if (this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (this.HomeSeerDevices[reference] === undefined) return undefined;
		if (this.HomeSeerDevices[reference].ControlPairs === undefined) return undefined;
		if (isNaN(useValue)) throw new SyntaxError(red("Function getControlPairByUseType was passed a non-numberic UseValue"))
			
		var theseControls = this.HomeSeerDevices[reference].ControlPairs.find( function (element) { return ((element.Ref === reference) && ( element.ControlUse == useValue ))})
		
		// console.log(chalk.blue( JSON.stringify(theseControls) ));

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
	
	async initialize( host, login, password, asciiPort  )
	{
		// console.log(red("*Debug* - Initializing the HomeSeer System " ));
		
		if 	(host !== undefined) this.network.host = host;
		if 	(login !== undefined) this.network.login = login;
		if 	(password !== undefined) this.network.password = password;
		if	(asciiPort !== undefined) this.network.asciiPort = asciiPort;


		const 	statusURL = new URL(this.network.host);
				statusURL.password = this.network.password;
				statusURL.username = this.network.login;
				statusURL.pathname = "JSON";
				statusURL.search = "request=getstatus";

		const 	controlURL = new URL(this.network.host);
				controlURL.password = this.network.password;
				controlURL.username = this.network.login;
				controlURL.pathname = "JSON";
				controlURL.search = "request=getcontrol";
				
		const 	categoriesURL = new URL(this.network.host);
				categoriesURL.password = this.network.password;
				categoriesURL.username = this.network.login;
				categoriesURL.pathname = "JSON";
				categoriesURL.search = "request=getcategories";				
				
		this.network.statusURL = statusURL;
		this.network.controlURL = controlURL;
		this.network.categoriesURL = categoriesURL;
				
		// console.log(yellow("*Debug* - status URL: " + this.network.statusURL.href ));
		// console.log(yellow("*Debug* - control URL: " + this.network.controlURL.href ));
		// console.log(yellow("*Debug* - categories URL: " + this.network.categoriesURL.href ));
		
		var that = this;
		var getStatusInfo 	= await promiseHTTP({ uri:statusURL.href, json:true, strictSSL:false})
		var getControlInfo 	= await promiseHTTP({ uri:controlURL.href, json:true, strictSSL:false})
		
		for(var currentDevice of getStatusInfo.Devices)
		{
			if (that.HomeSeerDevices[currentDevice.ref] === undefined) that.HomeSeerDevices[currentDevice.ref] =  {status: undefined};
			
			that.HomeSeerDevices[currentDevice.ref].status = currentDevice;
		}
	

		for(var currentDevice of getControlInfo.Devices)
		{
			if (that.HomeSeerDevices[currentDevice.ref] === undefined) that.HomeSeerDevices[currentDevice.ref] =  {ControlPairs: undefined};
			
			that.HomeSeerDevices[currentDevice.ref].ControlPairs = currentDevice.ControlPairs;
		}

		// console.log(red("*Debug* - Done Initializing the HomeSeer System. Item count is: " + that.HomeSeerDevices.length ));; 
		that.initialized = true;
		return Promise.resolve(true);;
	}	
}


module.exports = HomeSeerSystem;

