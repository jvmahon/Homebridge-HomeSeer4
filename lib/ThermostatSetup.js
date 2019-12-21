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
		
		if (	(RootStatusInfo.device_type.Device_API 		!= 16) 
			|| 	(RootStatusInfo.device_type.Device_Type 	!= 99) 
			|| 	(RootStatusInfo.device_type.Device_SubType 	!= 0)
			)
			{
				throw new SyntaxError(red("You specified HomeSeer reference: '" + RootStatusInfo.ref + "' as a Thermostat Root Device, but it appears not to be the root device for a Thermostat. Check your config.json file and fix!"))
			}
		
		var associatedDevices = RootStatusInfo.associated_devices;
					// console.log(chalk.magenta("associated devices:  " + JSON.stringify(associatedDevices)));

		var configuration = [];;
		
		for(var currentDevice of associatedDevices)
		{
			var currentDeviceStatusInfo = globals.allHSDevices.HSdeviceStatusInfo.find( (element) => {return(element.ref == currentDevice)})
			


			// console.log(chalk.cyan("current Thermostat Device Subtype is:  " + JSON.stringify(currentDeviceStatusInfo.device_type.Device_SubType)));
			
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
					// console.log(magenta("Executed the Switch statement for info: " + currentDeviceStatusInfo.device_type.Device_Type));
				}
			}

		}
		// console.log(chalk.green("Discovered Configuration is:  " + Object.getOwnPropertyNames(configuration)));
		// console.log(chalk.green("Discovered Configuration is:  " + (configuration)));
		thermostatRoot.config = configuration;
		return configuration;

}

///////////////////////////////////////////////////////////////////////////

exports.setupThermostat = function (that, services)
{
	// 'that' contains the config information for the current accessory
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;

	let deviceConfig = that.config;	

	// globals.log(red("**Debug** - Configuration values are: " + Object.getOwnPropertyNames(that.config)));
	
	var thermostatService = new Service.Thermostat();


	// thermostatService.thermostatType 0 = Invalid; 1 = Cooling Only;  2 = Heating Only; 3 = Heating and Cooling with Auto Changeover!
	thermostatService.thermostatType = 0;
		if ( (deviceConfig.heatingSetpointRef !== undefined) && (deviceConfig.heatingSetpointRef != 0)) 	
			{
				thermostatService.thermostatType = thermostatService.thermostatType + 1;
			};
		if ( (deviceConfig.coolingSetpointRef !== undefined) && (deviceConfig.coolingSetpointRef != 0)) 	
			{
				thermostatService.thermostatType = thermostatService.thermostatType + 2;
			};
			
			
			let statusField = globals.allHSDevices.HSdeviceStatusInfo.find( (element) => { return (element.ref == deviceConfig.ref ) }).status;
		
			switch(true)
			{
				case 	statusField.endsWith("F"): 
					{	
						// globals.log(red("Temperature Scale is Fahrenheit"));
						thermostatService.temperatureUnit = "F"; 	
						thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(1);
						break;
					}
				case  	statusField.endsWith("C"): 
					{	
						// globals.log(red("Temperature Scale is Celsius"));
						thermostatService.temperatureUnit = "C"; 
						thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(0);
						break;	
					}
				default:
				{
					throw new RangeError(red("Error setting up Thermostat. Scale is not Celsius or Fahrenheit"));
				}
			}


	// If either cooling or heating setpoint changes, or the mode, send entire service block for analysis and update!
	thermostatService
		.setConfigValues(deviceConfig)
		.updateUsingHSReference(deviceConfig.coolingSetpointRef) // HomeSeer cooling setpoint changes
		.updateUsingHSReference(deviceConfig.heatingSetpointRef) // HomeSeer heating setpoint changeid
		.updateUsingHSReference (deviceConfig.controlRef) // HomeSeer Thermostat Mode Changes - TargetHeatingCoolingState
		.updateUsingHSReference (deviceConfig.stateRef)
		thermostatService.HSRef = null; //there is no one defined HSRef for this object, so set it to null as  a way of tracing errors if any code tries to rely on HSREf !
		
		// globals.log(cyan("Adding thermostat of type: " + thermostatService.thermostatType));
		switch(thermostatService.thermostatType)
		{ 

			case 1: // Thermostat Supports Heating
			case 2: // Thermostat Supports Cooling
			{
				thermostatService.getCharacteristic(Characteristic.TargetTemperature)
					.setConfigValues(deviceConfig);
				break;
			}
			case 3: // Thermostat Has An Auto Mode
			{
				thermostatService.getCharacteristic(Characteristic.TargetTemperature)
					.setConfigValues(deviceConfig);

				thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
					.setConfigValues(deviceConfig, deviceConfig.heatingSetpointRef);
					
				thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
					.setConfigValues(deviceConfig, deviceConfig.coolingSetpointRef);
					
				break;
			}
			case 0: // invalid Thermostat Type
			default: // This One is for Errors
			{
				throw new SyntaxError(red("Error - Invalid Thermostat Type. This may be result of failure to specify heating and cooling reference devices in your config.json file. Type should be 1-3. Type is: " + thermostatService.thermostatType));
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
				
					// Current Heating and Cooling State Is Update Only
					
				HomeKitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState)
					.updateValue(globals.getHSValue(HomeKitObject.config.controlRef));
					
				HomeKitObject.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
					.updateValue(globals.getHSValue(HomeKitObject.config.stateRef));

				
				var currentControlMode = globals.getHSValue(HomeKitObject.config.controlRef)
				
					// Type of Thermostat
					switch(currentControlMode)
					{ 
						case 0: // Off
						{
							// globals.log(yellow("Set to Off Mode"));
							HomeKitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(0);	
							break;
						}
						case 1: // Thermostat Only Supports Heating
						{
							// globals.log(yellow("Adjusting Heating"));
							heatingTemp = parseFloat(globals.getHSValue(HomeKitObject.config.heatingSetpointRef));
							if (thermostatService.temperatureUnit == "F")
							{ 
								// Convert Fahrenheit to Celsius
								heatingTemp = ((heatingTemp - 32 )* (5/9));
							}
							HomeKitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(1);	
							HomeKitObject.getCharacteristic(Characteristic.TargetTemperature).updateValue(heatingTemp)

							break;
						}
						case 2: // Thermostat Only Supports Cooling
						{
							// globals.log(yellow("Adjusting Cooling"));
							coolingTemp = parseFloat(globals.getHSValue(HomeKitObject.config.coolingSetpointRef));
							if (thermostatService.temperatureUnit == "F")
							{ 
								// Convert Fahrenheit to Celsius
								coolingTemp = ((coolingTemp - 32 )* (5/9));
							}
							HomeKitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(2);	
							HomeKitObject.getCharacteristic(Characteristic.TargetTemperature).updateValue(coolingTemp)

							break;
						}
						case 3: // Thermostat Has An Auto Mode
						{
							// yglobals.log(yellow("Adjusting Heating and Cooling"));
							 heatingTemp = parseFloat(globals.getHSValue(HomeKitObject.config.heatingSetpointRef));
							 coolingTemp = parseFloat(globals.getHSValue(HomeKitObject.config.coolingSetpointRef));
							
							if (thermostatService.temperatureUnit == "F")
							{ 
								// Convert Fahrenheit to Celsius
								heatingTemp = ((heatingTemp - 32 )* (5/9));
								coolingTemp = ((coolingTemp - 32 )* (5/9));
							}
								HomeKitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(3);	
								HomeKitObject.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(heatingTemp)
								HomeKitObject.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(coolingTemp)							
							break;
						}
						default: // This One is for Errors
						{
							throw new SyntaxError("Error - Invalid Thermostat Type of: " + HomeKitObject.thermostatType)
							break;
						}
					}

					// Does HomeSeer say the mode is Off, Heat, Cool, or Auto
		
					// globals.log(chalk.cyanBright("Updating Service.Thermostat, Current target Heating / cooling Mode is: '" + currentControlMode + "', with new heating Temp: '" + heatingTemp +	"', new cooling Temp: '" + coolingTemp + "' in degrees Celsius"));
										
					// Set that mode into iOS
				
					// Do nothing if turned off!
					if (currentControlMode == 0) return;

			})	


	if ((deviceConfig.coolingSetpointRef) && (deviceConfig.heatingSetpointRef) )
	{
		thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.on('set', function(value, callback, context)
			{
				// globals.log(yellow("* Debug * - Characteristic.CoolingThresholdTemperature - Received temperature change from iOS to Cooling Threshold Temperature"));
				
				var temperature = parseFloat(value);
				if (thermostatService.temperatureUnit == "F")
				{
					temperature = (temperature * (9/5)) + 32;
				}
				
				// globals.log(cyan("317 - Received temperature change from iOS to CoolingThresholdTemperature of value: " + temperature));

				globals.sendHS(deviceConfig.coolingSetpointRef, temperature);
				
				callback(null);
			} )

		thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.on('set', function(value, callback, context)
			{
				var temperature = parseFloat(value);
				if (thermostatService.temperatureUnit == "F")
				{
					temperature = (temperature * (9/5)) + 32;
				}
				
				// globals.log(red("*Debug* - HeatingThresholdTemperature - Received temperature change from iOS to HeatingThresholdTemperature of value: " + temperature));


				globals.sendHS(deviceConfig.heatingSetpointRef, temperature);
				
				callback(null);
			} )			
			
	}

	thermostatService.getCharacteristic(Characteristic.TargetTemperature)
		.on('set', function(value, callback, context)
		{

			var temperature = parseFloat(value);
			if (thermostatService.temperatureUnit == "F")
			{
				temperature = (temperature * (9/5)) + 32;
			}
			
			var currentThermostatMode = globals.getHSValue(deviceConfig.controlRef)

			switch(currentThermostatMode)
			{
				case 1: // heating
				{
			// globals.log(cyan("* Debug * - Characteristic.TargetTemperature - SET Event called with value: " + value + ", which is transmitted as: " + temperature +" in HVAC mode No.: " + currentThermostatMode));	

					globals.sendHS(deviceConfig.heatingSetpointRef, temperature)					
				
					break;
				}
				case 2: // cooling
				{
			// globals.log(cyan("*Debug* - Characteristic.TargetTemperature SET Event called with value: " + value + ", which is transmitted as: " + temperature +" in HVAC mode No.: " + currentThermostatMode));					

					globals.sendHS(deviceConfig.coolingSetpointRef, temperature)
					break;
				}
			}
			callback(null);
		});

	
	thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
		.setConfigValues(deviceConfig);
			
	thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
		.on('set', function(value, callback, context)
		{
				// globals.log(cyan("*Debug* - TargetHeatingCoolingState 'set' event from iOS with value: " + value))

				globals.sendHS(deviceConfig.controlRef, value);

				// After changing mode from Auto to Heating or Cooling, make sure to set TargetTemperature
				// To current heating or cooling value of HomeSeer device identified by coolingSetpointRef or heatingSetpointRef

				var heatingTemp = (deviceConfig.heatingSetpointRef === undefined) ? null : globals.getHSValue(thermostatService.config.heatingSetpointRef);
				var coolingTemp = (deviceConfig.coolingSetpointRef === undefined) ? null : globals.getHSValue(thermostatService.config.coolingSetpointRef);
				if (thermostatService.temperatureUnit == "F")
					{ 
						heatingTemp = ((heatingTemp - 32 )* (5/9));
						coolingTemp = ((coolingTemp - 32 )* (5/9));
					}
				// globals.log(yellow("Updating TargetHeatingCoolingState, Current target Heating / cooling Mode is: " + thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).value +", with new heating Temp: " + heatingTemp +	", new cooling Temp: " + coolingTemp));
				
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

	
	// The following code is now 'dead' code as the range of properties is fixed, above, so you can't actually change it! See lines 155-175.
	thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits)
		 .on('set', function(value, callback)
			{ 	
				globals.log(red("*Warning * -  Changing Hardware Display Units from iPhone Home Does Nothing!. To change the units used by the iOS Home App, you need to change it in the iOS 'Language and Region' settings. To change the units used by HomeSeer, make the change in the HomeSeer Tools - Setup menu. Continuing to use: " + thermostatService.temperatureUnit));
			
				callback(null);
			}) 
		.on('change', function(data)
			{ 	
			var timer;

					switch(true)
					{
						case (data.newValue == 0) && (thermostatService.temperatureUnit == "F"): 
							{	
								globals.log(yellow("Thermostat Harware Display Unit Changed to Celsius, but HomeSeer is set to Fahrenheit. Resetting Hardware Display Unit to Fahrenheit."));
							timer = setTimeout( function() 
									{	thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(1);				
									}, 3000)
								break;
							}
						case  (data.newValue == 1) && (thermostatService.temperatureUnit == "C"): 
							{	
								globals.log(yellow("Thermostat Harware Display Unit Changed to Fahrenheit, but HomeSeer is set to Celsius. Resetting Hardware Display Unit to Celsius."));
								timer = setTimeout( function() 
									{	thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(1);				
									}, 3000)
								break;	
							}
					}

			})
		
		
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
	

		
	// Current Temperature Is Update Only		
	thermostatService.getCharacteristic(Characteristic.CurrentTemperature)
		.setProps({minValue:-20, maxValue: 50})
		.updateUsingHSReference(deviceConfig.ref)
		.setConfigValues(deviceConfig);
		
	thermostatService.getCharacteristic(Characteristic.CurrentTemperature)			
		.on('HSvalueChanged', function(newHSValue, HomeKitObject)
		{
				var newTemp = newHSValue;
				if (thermostatService.temperatureUnit == "F")
					{ 
						newTemp = ((newHSValue - 32 )* (5/9));
					}
				
				HomeKitObject.updateValue(newTemp);
		})		


	services.push(thermostatService);
}
