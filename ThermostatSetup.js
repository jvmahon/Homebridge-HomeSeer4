'use strict'
//				.on('set', function(value, callback, context)); function called when a change originates from the iOS Home Application.  This should process the value receive from iOS to then send a new value to HomeSeer. 
// 				.on('change', function(data)) - Similar to .on('set' ...) - 'change' is triggered either when there is an update originating from the iOS Home Application or else when you use updateValue from hap-nodejs.
//				.on('HSvalueChanged', function(newHSValue, HomeKitObject) - use this to process a change originating from HomeSeer. The value of HomeKitObject is either a HomeKit Service or a HomeKit Characteristic. This HomeKit Object is identified by the call .updateUsingHSReference(that.config.ref) which registers the object to receive a change originating from HomeSeer




var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

var globals = require("../index").globals;

exports.identifyThermostatData = function (thermostatRoot, allAccessories)
{

		var RootStatusInfo = [];
		RootStatusInfo = globals.allHSDevices.HSdeviceStatusInfo.find( (element) => {return(element.ref == thermostatRoot.ref)})
		// if (index != -1) globals.log(yellow("*Debug* - Found Device for reference: " + ref + " at index " + index));
		
		var associatedDevices = RootStatusInfo.associated_devices;
					console.log(chalk.magenta("associated evices:  " + JSON.stringify(associatedDevices)));

		var configuration = [];;
		
		for(var currentDevice of associatedDevices)
		{
			var currentDeviceStatusInfo = globals.allHSDevices.HSdeviceStatusInfo.find( (element) => {return(element.ref == currentDevice)})
			
			// if (currentDeviceStatusInfo.Device_API != 16) throw new SyntaxError ("Not a thermostat device");
			
			console.log(chalk.magenta("current Thermostat Device for reference: " + currentDeviceStatusInfo.ref +  " is:  " + JSON.stringify(currentDeviceStatusInfo.device_type)));
			console.log(chalk.cyan("current Thermostat Device Type is:  " + JSON.stringify(currentDeviceStatusInfo.device_type.Device_Type)));

			console.log(chalk.cyan("current Thermostat Device Subtype is:  " + JSON.stringify(currentDeviceStatusInfo.device_type.Device_SubType)));
			
			switch(currentDeviceStatusInfo.device_type.Device_Type)
			{
				case 0: // Undefined Status Device
				{
					break;
				}
				case 1: // Operating State
				{
					configuration.stateRef = currentDeviceStatusInfo.ref // 1:0
				}
				case 2: // Temperature
				{
					switch(currentDeviceStatusInfo.device_type.Device_SubType)
					{
						case 1: 
						{
							configuration.ref = currentDeviceStatusInfo.ref // 2:1
						}
						case 5: 
						{
							configuration.humidityRef = currentDeviceStatusInfo.ref // 2:5
						}
					}
					break;
				}				
				case 3: // Fan Mode Status
				{
					configuration.controlRef = currentDeviceStatusInfo.ref; // 3:1
				}
				case 4: // Fan Mode (On, Auto, Circulate)
				{
					break;
				}				
				case 5:	// Fan Status
				{
					break;
				}				
				case 6: // Setpoints
				{
					switch(currentDeviceStatusInfo.device_type.Device_SubType)
					{
						case 1: // Heating Setpoints
						{
							configuration.heatingSetpointRef = currentDeviceStatusInfo.ref; // 6:1
						}
						case 2: // Cooling Setpoint
						{
							configuration.coolingSetpointRef = currentDeviceStatusInfo.ref; // 6:2
						}
					}
				}				

				case 8: // Hold Mode
				{
					break;
				}					
				case 9: // Operating Mode
				{
					break;
				}					
				case 10: // Additional Temperature
				{
					break;
				}	
				default:
				{
					console.log(magenta("Executed the Switch statement for info: " + currentDeviceStatusInfo.device_type.Device_Type));
				}
			}

		}
		console.log(chalk.green("Discovered Configuration is:  " + Object.getOwnPropertyNames(configuration)));
		console.log(chalk.green("Discovered Configuration is:  " + (configuration)));
		return configuration;

}


exports.setupThermostat = function (that, services)
{
	// 'that' contains the config information for the current accessory
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;

	let deviceConfig = that.config;	


	// And add a basic Accessory Information service		
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, that.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + deviceConfig.type + " ref " + that.ref);
	
	var thermostatService = new Service.Thermostat();
	thermostatService.displayName = "Service.Thermostat";
	
	thermostatService.thermostatType = 0;
		if (deviceConfig.heatingSetpointRef && (deviceConfig.heatingSetpointRef != 0)) 	
					{
							thermostatService.thermostatType = thermostatService.thermostatType + 1;
							};
		if (deviceConfig.coolingSetpointRef && (deviceConfig.coolingSetpointRef != 0)) 	
					{
						thermostatService.thermostatType = thermostatService.thermostatType + 2;
						};

		// thermostatService.thermostatType 0 = Invalid; 1 = Cooling Only;  2 = Heating Only; 3 = Heating and Cooling with Auto Changeover!

		


	
	// If either cooling or heating setpoint changes, send entire service block for analysis and update!
	thermostatService
		.setConfigValues(deviceConfig)
		.updateUsingHSReference(deviceConfig.coolingSetpointRef) // HomeSeer cooling setpoint changes
		.updateUsingHSReference(deviceConfig.heatingSetpointRef) // HomeSeer heating setpoint changeid
		.updateUsingHSReference (deviceConfig.controlRef) // HomeSeer Thermostat Mode Changes - TargetHeatingCoolingState
		thermostatService.HSRef = null; //there is no one defined HSRef for this object, so set it to null as  a way of tracing errors if any code tries to rely on HSREf !
		

					switch(thermostatService.thermostatType)
					{ 

						case 1: // Thermostat Supports Heating
						case 2: // Thermostat Supports Cooling
						{
							thermostatService.getCharacteristic(Characteristic.TargetTemperature)
								.setProps({minValue:14.4, maxValue: 37.3})
								.setProps({ minStep:.01})
								.displayName = "Characteristic.TargetTemperature";
							thermostatService.getCharacteristic(Characteristic.TargetTemperature).setConfigValues(deviceConfig);
							break;
						}
						case 3: // Thermostat Has An Auto Mode
						{
							thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
								.setProps({minValue:14.4, maxValue: 37.3})
								.setProps({ minStep:.01})
								.displayName = "Characteristic.HeatingThresholdTemperature";
								
							thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
								.setProps({minValue:14.4, maxValue: 37.3})
								.setProps({ minStep:.01})
								.displayName = "Characteristic.TargetTemperature";	
								
							thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature).setConfigValues(deviceConfig);
							thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature).setConfigValues(deviceConfig);
								
							break;
						}
						case 0: // invalid Thermostat Type
						default: // This One is for Errors
						{
							throw new SyntaxError("Error - Invalid Thermostat Type of: " + thermostatService.thermostatType)
							break;
						}
					}		

		
		thermostatService
			.on('HSvalueChanged', function(newHSValue, HomeKitObject)
			{
				// This is called if there is a change from HomeSeer to a heating or cooling setpoint or to the mode.
				// console.log(chalk.magentaBright("* Debug 109 * - Thermostat SetPoint changed on event HSvalueChanged with new value: " + newHSValue + " and boject named: " + HomeKitObject.config.name));
				
				// Calculate the Current Temperature variables
				let targetTemperature = null;
				let heatingTemp = null;
				let coolingTemp = null;
				
					// Type of Thermostat
					switch(thermostatService.thermostatType)
					{ 
						case 1: // Thermostat Only Supports Heating
						{
							heatingTemp = globals.getHSValue(HomeKitObject.config.heatingSetpointRef);
							if (thermostatService.config.temperatureUnit == "F")
							{ 
								heatingTemp = ((heatingTemp - 32 )* (5/9)).toFixed(2);
							}
							break;
						}
						case 2: // Thermostat Only Supports Cooling
						{
							coolingTemp = globals.getHSValue(HomeKitObject.config.coolingSetpointRef);
							if (thermostatService.config.temperatureUnit == "F")
							{ 
								coolingTemp = ((coolingTemp - 32 )* (5/9)).toFixed(2);
							}
							break;
						}
						case 3: // Thermostat Has An Auto Mode
						{
							 heatingTemp = globals.getHSValue(HomeKitObject.config.heatingSetpointRef);
							 coolingTemp = globals.getHSValue(HomeKitObject.config.coolingSetpointRef);
							
							if (thermostatService.config.temperatureUnit == "F")
							{ 
								heatingTemp = ((heatingTemp - 32 )* (5/9)).toFixed(2);
								coolingTemp = ((coolingTemp - 32 )* (5/9)).toFixed(2);
							}
							break;
						}
						case 0: // invalid Thermostat Type
						default: // This One is for Errors
						{
							throw new SyntaxError("Error - Invalid Thermostat Type of: " + thermostatService.thermostatType)
							break;
						}
					}

					// Does HomeSeer say the mode is Off, Heat, Cool, or Auto
					let currentThermostatMode = globals.getHSValue(HomeKitObject.config.controlRef)
					
							// globals.log(chalk.cyanBright("Updating Service.Thermostat, Current target Heating / cooling Mode is: " + currentThermostatMode + ", with new heating Temp: " + heatingTemp +	", new cooling Temp: " + coolingTemp));
										
					// Set that mode into iOS
					HomeKitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(currentThermostatMode);					
					// Do nothing if turned off!
					if (currentThermostatMode == 0) return;


					// Adjust Temperature Setting in iOS Depending on Mode!
					switch(currentThermostatMode)
					{
						case 0:  // Do nothing if Thermostat is off! 
							{ 
								// globals.log(yellow("Off"));
								break; 
							}
						case 1: //Adjust Heating Temperature
							{
								// globals.log(yellow("Adjusting heating"));
								HomeKitObject.getCharacteristic(Characteristic.TargetTemperature).updateValue(heatingTemp)
								break; 
							}
						case 2: // Adjust Cooling Temperature
							{
								// globals.log(yellow("Adjusting Cooling"));

								HomeKitObject.getCharacteristic(Characteristic.TargetTemperature).updateValue(coolingTemp)
								break;
							}
						case 3: // Auto. Adjust both setpoints.
							{
								// globals.log(yellow("96 - Received temperature change from iOS to Cooling and Heating Threshold Temperature"));
								HomeKitObject.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(heatingTemp)
								HomeKitObject.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(coolingTemp)
								break;
							}
					}
			})	


	if (deviceConfig.coolingSetpointRef)
	{
		thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.on('set', function(value, callback, context)
			{
				globals.log(yellow("212 - Received temperature change from iOS to Cooling Threshold Temperature"));
				let temperature = (deviceConfig.temperatureUnit == "F") ? (Math.round((value * (9/5)) + 32)).toFixed(2) : value;
				globals.sendHS(deviceConfig.coolingSetpointRef, temperature)
				globals.setHSValue(deviceConfig.coolingSetpointRef, temperature)
				
				callback(null);
			} )
			
			.displayName = "Characteristic.CoolingThresholdTemperature";
	}
	
	if (deviceConfig.heatingSetpointRef)
	{
		thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)

			.on('set', function(value, callback, context)
			{
				let temperature = (deviceConfig.temperatureUnit == "F") ? (Math.round((value * (9/5)) + 32)).toFixed(2) : value;
				globals.log(red("29 - Received temperature change from iOS to Heating Threshold Temperature of value: " + temperature));

				globals.sendHS(deviceConfig.heatingSetpointRef, temperature)
				globals.setHSValue(deviceConfig.heatingSetpointRef, temperature)
				callback(null);
			} )			

			.displayName = "Characteristic.HeatingThresholdTemperature";				
	}

	thermostatService.getCharacteristic(Characteristic.TargetTemperature)
		.on('set', function(value, callback, context)
		{
			var newTemp = value;

			if(thermostatService.config.temperatureUnit == "F")
				{ newTemp = ((newTemp * (9/5)) +32).toFixed(2);	}
			
			let currentThermostatMode = globals.getHSValue(deviceConfig.controlRef)
						



			switch(currentThermostatMode)
			{
				case 1: // heating
				{
			globals.log(cyan("257 - Characteristic.TargetTemperature SET Event called with value: " + value + ", which is transmitted as: " + newTemp +" in HVAC mode No.: " + currentThermostatMode));					
					globals.sendHS(thermostatService.config.heatingSetpointRef, newTemp);
					break;
				}
				case 2: // cooling
				{
			globals.log(cyan("263 - Characteristic.TargetTemperature SET Event called with value: " + value + ", which is transmitted as: " + newTemp +" in HVAC mode No.: " + currentThermostatMode));					
					globals.sendHS(thermostatService.config.coolingSetpointRef, newTemp);
					break;
				}
			}
			callback(null);
		});

	

							
	thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
		.setConfigValues(deviceConfig)
		.updateUsingHSReference(deviceConfig.controlRef)
		.displayName = "Characteristic.TargetHeatingCoolingState";
			
	thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
		.on('set', function(value, callback, context)
		{
				globals.log(cyan("* Debug 282 * - TargetHeatingCoolingState 'set' event from iOS with value: " + value))

				globals.sendHS(deviceConfig.controlRef, value);

				// After changing mode from Auto to Heating or Cooling, make sure to set TargetTemperature
				// To current heating or cooling value of HomeSeer device identified by coolingSetpointRef or heatingSetpointRef

				var heatingTemp = (deviceConfig.heatingSetpointRef === undefined) ? null : globals.getHSValue(thermostatService.config.heatingSetpointRef);
				var coolingTemp = (deviceConfig.coolingSetpointRef === undefined) ? null : globals.getHSValue(thermostatService.config.coolingSetpointRef);
				if (thermostatService.config.temperatureUnit == "F")
					{ 
						heatingTemp = ((heatingTemp - 32 )* (5/9)).toFixed(2);
						coolingTemp = ((coolingTemp - 32 )* (5/9)).toFixed(2);
					}
				globals.log(yellow("Updating TargetHeatingCoolingState, Current target Heating / cooling Mode is: " + thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).value +", with new heating Temp: " + heatingTemp.toFixed(1) +	", new cooling Temp: " + coolingTemp.toFixed(1)));
				switch(value)
				{
					case(0): // mode Off
						{	break; }
					case(1): //mode heating
						{
							thermostatService.getCharacteristic(Characteristic.TargetTemperature).updateValue(heatingTemp); 
							break
						}
					case(2): // mode cooling
						{
							thermostatService.getCharacteristic(Characteristic.TargetTemperature).updateValue(coolingTemp); 
							break;
						}
					case(3): // mode auto
						{
							thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(coolingTemp);
							thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(heatingTemp); 
							break;
						}
				}
				callback(null);
			}
		)

// Setting of humidity target is currently not implemented!
/*
	if (deviceConfig.humidityTargetRef)
	{
		thermostatService
			.addCharacteristic(Characteristic.TargetRelativeHumidity)
			.updateUsingHSReference(deviceConfig.humidityTargetRef)
			.setConfigValues(deviceConfig)	
			.on('HSvalueChanged', (newHSValue, homekitObject) => { 
					homekitObject.updateValue(newHSValue)
					})	
			.on('set', function(value, callback, context)
			{
				this.sendHS(value)
				callback(null);
			} )	
			;	
	}	
*/	
	
	
	thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits)
		.on('change', ()=> { globals.log(red("*Warning * -  Changing Hardware Display Units from iPhone Home Does Nothing!. Change must be made to HomeSeer config.json file to have effect."));})
		
		
	////////   Items Below This Line Receive Updates from HomeSeer, but are not changed from iOS //////////////
	
	//   Humidity is update Only!
	
	if (deviceConfig.humidityRef)
	{
		thermostatService.addCharacteristic(Characteristic.CurrentRelativeHumidity)
			.updateUsingHSReference(deviceConfig.humidityRef)
			.setConfigValues(deviceConfig)
			.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							homekitObject.updateValue(newHSValue)
						});	
	}
	
	// Current Heating and Cooling State Is Update Only
	thermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
		.setConfigValues(deviceConfig)
		.updateUsingHSReference(deviceConfig.stateRef)
		.displayName = "Characteristic.CurrentHeatingCoolingState"

		thermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)			
			.on('HSvalueChanged', function(newHSValue, HomeKitObject)
				{
				// globals.log(chalk.magentaBright("* Debug 370 * - Received CurrentHeatingCoolingState change from HomeSeerwith value: " + newHSValue + " for a HomeKit object named: " + HomeKitObject.displayName + " and reference : " + HomeKitObject.HSRef))

					let newValue = globals.getHSValue(HomeKitObject.HSRef);
					HomeKitObject.updateValue(parseInt(newValue));
				}
				);
		
	// Current Temperature Is Update Only		
	thermostatService.getCharacteristic(Characteristic.CurrentTemperature)
		.setProps({minValue:-20, maxValue: 50})
		.updateUsingHSReference(deviceConfig.ref)
		.setConfigValues(deviceConfig)
		.displayName = "Characteristic.CurrentTemperature";
		
	thermostatService.getCharacteristic(Characteristic.CurrentTemperature)			
		.on('HSvalueChanged', function(newHSValue, HomeKitObject)
		{
				var newTemp = newHSValue;
				if (HomeKitObject.config.temperatureUnit == "F")
					{ 
						newTemp = ((newHSValue - 32 )* (5/9)).toFixed(2);
					}
				
				HomeKitObject.updateValue(newTemp);
		})		

		

	services.push(thermostatService);
	services.push(informationService);
}
