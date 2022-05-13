'use strict'
var exports = module.exports;

var HSutilities = require("../lib/HomeSeerUtilities");
var globals = require("../index").globals;
var HomeSeerData = require("../index.js").HomeSeer;

exports.setupValves = function (that, services) {
	if (that.config.type != "Valve") return
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, that.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + that.config.type + " ref " + that.ref);
		
	var valveService = new Service.Valve();

	that.config.openValve 	??= HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.On)
	that.config.closeValve 	??= HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.Off)

	if (that.config.openValve === null || that.config.openValve === undefined || that.config.closeValve === null || that.config.closeValve === undefined) {
		throw new RangeError(red("Error - Missing Valve Open or Close values for Valve with HomeSeer Reference: " + that.config.ref));
	}

	thisService
		.setConfigValues(that.config).updateUsingHSReference(that.config.ref)
		.setAsPrimary()
		.on('HSvalueChanged', function(newHSValue, HomeKitObject) {
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
		.setConfigValues(that.config)
		.on('set', function(value, callback) {
				switch (value) {
					case 0: { HomeSeerData.sendDataValue( that.config.ref, that.config.closeValve ); break; }// 0 = HomeKit Valve Closed
					case 1: { HomeSeerData.sendDataValue( that.config.ref, that.config.openValve) ; break; } // 1 = HomeKit Valve Open
				}
				callback(null);
			} );

	thisService.getCharacteristic(Characteristic.InUse)
	.setConfigValues(that.config)
		.on('set', function(value, callback) {
				switch (value) {
					case 0: { HomeSeerData.sendDataValue( that.config.ref, that.config.closeValve); break; }// 0 = HomeKit Valve Closed
					case 1: { HomeSeerData.sendDataValue( that.config.ref, that.config.openValve) ; break; } // 1 = HomeKit Valve Open
				}
				callback(null);
			} );
			
	thisService.getCharacteristic(Characteristic.ValveType).updateValue(that.config.valveType)

	if (that.config.useTimer) {
		thisService.addCharacteristic(Characteristic.SetDuration)
			.on('change', (data)=>  {
					globals.log(yellow("Valve Time Duration Set to: " + data.newValue + " seconds"))
					if(thisService.getCharacteristic(Characteristic.InUse).value) {
						thisService.getCharacteristic(Characteristic.RemainingDuration)
							.updateValue(data.newValue);
							
						clearTimeout(thisService.timer); // clear any existing timer
						thisService.timer = setTimeout( ()=> 
								{
									globals.log(yellow("Valve Timer Expired. Shutting off Valve"));
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
							
							if (timer < that.config.minTime)  {
									globals.log(magenta("Selected Valve On Duration of: ") + cyan(timer) 
											+ 	magenta(" seconds is less than the minimum permitted time, setting On time to: ") 
											+ 	cyan(that.config.minTime) + " seconds");
											timer = that.config.minTime
								}
							thisService.getCharacteristic(Characteristic.RemainingDuration)
								.updateValue(timer);
							
							globals.log(yellow("Turning Valve ") + cyan(that.config.name) + yellow(" on with Timer set to: ")+ cyan(timer) + yellow(" seconds"));									
							thisService.timer = setTimeout( ()=> {
												globals.log(yellow("Valve Timer Expired. Shutting off Valve"));
												// use 'setvalue' when the timer ends so it triggers the .on('set'...) event
												thisService.getCharacteristic(Characteristic.Active).setValue(0); 
										}, (timer *1000));
							break;
					}
				}); // end .on('change' ...
	} // end if(that.config.useTimer)
	
	services.push(informationService);
	services.push(thisService);
}
