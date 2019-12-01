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

///////////////////////////////////////////////////////////////////////////

exports.setupThermostat = function (that, services)
{
	// 'that' contains the config information for the current accessory
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;

	//console.debug("DEBUG - Thermostat");
	var thermostatService = new Service.Thermostat();
	thermostatService.displayName = "Service.Thermostat";
	
	// If either cooling or heating setpoint changes, send entire service block for analysis and update!
	thermostatService
		.setConfigValues(that.config)
		.updateUsingHSReference(that.config.coolingSetpointRef)
		.updateUsingHSReference(that.config.heatingSetpointRef)
		.mode = globals.getHSValue( that.config.controlRef  ); // At startup, store HomeSeer's current control mode here.
		
		thermostatService.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({minValue:-50, maxValue: 75})
			.displayName = "Characteristic.CurrentTemperature";
			
		thermostatService.getCharacteristic(Characteristic.TargetTemperature)
			.setProps({minValue:0, maxValue: 35})
			.displayName = "Characteristic.TargetTemperature";
		
		//	If HomeSeer is operating in Fahrenheit, use a more granular stepsize to avoid rounding errors!			
		if(that.config.temperatureUnit == "F") 	thermostatService.getCharacteristic(Characteristic.TargetTemperature)
			.setProps({ minStep:.01})
			
		thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.setConfigValues(that.config)
			.updateUsingHSReference(that.config.controlRef)
			.displayName = "Characteristic.TargetHeatingCoolingState";
			
		thermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
			.setConfigValues(that.config)
			.updateUsingHSReference(that.config.stateRef)
			.displayName = "Characteristic.CurrentHeatingCoolingState";

	// Current Temperature is read-only!
	thermostatService.getCharacteristic(Characteristic.CurrentTemperature)
		.updateUsingHSReference(that.config.ref)
		.setConfigValues(that.config);
	
	if (that.config.coolingSetpointRef)
	{
		thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.setConfigValues(that.config)
			.setProps({minValue:0, maxValue: 35})
			// .on('set', ()=> { console.log(cyan("CoolingThresholdTemperature SET event called")) })
			// .on('change', ()=> { console.log(magenta("CoolingThresholdTemperature CHANGE event called")) })
			.on('set', function (newCelsiusTemp, callback)
			{
						var newHSTemperatureValue = newCelsiusTemp;
						if (that.config.temperatureUnit == "F")
						{
							newHSValue = Math.round((newCelsiusTemp * (9/5)) + 32);
						}
						globals.sendHS(that.config.coolingSetpointRef, newHSTemperatureValue)
						callback(null);
			})
			// that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)))
			.displayName = "Characteristic.CoolingThresholdTemperature";
	}
	if (that.config.heatingSetpointRef)
	{
		thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.setConfigValues(that.config)
			.setProps({minValue:0, maxValue: 35})
			// .on('set', ()=> { console.log(cyan("HeatingThresholdTemperature SET event called")) })
			// .on('change', ()=> { console.log(magenta("HeatingThresholdTemperature CHANGE event called")) })
			.on('set', function (newCelsiusTemp, callback)
			{
						var newHSTemperatureValue = newCelsiusTemp;
						if (that.config.temperatureUnit == "F")
						{
							newHSValue = Math.round((newCelsiusTemp * (9/5)) + 32);
						}
						globals.sendHS(that.config.coolingSetpointRef, newHSTemperatureValue)
						callback(null);
			})
			.displayName = "Characteristic.HeatingThresholdTemperature";				
	}

	thermostatService.getCharacteristic(Characteristic.TargetTemperature)
		// .on('change', (data) => 	{console.log(cyan("TargetTemperature CHANGE Event called with value: " + data.newValue));	}) 
		// the 'set' event is called when the slider on iOS is altered, but not when .updateValue is called.
		.on('set', (value, callback) =>
		{
			// console.log(magenta("TargetTemperature SET Event called with value: " + value));
			var newTemp = value;
			var success = true;
			if(thermostatService.config.temperatureUnit == "F")
				{ newTemp = ((newTemp * (9/5)) +32).toFixed(0);	}
			
			// console.log(magenta("TargetTemperature SET Event called with value: " + value + ", which is transmitted as: " + newTemp));

			switch(thermostatService.mode)
			{
				case 1: // heating
				{
					that.transmitToHS(newTemp, thermostatService.config.heatingSetpointRef);
					break;
				}
				case 2: // cooling
				{
					that.transmitToHS(newTemp, thermostatService.config.coolingSetpointRef);
					break;
				}
			}
			callback(null);
		});

	thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
		.updateValue(thermostatService.mode) // At startup, set control mode to be same as HomeSeer's
		.on('change', (data) =>
			{
				// console.log(yellow("* Debug * - Received TargetHeatingCoolingState CHANGE event value: " + data.newValue))
				
				thermostatService.mode = data.newValue;
				that.transmitToHS(thermostatService.mode, that.config.controlRef);

				// After changing mode from Auto to Heating or Cooling, make sure to set TargetTemperature
				// To current heating or cooling value of HomeSeer device identified by coolingSetpointRef or heatingSetpointRef

				var heatingTemp = (that.config.heatingSetpointRef === undefined) ? 0 : globals.getHSValue(thermostatService.config.heatingSetpointRef);
				var coolingTemp = (that.config.coolingSetpointRef === undefined) ? 0 : globals.getHSValue(thermostatService.config.coolingSetpointRef);
				if (thermostatService.config.temperatureUnit == "F")
					{ 
						heatingTemp = (heatingTemp - 32 )* (5/9);
						coolingTemp = (coolingTemp - 32 )* (5/9);
					}
				// console.log(yellow("Updating TargetHeatingCoolingState, Current target Heating / cooling Mode is: " + thermostatService.mode +", with new heating Temp: " + HSheatingTemp.toFixed(1) +	", new cooling Temp: " + HScoolingTemp.toFixed(1)));

				switch(thermostatService.mode)
				{
					case(0): // mode Off
						{	
							break; 
						}
					case(1): //mode heating
						{
							thermostatService.getCharacteristic(Characteristic.TargetTemperature)
								.updateValue(heatingTemp); 
							break
						}
					case(2): // mode cooling
						{
							thermostatService.getCharacteristic(Characteristic.TargetTemperature)
								.updateValue(coolingTemp); 
							break;
						}
					case(3): // mode auto
						{
																
							thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
								.updateValue(coolingTemp);
							thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
								.updateValue(heatingTemp); 
							break;
						}
				}
			});

	if (that.config.humidityRef)
	{
		thermostatService.addCharacteristic(Characteristic.CurrentRelativeHumidity)
			.updateUsingHSReference(that.config.humidityRef)
			.setConfigValues(that.config);	
	}
	if (that.config.humidityTargetRef)
	{
		thermostatService
			.addCharacteristic(Characteristic.TargetRelativeHumidity)
			.updateUsingHSReference(that.config.humidityTargetRef)
			.setConfigValues(that.config)	
			.on('set', function(newHumidity, callback)
			{
				globals.sendHS(that.config.humidityTargetRef, newHumidity);
				callback(null);
			})
			// .on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.TargetRelativeHumidity)));	
	}			
	
	
	thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits)
		.on('change', ()=> { console.log(red("*Warning * -  Changing Hardware Display Units Does Nothing!"));})
	//console.debug("   valveService: " + JSON.stringify(thermostatService));
	services.push(thermostatService);
	


}