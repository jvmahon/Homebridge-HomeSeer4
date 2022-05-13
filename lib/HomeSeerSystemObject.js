'use strict';
var net = require('net');
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var fetch = require("node-fetch");
var queue = require("queue");
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

//	Functions in class HomeSeerSystem
//		getValue(reference) // Returns the most recent value for the HomeSeer device identified by reference
//		sendDataValue = function(ref, newValue, sendOnlyOnChange) // Send the value newValue to homeseer to update the device identified as ref
//		processReceivedData(ref, newValue) // After data is received from HomeSeer, this function is used to emit the value to all of the HomeKit devices
//		registerObjectToReceiveUpdates(ref, object) // When creating a 'HomeKit" accessory, this function is used to define which HomeKit object is to receive an update for a particular reference. For example, if the HomeKit device had a 'on' characteristic that maps to the homeseer device 123, you would 'register' it to receive an update whenver 123 changed.
//		getLocation(reference) // Returns the HomeSeer 'Location1' string for a device. Location1 typically corresponds to the room name
//		getLocation2(reference) // Returns the HomeSeer 'Location2' string for a device. Location2 typically corresponds to the floor name
//		getStatusField(reference) // Returns the HomeSeer status string for a device. Mostly of interest for temperature sensors as I look at the status field for a "F" or a "C" to determine whether to use Celsius or Fahrenheit
//		getName(reference) // Returns the HomeSeer name string for a device.
//		getStatusData(reference) // Returns the full JSON status structure for a device.
//		isRootDevice(reference) // Returns 'true' if device indicated by reference is a root device.
//		getRootDevice(reference) // If passed a child device HomeSeer reference, returns the root device HomeSeer reference.
//		isBatteryDevice(reference) // Returns 'true' if device indicated by reference is a battery device.
//		findBattery(findRef) // If determine if device (e.g, a lock) indicated by the HomeSeer reference findRef has a corresponding battery.
//		getInterfaceName(reference) // Returns the interface name for a HomeSeer device. For example, "Z-Wave" for a Z-wave device.
//		isValidReference(reference) // Returns 'true' if the value of reference corresponds to a HomeSeer device.
//		getAllControlPairs(reference) // Return the HomeSeer "control pairs" for the device identified by reference.
//		getControlPairByUseType(reference, useValue) // Return the HomeSeer "control pairs" for the device identified by reference having the specified "use value".
//		displayData(reference) // Produces a data dump for debugging purposes showing the "status" and "ControlPairs" data retrieved from HomeSeer
//		async initialize( host, login, password, asciiPort  ) // Called once to set up the internal data structures that store information about HomeSeer Devices. The other functions don't work unless this has been called and the setup completed.

class HomeSeerSystem 
{
	constructor()
	{
		this.Initialized = false;
		this.HomeSeerDevices = [];
		this.name = "HomeSeer System";
		this.network = { host:"127.0.0.1:80", login:"default", password:"default", asciiPort: 11000, telnetClient: false, telnetAuthorized:false};
		this.controlUses =
			{
				NotSpecified: 0,	On: 1,				Off: 2,					Dim: 3,				OnAlternate: 4,
				Play: 5,			Pause: 6,			Stop: 7,				Forward: 8,			Rewind: 9,
				Repeat: 10,			Shuffle: 11,		HeatSetPoint: 12,		CoolSetPoint: 13,	ThermModeOff: 14,
				ThermModeHeat: 15,	ThermModeCool: 16,	ThermModeAuto: 17,		DoorLock: 18,		DoorUnLock: 19,
				ThermFanAuto: 20,	ThermFanOn: 21,		ColorControl: 22,		DimFan: 23,			MotionActive: 24,
				MotionInActive: 25,	ContactActive: 26,	ContactInActive: 27,	Mute: 28,			UnMute: 29,
				MuteToggle: 30,		Next: 31,			Previous: 32,			Volume: 33
			}
		
		this.network.sendQueue = queue({autostart:true, concurrency:1});
	}

	getControlPairs(reference, thisControlUse){ // untested!
		return this.HomeSeerDevices[reference]?.ControlPairs?.find( (it) => { 
												return (it.ControlUse == thisControlUse) 
												} );
	}
	findCommandValue(reference, thisControlUse) {
		var controlPairs = this.HomeSeerDevices[reference]?.ControlPairs?.find( (it) => { 
								return (it.ControlUse == thisControlUse) 
							});
		return controlPairs?.ControlValue
	}
	
	supportsDimming(reference) {
		if (this.HomeSeerDevices[reference] === undefined) return undefined;
		var dimmer = this.getControlPairs(reference, this.controlUses.Dim)
		var fanDimmer = this.getControlPairs(reference, this.controlUses.DimFan)
		return ((dimmer != undefined) || (fanDimmer != undefined));
	}
	
	getValue(reference) {
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		
		return this.HomeSeerDevices[reference]?.status.value;
	}
	
	sendDataValue(ref, newValue, sendOnlyOnChange = true)  {
		
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};

		if( ref == null || newValue === undefined ) throw new SyntaxError(red("Called updateValue with incorrect parameters. Need to specify both a reference and a Value. Reference was: " + ref + ", Value was: " + newValue));
		
		if ( sendOnlyOnChange && (this.HomeSeerDevices[ref].status.value == newValue) ) {
				return;
			}

			var commandstring = "cv," + ref.toString().trim() + "," + newValue.toString().trim() + "\r";

			var that = this;
			function sendData(cb) { // cb is a callback provided by the queueing library that is called when the function is done so the next queued item can be processed.
				var thisStatus = that.HomeSeerDevices[ref].status
				thisStatus.priorUpdateTime = thisStatus.updateTime
				thisStatus.priorValue = thisStatus.value
				thisStatus.updateTime = Date.now();
				thisStatus.value = newValue;
					
				that.network.telnetClient.write(commandstring, "utf8", function callback() { setTimeout(function(){cb()}, 50) });
			}
			// Queue for sending - Error occurs if you send too fast, so the sendData function includes a 50 mSec delay between sends.
			this.network.sendQueue.push(sendData);
	}

	processReceivedData(ref, newValue) {
		if (this.HomeSeerDevices[ref] === undefined) return undefined;
			var thisStatus = this.HomeSeerDevices[ref].status		
			thisStatus.priorValueUpdateTime = thisStatus.valueUpdateTime
			thisStatus.priorValue = thisStatus.value
			thisStatus.valueUpdateTime = Date.now();
			thisStatus.value = parseFloat(newValue);
			
		this.HomeSeerDevices[ref].notifyObjects?.forEach((thisObject) => 	{
			thisObject.emit("HSvalueChanged", newValue, thisObject)
		})
	}

	
	registerObjectToReceiveUpdates(ref, object) {		
		if (this.HomeSeerDevices[ref] === undefined) return undefined;
		this.HomeSeerDevices[ref].notifyObjects ??= [];
		
		if (this.HomeSeerDevices[ref].notifyObjects.includes(object) === false) {
			this.HomeSeerDevices[ref].notifyObjects.push(object);
		} else {
			console.log(red("*Warning* - tried to add an item to HomeSeerDevices[ref].notifyObjects that already existed!"));
		}
	}
	
	getLocation(reference) {
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		return this.HomeSeerDevices[reference]?.status.location;
	}
	getLocation2(reference) {
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		return this.HomeSeerDevices[reference]?.status.location2;
	}
	getStatusField(reference) {
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		return this.HomeSeerDevices[reference]?.status.status;
	}
	getName(reference) {
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		return this.HomeSeerDevices[reference]?.status.name;
	}
	getStatusData(reference) {
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		return this.HomeSeerDevices[reference]?.status;
	}	
	isRootDevice(reference) {
		// if (this.HomeSeerDevices[reference].status.device_type_string.indexOf("Root Device") != (-1)) return true;
		
		// Plug-In Root Device
		if ( 		(this.HomeSeerDevices[reference]?.status.device_type.Device_API === 4)
					&& 	(this.HomeSeerDevices[reference].status.device_type.Device_Type === 999) )
					return true;		
		// Thermostat
		if ( 		(this.HomeSeerDevices[reference]?.status.device_type.Device_API === 16)
					&& 	(this.HomeSeerDevices[reference].status.device_type.Device_Type === 99)
					&&	(this.HomeSeerDevices[reference].status.device_type.Device_SubType === 0) )
					return true;
					
		// Music Root Device
		if ( 		(this.HomeSeerDevices[reference]?.status.device_type.Device_API === 32)
					&& 	(this.HomeSeerDevices[reference].status.device_type.Device_Type === 99)
					&&	(this.HomeSeerDevices[reference].status.device_type.Device_SubType === 0) )
					return true;	
	
		return false;
	}
	
	getRootDevice(reference) {
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		
		if (this.isRootDevice(reference)) return reference;

		return this.HomeSeerDevices[reference]?.status?.associated_devices.find((it) => {
			this.isRootDevice(it)
		})
	}
	
	isBatteryDevice(reference) {
		if (this.HomeSeerDevices[reference] === undefined) return undefined;

		// Plug-In Battery Device
		if ( 		(this.HomeSeerDevices[reference].status.device_type.Device_API === 4)
					&& 	(this.HomeSeerDevices[reference].status.device_type.Device_Type === 0)
					&&	(this.HomeSeerDevices[reference].status.device_type.Device_SubType === 128) )
					{
						return true;
					}
					
		// Or if it seems to be a battery
		if (this.HomeSeerDevices[reference].status.device_type_string.indexOf("Battery") != (-1)) return true;
				
		return false;
	}
	
	findBattery(findRef) {
			if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
			if (this.isBatteryDevice(findRef)) return findRef; // already at the battery device!
			
			var rootDeviceReference = this.getRootDevice(findRef);
			if (rootDeviceReference == undefined) return undefined;
		
			return this.HomeSeerDevices[rootDeviceReference]?.status.associated_devices.find((it) => {this.isBatteryDevice(it)})
		}

	getInterfaceName(reference) {
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		return this.HomeSeerDevices[reference]?.status.interface_name;
	}
	isValidReference(reference) {
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if ((this.HomeSeerDevices[ref] !== undefined) && (this.HomeSeerDevices[ref] !== null)){ return true } else { return false};
	}
	
	totalItems() {
		return this.HomeSeerDevices.length
	}
	
	getAllControlPairs(reference) {
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		return this.HomeSeerDevices[reference]?.ControlPairs
	}
	
	getControlPairByUseType(reference, useValue) {
		if (this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (isNaN(useValue)) throw new SyntaxError(red("Function getControlPairByUseType was passed a non-numberic UseValue"))
			
		return this.HomeSeerDevices[reference]?.ControlPairs?.find( function (element) { return ((element.Ref === reference) && ( element.ControlUse == useValue ))})
	}
	
	displayData(reference) {
		if(this.initialized === false) { throw new SyntaxError(red("HomeSeer System Object Is Not Initialized"))};
		if (reference === undefined) {	
				console.log(yellow( JSON.stringify(this.HomeSeerDevices) ));
		} else {
			console.log(green( JSON.stringify(this.HomeSeerDevices[reference]?.status) ));
			console.log(yellow( JSON.stringify(this.HomeSeerDevices[reference]?.ControlPairs) ));
		}
	}
	
	async initialize( host, login, password, asciiPort  ) {
	
		if 	(host !== undefined) this.network.host = host;
		if 	(login !== undefined) this.network.login = login;
		if 	(password !== undefined) this.network.password = password;
		if	(asciiPort !== undefined) this.network.asciiPort = asciiPort;


		const 	statusURL = new URL(this.network.host);
				// statusURL.password = this.network.password;
				// statusURL.username = this.network.login;
				statusURL.pathname = "JSON";
				statusURL.search = "request=getstatus";

		const 	controlURL = new URL(this.network.host);
				// controlURL.password = this.network.password;
				// controlURL.username = this.network.login;
				controlURL.pathname = "JSON";
				controlURL.search = "request=getcontrol";
				
		const 	categoriesURL = new URL(this.network.host);
				// categoriesURL.password = this.network.password;
				// categoriesURL.username = this.network.login;
				categoriesURL.pathname = "JSON";
				categoriesURL.search = "request=getcategories";	
				
		var b = new Buffer(`${this.network.login}:${this.network.password}`)
		var s = b.toString("base64");
		 
		var requestBody = {
			method: 'GET',
			headers: {
				'Authorization': 'Basic ' +s,
			}
		}	
		this.network.statusURL = statusURL;
		this.network.controlURL = controlURL;
		this.network.categoriesURL = categoriesURL;
		this.network.requestBody = requestBody
		
		var that = this;
		
		var getStatusInfo;
		var getControlInfo;
		var flag = false;
		while (!flag) {
			try {
				getStatusInfo = await fetch(statusURL, requestBody).then(response => response.json());
				getControlInfo = await fetch(controlURL, requestBody).then(response => response.json());
  				flag = true;
  			} catch (err) {
				console.log("Failed to fetch HomeSeer device and control data, retrying in 15 seconds...");
				await new Promise(resolve => setTimeout(resolve, 15000));
			}
		}

		getStatusInfo.Devices?.forEach((currentDevice) => {
			that.HomeSeerDevices[currentDevice.ref] ??=  {status: currentDevice};
			
			that.HomeSeerDevices[currentDevice.ref].status = currentDevice;
		})
	
		getControlInfo.Devices?.forEach((currentDevice) => {
			that.HomeSeerDevices[currentDevice.ref] ??=  {ControlPairs: currentDevice.ControlPairs};
			
			that.HomeSeerDevices[currentDevice.ref].ControlPairs = currentDevice.ControlPairs;
		})

		that.initialized = true;
		return Promise.resolve(true);;
	}	
}

module.exports = HomeSeerSystem;
