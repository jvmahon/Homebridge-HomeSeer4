'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var HSutilities = require("../lib/HomeSeerUtilities");
var globals = require("../index").globals;
var Listen = require("../lib/Setup Listener");
var HomeSeerData = require("../index.js").HomeSeer;

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
		case "CarbonDioxideSensor": {
			var thisSensorService = new Service.CarbonDioxideSensor();
			
			thisSensorService.getCharacteristic(Characteristic.CarbonDioxideDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
				
							// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
							if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254))
							{
								thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
								return
							}
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
	
							if (homekitObject.config.offValues.includes(newHSValue))
									{ homekitObject.updateValue(false); }
								else
									{ 	homekitObject.updateValue(true); }
						})
			break;
		}

		case "CarbonMonoxideSensor": {
			var thisSensorService = new Service.CarbonMonoxideSensor();
			
			thisSensorService.getCharacteristic(Characteristic.CarbonMonoxideDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
				
							// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
							if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254))
							{
								thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
								return
							}
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
	
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
				
							// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
							if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254))
							{
								thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
								return
							}
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
	 
							if (homekitObject.config.offValues.includes(newHSValue))
									{ homekitObject.updateValue(false); }
								else
									{ 	homekitObject.updateValue(true); }
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
				
							// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
							if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254))
							{
								thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
								return
							}
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
	
							homekitObject.updateValue(newHSValue)
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
				
							// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
							if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254))
							{
								thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
								return
							}
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
	
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
				
		case "MotionSensor": {
			var thisSensorService = new Service.MotionSensor();
			
			thisSensorService.getCharacteristic(Characteristic.MotionDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
				
							// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
							if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254))
							{
								thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
								return
							}
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
	 
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
				
							// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
							if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254))
							{
								thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
								return
							}
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
	 
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
				
							// A Z-Wave value of 254 is usually an undefined fault! If you get that, set Fault and return.
							if ((homekitObject.config.interface_name == "Z-Wave") && (newHSValue == 254))
							{
								thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(true);
								return
							}
							thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
	 
							if (homekitObject.config.offValues.includes(newHSValue))
									{ homekitObject.updateValue(false); }
								else
									{ 	homekitObject.updateValue(true); }
						})
			break;
		}


		case "TemperatureSensor": 
		{
			var thisSensorService = new Service.TemperatureSensor();
			
			// Check if the "status" field includes a "C" or a "F" as the last character indicting the temperature scale!
			let statusField = HomeSeerData.getStatusField(that.config.ref);
			// globals.log(red("StatusField is: " + JSON.stringify(statusField) + " for device reference: " + that.config.ref));
			
			switch(true)
			{
				case 	statusField.endsWith("F"): 
					{	
						thisSensorService.temperatureUnit = "F"; 	
						break;
					}
				case  	statusField.endsWith("C"): 
					{	
						thisSensorService.temperatureUnit = "C"; 
						break;	
					}
				default:
				{
					throw new RangeError(red("Error setting up Temperature Sensor. Scale is not Celsius or Fahrenheit"), "Sensor Setup.js");
				}
			}
			
			thisSensorService.getCharacteristic(Characteristic.CurrentTemperature)
				.setProps({ minValue: -100 })
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						var newTemperature = parseFloat(newHSValue);
						if (thisSensorService.temperatureUnit == "F") 
						{ 
							newTemperature = ((newHSValue - 32 )* (5/9));
						}
							// globals.log(chalk.blue("HSUpdate called to update Sensor: " + that.config.type + " with new value :" + newHSValue + " to a new Celsius temperature of: " + newTemperature + ", Temperature Scale setting is: " + thisSensorService.temperatureUnit))
							homekitObject.updateValue(newTemperature);
						})

			break;
		}	

	}

	
	thisSensorService.isPrimaryService = true;


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

	
	services.push(informationService);
	services.push(thisSensorService);
	// 
}
