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
// var Characteristic = require("hap-nodejs").Characteristic;
// var Service = require("hap-nodejs").Service;
let getHSValue = globals.getHSValue;
var Listen = require("../lib/Setup Listener");

exports.setupThermostat = function (that, services)
{
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;

	if(that.config.type == undefined) that.config.type = that.model;
	if(that.config.model == undefined) that.config.model = that.model;
	
	globals.log(yellow(JSON.stringify(that)));

	// And add a basic Accessory Information service		
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, that.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + that.config.type + " ref " + that.ref);
		
	var thermostatService = new Service.Thermostat();
	thermostatService.displayName = "Service.Thermostat";
	
	// If either cooling or heating setpoint changes, send entire service block for analysis and update!
	thermostatService
		.setConfigValues(that.config)
		.updateUsingHSReference(that.config.coolingSetpointRef)
		.updateUsingHSReference(that.config.heatingSetpointRef)
		.mode = globals.getHSValue( that.config.controlRef  ); // At startup, store HomeSeer's current control mode here.
		
		thermostatService.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({minValue:-20, maxValue: 50})
			.updateUsingHSReference(that.config.ref)
			.setConfigValues(that.config)
			.displayName = "Characteristic.CurrentTemperature";
			
		thermostatService.getCharacteristic(Characteristic.TargetTemperature)
			.setProps({minValue:15, maxValue: 35})
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


	if (that.config.coolingSetpointRef)
	{
		thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.setConfigValues(that.config)
			.setProps({minValue:0, maxValue: 35})
//			.on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)))
			.on('set', function(value, callback, context)
			{
globals.log(yellow("Sending from Thermostat Cooling Threshold Temperature"));
				this.sendHS((that.config.temperatureUnit == "F") ? (Math.round((value * (9/5)) + 32)) : value)
				callback(null);
			} )
			.displayName = "Characteristic.CoolingThresholdTemperature";
	}
	if (that.config.heatingSetpointRef)
	{
		thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.setConfigValues(that.config)
			.setProps({minValue:0, maxValue: 35})
			//.on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)))
			.on('set', function(value, callback, context)
			{
				globals.log(yellow("Sending from Thermostat Heating Threshold Temperature"));
				this.sendHS((that.config.temperatureUnit == "F") ? (Math.round((value * (9/5)) + 32)) : value)
				callback(null);
			} )			
			.displayName = "Characteristic.HeatingThresholdTemperature";				
	}

	thermostatService.getCharacteristic(Characteristic.TargetTemperature)
		.on('set', (value, callback) =>
		{
			// globals.log(magenta("TargetTemperature SET Event called with value: " + value));
			var newTemp = value;
			var success = true;
			if(thermostatService.config.temperatureUnit == "F")
				{ newTemp = ((newTemp * (9/5)) +32).toFixed(0);	}
			
			// globals.log(magenta("TargetTemperature SET Event called with value: " + value + ", which is transmitted as: " + newTemp));

			switch(thermostatService.mode)
			{
				case 1: // heating
				{
					
					globals.sendHS(newTemp, thermostatService.config.heatingSetpointRef);
					break;
				}
				case 2: // cooling
				{
					globals.sendHS(newTemp, thermostatService.config.coolingSetpointRef);
					break;
				}
			}
			callback(null);
		});

	thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
		.updateValue(thermostatService.mode) // At startup, set control mode to be same as HomeSeer's
		// Use change event rather than 'set' event to activate only on a change.
		.on('change', (data) =>
			{
				// globals.log(yellow("* Debug * - Received TargetHeatingCoolingState CHANGE event value: " + data.newValue))
				
				thermostatService.mode = data.newValue;
				globals.sendHS(thermostatService.mode, that.config.controlRef);

				// After changing mode from Auto to Heating or Cooling, make sure to set TargetTemperature
				// To current heating or cooling value of HomeSeer device identified by coolingSetpointRef or heatingSetpointRef

				var heatingTemp = (that.config.heatingSetpointRef === undefined) ? 0 : globals.getHSValue(thermostatService.config.heatingSetpointRef);
				var coolingTemp = (that.config.coolingSetpointRef === undefined) ? 0 : globals.getHSValue(thermostatService.config.coolingSetpointRef);
				if (thermostatService.config.temperatureUnit == "F")
					{ 
						heatingTemp = (heatingTemp - 32 )* (5/9);
						coolingTemp = (coolingTemp - 32 )* (5/9);
					}
				// globals.log(yellow("Updating TargetHeatingCoolingState, Current target Heating / cooling Mode is: " + thermostatService.mode +", with new heating Temp: " + HSheatingTemp.toFixed(1) +	", new cooling Temp: " + HScoolingTemp.toFixed(1)));

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
			.on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.TargetRelativeHumidity)))
			.on('set', function(value, callback, context)
			{
				this.sendHS(value)
				callback(null);
			} )	
			;	
	}			
	
	
	thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits)
		.on('change', ()=> { globals.log(red("*Warning * -  Changing Hardware Display Units from iPhone Home Does Nothing!. Change must be made to HomeSeer config.json file to have effect."));})

	services.push(thermostatService);
	

			
	services.push(informationService);
	// 
}
