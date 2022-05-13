'use strict'
var exports = module.exports;
var HSutilities = require("../lib/HomeSeerUtilities");
var globals = require("../index").globals;
var HomeSeerData = require("../index.js").HomeSeer;

exports.setupSecuritySystem = function (that, services) {
	if (that.config.type != "SecuritySystem") { return }
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, that.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + that.config.type + " ref " + that.ref);
	
	var securitySystemService = new Service.SecuritySystem()
		.setAsPrimary()
		.setConfigValues(that.config)
		.updateUsingHSReference(that.config.ref);
		
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
		.setConfigValues(that.config)
		// .updateUsingHSReference(that.config.ref);

	securitySystemService.getCharacteristic(Characteristic.SecuritySystemTargetState)
		.setConfigValues(that.config)
		// .updateUsingHSReference(that.config.ref)
		.on('set', (newHSValue, callback) => {
				switch (newHSValue) {
					case 0: { HomeSeerData.sendDataValue( that.config.ref, that.config.armStayValue); break; }// 0 = HomeKit Stay Arm
					case 1: { HomeSeerData.sendDataValue( that.config.ref, that.config.armAwayValue); break; } // 1 = HomeKit Away Arm
					case 2: { HomeSeerData.sendDataValue( that.config.ref, that.config.armNightValue); break; } // 2 = HomeKit Night Arm
					case 3: { HomeSeerData.sendDataValue( that.config.ref, that.config.disarmValue); break; } // 3 = HomeKit Disarmed
				};
			callback(null);
		} )
		
	services.push(informationService);
	services.push(securitySystemService);
}
