'use strict'
var exports = module.exports;
var HSutilities = require("../lib/HomeSeerUtilities");
var globals = require("../index").globals;
var HomeSeerData = require("../index.js").HomeSeer;

exports.setupSecuritySystem = function (newDevice, services) {
	if (newDevice.config.type != "SecuritySystem") { return }
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, newDevice.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + newDevice.config.type + " ref " + newDevice.ref);
	
	var securitySystemService = new Service.SecuritySystem()
		.setAsPrimary()
		.setConfigValues(newDevice.config)
		.updateUsingHSReference(newDevice.config.ref);
		
	var currentState =securitySystemService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
	var targetState  =securitySystemService.getCharacteristic(Characteristic.SecuritySystemTargetState)

	securitySystemService
		.on('HSvalueChanged', newHSValue => {
			switch (true) {
				case ( securitySystemService.config.armedStayValues.includes(parseFloat(newHSValue)) ): 
						currentState.updateValue(0);
						targetState.updateValue(0);
						break; // 0 = HomeKit Stay Arm
				case ( securitySystemService.config.armedAwayValues.includes(parseFloat(newHSValue)) ):
						currentState.updateValue(1); 
						targetState.updateValue(1); 
						break; // 1 = HomeKit Away Arm
				case ( securitySystemService.config.armedNightValues.includes(parseFloat(newHSValue)) ):
						currentState.updateValue(2); 
						targetState.updateValue(2); 
						break; // 2 = HomeKit Night Arm
				case ( securitySystemService.config.disarmedValues.includes(parseFloat(newHSValue)) ):
						currentState.updateValue(3);
						targetState.updateValue(3);
						break; // 3 = HomeKit Disarmed
				case ( securitySystemService.config.alarmValues.includes(parseFloat(newHSValue)) ): 
						currentState.updateValue(4); // 4 = HomeKit Alarm Triggered
						break; 
				};
		})

	securitySystemService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
		.setConfigValues(newDevice.config)
		// .updateUsingHSReference(newDevice.config.ref);

	securitySystemService.getCharacteristic(Characteristic.SecuritySystemTargetState)
		.setConfigValues(newDevice.config)
		// .updateUsingHSReference(newDevice.config.ref)
		.on('set', (newHSValue, callback) => {
				switch (newHSValue) {
					case 0: { HomeSeerData.sendDataValue( newDevice.config.ref, newDevice.config.armStayValue); break; }// 0 = HomeKit Stay Arm
					case 1: { HomeSeerData.sendDataValue( newDevice.config.ref, newDevice.config.armAwayValue); break; } // 1 = HomeKit Away Arm
					case 2: { HomeSeerData.sendDataValue( newDevice.config.ref, newDevice.config.armNightValue); break; } // 2 = HomeKit Night Arm
					case 3: { HomeSeerData.sendDataValue( newDevice.config.ref, newDevice.config.disarmValue); break; } // 3 = HomeKit Disarmed
				};
			callback(null);
		} )
		
	services.push(informationService);
	services.push(securitySystemService);
}
