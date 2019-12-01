'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var HSutilities = require("../lib/HomeSeerUtilities");
var promiseHTTP = require("request-promise-native");
var globals = require("../index").globals;
let getHSValue = globals.getHSValue;
var Listen = require("../lib/Setup Listener");

exports.setupSensor = function (that, services)
{
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, that.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + that.config.type + " ref " + that.ref);
		
	
	switch (that.config.type) 
	{
		case "TemperatureSensor": 
		{
			var thisSensorService = new Service.TemperatureSensor();
			
			thisSensorService.getCharacteristic(Characteristic.CurrentTemperature)
				.setProps({ minValue: -100 })
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						var newTemperature = parseFloat(newHSValue);
						if ((homekitObject.config.temperatureUnit != null) && (homekitObject.config.temperatureUnit == "F")) 
						{ 
							newTemperature = ((newHSValue - 32 )* (5/9));
						}
							globals.log(chalk.blue("HSUpdate called to update Sensor: " + that.config.type + " with new value :" + newHSValue + " to a new Celsius temperature of: " + newTemperature))
								homekitObject.updateValue(newTemperature);
						})

			break;
		}

		case "CarbonMonoxideSensor": {
			var thisSensorService = new Service.CarbonMonoxideSensor();
			
			thisSensorService.getCharacteristic(Characteristic.CarbonMonoxideDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							if (homekitObject.config.offValues.includes(newHSValue))
									{ homekitObject.updateValue(false); }
								else
									{ 	homekitObject.updateValue(true); }
						})
			break;
		}
		
		case "CarbonDioxideSensor": {
			var thisSensorService = new Service.CarbonDioxideSensor();
			
			thisSensorService.getCharacteristic(Characteristic.CarbonDioxideDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							if (homekitObject.config.offValues.includes(newHSValue))
									{ homekitObject.updateValue(false); }
								else
									{ 	homekitObject.updateValue(true); }
						})
			break;
		}
		
		case "ContactSensor": {
			var thisSensorService = new Service.ContactSensor();
			
			thisSensorService.getCharacteristic(Characteristic.ContactSensorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)	
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							if (homekitObject.config.offValues.includes(newHSValue))
									{ homekitObject.updateValue(false); }
								else
									{ 	homekitObject.updateValue(true); }
						})
			break;
		}
		
		case "MotionSensor": {
			var thisSensorService = new Service.MotionSensor();
			
			thisSensorService.getCharacteristic(Characteristic.MotionDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							if (homekitObject.config.offValues.includes(newHSValue))
									{ homekitObject.updateValue(false); }
								else
									{ 	homekitObject.updateValue(true); }
						})
			break;
		}
		
		case "LeakSensor": 
		{
			var thisSensorService = new Service.LeakSensor();
			
			thisSensorService.getCharacteristic(Characteristic.LeakDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)	
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							if (homekitObject.config.offValues.includes(newHSValue))
									{ homekitObject.updateValue(false); }
								else
									{ 	homekitObject.updateValue(true); }
						})				
			break;
		}
		
		case "OccupancySensor": {
            //globals.log("DEBUG - Case OccupancySensor");
			var thisSensorService = new Service.OccupancySensor();
			
			thisSensorService.getCharacteristic(Characteristic.OccupancyDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)	
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							if (homekitObject.config.offValues.includes(newHSValue))
									{ homekitObject.updateValue(false); }
								else
									{ 	homekitObject.updateValue(true); }
						})
			break;
		}
		
		case "SmokeSensor": {
            //globals.log("DEBUG - Case SmokeSensor");
			var thisSensorService = new Service.SmokeSensor();
			
			thisSensorService.getCharacteristic(Characteristic.SmokeDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)	
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							if (homekitObject.config.offValues.includes(newHSValue))
									{ homekitObject.updateValue(false); }
								else
									{ 	homekitObject.updateValue(true); }
						})
			break;
		}
		
		case "LightSensor": 
		{
            //globals.log("DEBUG - Case LightSensor");
			var thisSensorService = new Service.LightSensor();
			
			thisSensorService.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)	
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							homekitObject.updateValue(newHSValue)
						})				
			break;
		}
		
		case "HumiditySensor": 
		{
            //globals.log("DEBUG - Case HumiditySensor");
			var thisSensorService = new Service.HumiditySensor();
			
			thisSensorService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							homekitObject.updateValue(newHSValue)
						})					
			break;
		}
	}

	
	thisSensorService.isPrimaryService = true;

	thisSensorService.displayName = "Service." + that.config.type;

	// if a tamper reference has been defined, add that characteristic
	if (that.config.tamperRef)
	{
		thisSensorService.getCharacteristic(Characteristic.StatusTampered)
			.updateUsingHSReference(that.config.tamperRef)
			.setConfigValues(that.config)
			.on('HSvalueChanged', (newHSValue, homekitObject) => { 
				var tampered = false;
					tampered =  (newHSValue!= 0) ? true : false
					homekitObject.updateValue(tampered)
				})	;				
	}
/*	
	 // If batteryRef has been defined, then add a battery service.
	if (that.config.batteryRef) 
	{
		var batteryService = new Service.BatteryService();
		batteryService.displayName = "Service.BatteryService";
		
		batteryService.getCharacteristic(Characteristic.BatteryLevel)
			.updateUsingHSReference(that.config.batteryRef)
			.setConfigValues(that.config)
			.on('HSvalueChanged', (newHSValue, homekitObject) => { 
					homekitObject.updateValue(newHSValue)
					})	

					
		batteryService
			.getCharacteristic(Characteristic.StatusLowBattery)
			.updateUsingHSReference(that.config.batteryRef)
			.setConfigValues(that.config)
			.on('HSvalueChanged', (newHSValue, homekitObject) => { 
				var lowBattery = false;
					lowBattery =  (newHSValue < homekitObject.config.batteryThreshold) ? true : false
					homekitObject.updateValue(lowBattery)
				})	;						
		
		services.push(batteryService);
	}
*/		
	services.push(informationService);
	services.push(thisSensorService);
	// 
}
