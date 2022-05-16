'use strict'
var exports = module.exports;

var HSutilities = require("../lib/HomeSeerUtilities");
var globals = require("../index").globals;
var HomeSeerData = require("../index.js").HomeSeer;

exports.setupSensor = function (newDevice, services) {
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, newDevice.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + newDevice.config.type + " ref " + newDevice.ref);
		
	switch (newDevice.config.type)  {
		case "CarbonDioxideSensor":
			var thisSensorService = new Service.CarbonDioxideSensor();
			
			thisSensorService.getCharacteristic(Characteristic.CarbonDioxideDetected)
				.updateUsingHSReference(newDevice.config.ref)
				.setConfigValues(newDevice.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
						if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254)) {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
							return
						} else {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
						}

						if (homekitObject.config.offValues.includes(newHSValue)) { 
							homekitObject.updateValue(false); 
						} else { 	
							homekitObject.updateValue(true); 
						}
					})
			break;
		case "CarbonMonoxideSensor":
			var thisSensorService = new Service.CarbonMonoxideSensor();
			
			thisSensorService.getCharacteristic(Characteristic.CarbonMonoxideDetected)
				.updateUsingHSReference(newDevice.config.ref)
				.setConfigValues(newDevice.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
						if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254)) {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
							return
						} else {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
						}

						if (homekitObject.config.offValues.includes(newHSValue)) { 
							homekitObject.updateValue(false); 
						} else { 	
							homekitObject.updateValue(true); 
						}
					})
			break;
		case "ContactSensor": 
			var thisSensorService = new Service.ContactSensor();
			
			thisSensorService.getCharacteristic(Characteristic.ContactSensorState)
				.updateUsingHSReference(newDevice.config.ref)
				.setConfigValues(newDevice.config)	
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
						if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254)) {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
							return
						} else {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
						}
 
						if (homekitObject.config.offValues.includes(newHSValue)) { 
							homekitObject.updateValue(false); 
						} else { 	
							homekitObject.updateValue(true); 
						}
					})
			break;
		case "HumiditySensor": 
			var thisSensorService = new Service.HumiditySensor();
			
			thisSensorService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.updateUsingHSReference(newDevice.config.ref)
				.setConfigValues(newDevice.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
						if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254)) {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
							return
						} else {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
						}

						homekitObject.updateValue(newHSValue)
					})					
			break;
		
		case "LeakSensor": 
			var thisSensorService = new Service.LeakSensor();
			
			thisSensorService.getCharacteristic(Characteristic.LeakDetected)
				.updateUsingHSReference(newDevice.config.ref)
				.setConfigValues(newDevice.config)	
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
						if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254)) {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
							return
						} else {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
						}

						if (homekitObject.config.offValues.includes(newHSValue)) { 
							homekitObject.updateValue(false); 
						} else { 	
							homekitObject.updateValue(true); 
						}
					})				
			break;
		case "LightSensor": 
			var thisSensorService = new Service.LightSensor();
			
			var ambientLight = thisSensorService.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			
			ambientLight
				.updateUsingHSReference(newDevice.config.ref)
				.setConfigValues(newDevice.config)	
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						var newLightLevel =  Math.min(Math.max(newHSValue, ambientLight.props.minValue), ambientLight.props.maxValue )		
						newLightLevel = Math.round(newLightLevel * 100) / 100
						homekitObject.updateValue(newLightLevel)
					})				
			break;
				
		case "MotionSensor": 
			var thisSensorService = new Service.MotionSensor();
			
			thisSensorService.getCharacteristic(Characteristic.MotionDetected)
				.updateUsingHSReference(newDevice.config.ref)
				.setConfigValues(newDevice.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						// A Z-Wave value of 254 is usually an undefined fault! If you get newDevice, set Fault and return.
						if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254)) {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
							return
						} else {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
						}
 
						if (homekitObject.config.offValues.includes(newHSValue)) { 
							homekitObject.updateValue(false); 
						} else { 	
							homekitObject.updateValue(true); 
						}
					})
			break;
	
		case "OccupancySensor": 
            //globals.log("DEBUG - Case OccupancySensor");
			var thisSensorService = new Service.OccupancySensor();
			
			thisSensorService.getCharacteristic(Characteristic.OccupancyDetected)
				.updateUsingHSReference(newDevice.config.ref)
				.setConfigValues(newDevice.config)	
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
						if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254)) {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
							return
						} else {
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
						}
 
						if (homekitObject.config.offValues.includes(newHSValue)) { 
							homekitObject.updateValue(false); 
						} else { 	
							homekitObject.updateValue(true); 
						}
					})
			break;			
		case "SmokeSensor": 
			var thisSensorService = new Service.SmokeSensor();
			
			thisSensorService.getCharacteristic(Characteristic.SmokeDetected)
				.updateUsingHSReference(newDevice.config.ref)
				.setConfigValues(newDevice.config)	
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
							if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254)) {
								thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
								return
							} else {
								thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
							}	
	 
							if (homekitObject.config.offValues.includes(newHSValue)) { 
								homekitObject.updateValue(false); 
							} else { 	
								homekitObject.updateValue(true); 
							}
						})
			break;
		case "TemperatureSensor": 
			var thisSensorService = new Service.TemperatureSensor();
			
			// Check if the "status" field includes a "C" or a "F" as the last character indicting the temperature scale!
			let statusField = HomeSeerData.getStatusField(newDevice.config.ref);
			switch(true) {
				case 	statusField.endsWith("F"): 
				case 	statusField.endsWith(String.fromCharCode(8457)): 
					thisSensorService.temperatureUnit = "F"; 	
					break; 
				case  	statusField.endsWith("C"): 
				case 	statusField.endsWith(String.fromCharCode(8451)): 
					thisSensorService.temperatureUnit = "C"; 
					break;	 
				case  newDevice.config.temperatureUnit == "F":
				case  newDevice.config.temperatureUnit == "C": 
					thisSensorService.temperatureUnit = newDevice.config.temperatureUnit;
					break; 
				default:
					throw new RangeError("Error setting up Temperature Sensor. Scale is not Celsius or Fahrenheit", "Sensor Setup.js");
			}
			
			var temperatureSetting = thisSensorService.getCharacteristic(Characteristic.CurrentTemperature)
			
			temperatureSetting
				.setProps({ minValue: newDevice.config.minCelsius, maxValue: newDevice.config.maxCelsius })
				.updateUsingHSReference(newDevice.config.ref)
				.setConfigValues(newDevice.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						var newTemperature = parseFloat(newHSValue);
						if (thisSensorService.temperatureUnit == "F")  { 
							newTemperature = ((newHSValue - 32 )* (5/9));
						}
							
						newTemperature =  Math.min(Math.max(newTemperature, temperatureSetting.props.minValue), temperatureSetting.props.maxValue )		
						
						homekitObject.updateValue(newTemperature);
					})
			break;
	}
	
	thisSensorService.isPrimaryService = true;

	// if a tamper reference has been defined, add that characteristic
	if (newDevice.config.tamperRef) {
		thisSensorService.getCharacteristic(Characteristic.StatusTampered)
			.updateUsingHSReference(newDevice.config.tamperRef)
			.setConfigValues(newDevice.config)
			.on('HSvalueChanged', (newHSValue, homekitObject) => { 
				var tampered = (newHSValue!= 0) ? true : false
					homekitObject.updateValue(tampered)
				})	;				
	}
	
	services.push(informationService);
	services.push(thisSensorService);
}
