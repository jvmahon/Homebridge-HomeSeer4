'use strict'
var exports = module.exports;

var HSutilities = require("../lib/HomeSeerUtilities");
var globals = require("../index").globals;
var HomeSeerData = require("../index.js").HomeSeer;

exports.setupValves = function (newDevice, services) {
	if (newDevice.config.type != "Valve") return
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, newDevice.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + newDevice.config.type + " ref " + newDevice.ref);
		
	var thisService = new Service.Valve();

	newDevice.config.openValve 	??= HomeSeerData.findCommandValue(newDevice.config.ref, HomeSeerData.controlUses.On)
	newDevice.config.closeValve ??= HomeSeerData.findCommandValue(newDevice.config.ref, HomeSeerData.controlUses.Off)

	if (newDevice.config.openValve === null || newDevice.config.openValve === undefined || newDevice.config.closeValve === null || newDevice.config.closeValve === undefined) {
		throw new RangeError("Error - Missing Valve Open or Close values for Valve with HomeSeer Reference: " + newDevice.config.ref);
	}

	thisService
		.setConfigValues(newDevice.config)
		.updateUsingHSReference(newDevice.config.ref)
		.setAsPrimary()
		.on('HSvalueChanged', (newHSValue, HomeKitObject)=> {
				switch(parseFloat(newHSValue)) {
					case (HomeKitObject.config.closeValve):
						HomeKitObject.getCharacteristic(Characteristic.Active).updateValue(0);
						HomeKitObject.getCharacteristic(Characteristic.InUse).updateValue(0);
						break;
					case (HomeKitObject.config.openValve):
						HomeKitObject.getCharacteristic(Characteristic.Active).updateValue(1);
						HomeKitObject.getCharacteristic(Characteristic.InUse).updateValue(1);
						break
					default:
						throw new RangeError("Error in valve type. Received unexpected value from HomeSeer of: " + newHSValue + " for device with a HomeSeer reference of: " + HomeKitObject.HSRef);
				}
			})
	thisService.timer = null;
	
	thisService.getCharacteristic(Characteristic.Active)
		.setConfigValues(newDevice.config)
		.on('set', (value, callback) => {
				switch (value) {
					case 0: { HomeSeerData.sendDataValue( newDevice.config.ref, newDevice.config.closeValve ); break; }// 0 = HomeKit Valve Closed
					case 1: { HomeSeerData.sendDataValue( newDevice.config.ref, newDevice.config.openValve) ; break; } // 1 = HomeKit Valve Open
				}
				callback(null);
			} );

	thisService.getCharacteristic(Characteristic.InUse)
	.setConfigValues(newDevice.config)
		.on('set', (value, callback) => {
				switch (value) {
					case 0: { HomeSeerData.sendDataValue( newDevice.config.ref, newDevice.config.closeValve); break; }// 0 = HomeKit Valve Closed
					case 1: { HomeSeerData.sendDataValue( newDevice.config.ref, newDevice.config.openValve) ; break; } // 1 = HomeKit Valve Open
				}
				callback(null);
			} );
			
	thisService.getCharacteristic(Characteristic.ValveType).updateValue(newDevice.config.valveType)

	if (newDevice.config.useTimer) {
		thisService.addCharacteristic(Characteristic.SetDuration)
			.on('change', (data)=>  {
					globals.log("Valve Time Duration Set to: " + data.newValue + " seconds")
					if(thisService.getCharacteristic(Characteristic.InUse).value) {
						thisService.getCharacteristic(Characteristic.RemainingDuration)
							.updateValue(data.newValue);
							
						clearTimeout(thisService.timer); // clear any existing timer
						thisService.timer = setTimeout( ()=>  {
									globals.log("Valve Timer Expired. Shutting off Valve");
									// use 'setvalue' when the timer ends so it triggers the .on('set'...) event
									thisService.getCharacteristic(Characteristic.Active).setValue(0); 
								}, (data.newValue *1000));	
					}
				}); // end .on('change' ...

		thisService.addCharacteristic(Characteristic.RemainingDuration)
			.on('change', (data) => { globals.log("Valve Remaining Duration changed to: " + data.newValue) });

		thisService.getCharacteristic(Characteristic.InUse)
			.on('change', (data) => {
					switch(data.newValue) {
						case 0:
							thisService.getCharacteristic(Characteristic.RemainingDuration).updateValue(0);
							clearTimeout(thisService.timer); // clear the timer if it was used!
							break;
						case 1:
							var timer = thisService.getCharacteristic(Characteristic.SetDuration).value;
							
							if (timer < newDevice.config.minTime)  {
									globals.log(`Selected Valve On Duration of: ${timer} seconds is less than the minimum permitted time, setting On time to: ${newDevice.config.minTime} seconds`);
									timer = newDevice.config.minTime
								}
							thisService.getCharacteristic(Characteristic.RemainingDuration)
								.updateValue(timer);
							
							globals.log(`Turning Valve ${newDevice.config.name} on with Timer set to: ${timer} seconds`);									
							thisService.timer = setTimeout( ()=> {
												globals.log("Valve Timer Expired. Shutting off Valve");
												// use 'setvalue' when the timer ends so it triggers the .on('set'...) event
												thisService.getCharacteristic(Characteristic.Active).setValue(0); 
										}, (timer *1000));
							break;
					}
				}); // end .on('change' ...
	} // end if(newDevice.config.useTimer)
	
	services.push(informationService);
	services.push(thisService);
}
