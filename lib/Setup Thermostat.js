'use strict'
// .on('set', function(value, callback, context)); function called when a change originates from the iOS Home Application.  This should process the value receive from iOS to then send a new value to HomeSeer. 
// .on('change', function(data)) - Similar to .on('set' ...) - 'change' is triggered either when there is an update originating from the iOS Home Application or else when you use updateValue from hap-nodejs.
// .on('HSvalueChanged', function(newHSValue, HomeKitObject) - use this to process a change originating from HomeSeer. The value of HomeKitObject is either a HomeKit Service or a HomeKit Characteristic. This HomeKit Object is identified by the call .updateUsingHSReference(newDevice.config.ref) which registers the object to receive a change originating from HomeSeer

var exports = module.exports;

var globals = require("../index").globals;
var HomeSeerData = require("../index.js").HomeSeer;

function getThermostatAssociatedDevice(rootReference) {
	var RootStatusInfo = [];
	RootStatusInfo = HomeSeerData.getStatusData(rootReference)
	
	if ((RootStatusInfo === null) || (RootStatusInfo === undefined) ) {
			throw new SyntaxError(`You specified HomeSeer root reference: ${rootReference} that is not a valid HomeSeer reference. Check your config.json file and fix!`)
		}
	
	if (	(RootStatusInfo.device_type.Device_API 		!= 512) 
		|| 	(RootStatusInfo.device_type.Device_Type 	!= 8) 
		|| 	(RootStatusInfo.device_type.Device_SubType 	!= 0)
		) {
			throw new SyntaxError(`You specified HomeSeer reference: ${RootStatusInfo.ref} as a Thermostat Root Device, but it appears not to be the root device for a Thermostat. Check your config.json file and fix!`)
		}
		return RootStatusInfo.associated_devices
}

function identifyThermostatData(thermostatRoot, allAccessories)
{
	var associatedDevices = getThermostatAssociatedDevice(thermostatRoot.ref)

	var configuration = [];;
	
	for(var currentDevice of associatedDevices) {
		var currentDeviceStatusInfo = HomeSeerData.getStatusData(currentDevice);

		switch(currentDeviceStatusInfo.device_type.Device_Type) {
			case 0: // Undefined Status Device
				break;
			case 1: // Operating State
				configuration.stateRef = currentDeviceStatusInfo.ref // 1:0
				break;
			case 2: // Temperature
				switch(currentDeviceStatusInfo.device_type.Device_SubType) {
					case 0: // for the Nest Interface
						if (currentDeviceStatusInfo.interface_name != "Nest") {
							globals.log("*Warning* - Found a Temperature device of Type 2, Subtype:0 but device is not using the 'Nest' thermostat plugin. Setting of 'ref' value may be incorrect. You may need to use the 'complex' configuration procedure. Please report this as an issue on github so a correction can be made. Also see wiki entry on Thermostats for additional information. Interface name is: " + currentDeviceStatusInfo.interface_name)
						}
						configuration.ref = currentDeviceStatusInfo.ref // 2:1
						break;
					case 1: // for the Z-Wave interface or Honeywell WiFi Thermostat
						if ((currentDeviceStatusInfo.interface_name != "Z-Wave") && (currentDeviceStatusInfo.interface_name != "Honeywell WiFi Thermostat")) {
							globals.log("*Warning* - Found a Temperature device of Type 2, Subtype:1 but device is not using the 'Z-Wave' or 'Honeywell WiFi Thermostat' plugin. Setting of 'ref' value may be incorrect. You may need to use the 'complex' configuration procedure. Please report this as an issue on github so a correction can be made.  Also see wiki entry on Thermostats for additional information. Interface name is: " + currentDeviceStatusInfo.interface_name)
						}
						
						configuration.ref = currentDeviceStatusInfo.ref // 2:1
						break;
					case 5: 
						configuration.humidityRef = currentDeviceStatusInfo.ref // 2:5
						break;
				}
				break;	
			case 3: // Fan Mode Status
				configuration.controlRef = currentDeviceStatusInfo.ref; // 3:1
				break;
			case 4: // Fan Mode (On, Auto, Circulate)
			case 5:	// Fan Status
				break;
			case 6: // Setpoints
				switch(currentDeviceStatusInfo.device_type.Device_SubType) {
					case 1: // Heating Setpoints
						configuration.heatingSetpointRef = currentDeviceStatusInfo.ref; // 6:1
						break;
					case 2: // Cooling Setpoint
						configuration.coolingSetpointRef = currentDeviceStatusInfo.ref; // 6:2
						break;
				}
				break;
			case 8: // Hold Mode
			case 9: // Operating Mode
			case 10: // Additional Temperature
			case 16: // Temperature for the GoogleNest HS4 Interface
				switch(currentDeviceStatusInfo.device_type.Device_SubType) {
						case 0: // for the Nest Interface
							if (currentDeviceStatusInfo.interface_name != "GoogleNest") {
								globals.log("*Warning* - Found a Temperature device of Type 2, Subtype:0 but device is not using the 'Nest' thermostat plugin. Setting of 'ref' value may be incorrect. You may need to use the 'complex' configuration procedure. Please report this as an issue on github so a correction can be made. Also see wiki entry on Thermostats for additional information. Interface name is: " + currentDeviceStatusInfo.interface_name)
							}
							configuration.ref = currentDeviceStatusInfo.ref // 2:1
							break;
						case 5: 
							configuration.humidityRef = currentDeviceStatusInfo.ref // 2:5
							break;
						case 6: // status of HVAC
							configuration.stateRef = currentDeviceStatusInfo.ref;
							break;
				}
			case 17: // Setpoints for the GoogleNest HS4
				switch(currentDeviceStatusInfo.device_type.Device_SubType) {
					case 1: // Heating Setpoints
						configuration.heatingSetpointRef = currentDeviceStatusInfo.ref; // 6:1
						break;
					case 2: // Cooling Setpoint
						configuration.coolingSetpointRef = currentDeviceStatusInfo.ref; // 6:2
						break;
					case 3: // Controlling HVAC
						configuration.controlRef = currentDeviceStatusInfo.ref;
						break;
				}
				break;
			default:
				break;
		}
	}

	thermostatRoot.config = configuration;
	return configuration;
}

///////////////////////////////////////////////////////////////////////////

exports.setupThermostat = function (newDevice, services) {
	// 'newDevice' contains the config information for the current accessory
	
	if (HomeSeerData.isRootDevice(newDevice.ref)) {
		globals.log("Thermostat identified by a root device. Attempting to automatically determine its parameters.");
		newDevice.config.type = "ThermostatRoot";
		identifyThermostatData(newDevice, services)
	}
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;

	let deviceConfig = {...newDevice.config};	
		
	globals.log("Setting up a Thermostat with configuration values: " + JSON.stringify(deviceConfig));
	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, newDevice.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + newDevice.config.type + " ref " + newDevice.ref);
		
	if ( isNaN(deviceConfig.ref) 
		|| ( isNaN(deviceConfig.heatingSetpointRef) && isNaN(deviceConfig.coolingSetpointRef) )
		|| isNaN(deviceConfig.controlRef )
		|| isNaN(deviceConfig.stateRef)		)
	{
		throw new SyntaxError("Incorrect configuration data. Missing one of 'ref', 'controlRef', 'stateRef', and at least one of 'coolingSetpointRef' or 'heatingSetpointRef'. ");
	}

	if (deviceConfig.heatingMode === undefined) {
		deviceConfig.heatingMode = { "Off": undefined, "Heat": undefined, "Cool": undefined, "Auto": undefined}
		
		deviceConfig.heatingMode.Off  = HomeSeerData.findCommandValue(deviceConfig.controlRef, HomeSeerData.controlUses.ThermModeOff)
		deviceConfig.heatingMode.Heat = HomeSeerData.findCommandValue(deviceConfig.controlRef, HomeSeerData.controlUses.ThermModeHeat)
		deviceConfig.heatingMode.Cool = HomeSeerData.findCommandValue(deviceConfig.controlRef, HomeSeerData.controlUses.ThermModeCool)
		deviceConfig.heatingMode.Auto = HomeSeerData.findCommandValue(deviceConfig.controlRef, HomeSeerData.controlUses.ThermModeAuto)
		// deviceConfig.heatingMode = { "Off": 0, "Heat": 1, "Cool": 2, "Auto": 3}
	}

	var thermostatService = new Service.Thermostat();

	// thermostatService.thermostatType 0 = Invalid; 1 = Cooling Only;  2 = Heating Only; 3 = Heating and Cooling with Auto Changeover!
	thermostatService.thermostatType = 0;
		if ( (deviceConfig.heatingSetpointRef !== undefined) && (deviceConfig.heatingSetpointRef != 0)) {
				thermostatService.thermostatType = thermostatService.thermostatType + 1;
			};
		if ( (deviceConfig.coolingSetpointRef !== undefined) && (deviceConfig.coolingSetpointRef != 0)) {
				thermostatService.thermostatType = thermostatService.thermostatType + 2;
			};
			
			var statusField = HomeSeerData.getStatusData(deviceConfig.ref).status;
		
			switch(true) {
				case 	statusField.endsWith("F"): 
				case 	statusField.endsWith(String.fromCharCode(8457)): // The unicode Symbol for Degrees F
				case  	deviceConfig.temperatureUnit == "F": 
						thermostatService.temperatureUnit = "F"; 	
						thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(1);
						break; 
				case  	statusField.endsWith("C"): 
				case 	statusField.endsWith(String.fromCharCode(8451)): // The unicode Symbol for Degrees C
				case  	deviceConfig.temperatureUnit == "C": 
						thermostatService.temperatureUnit = "C"; 
						thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(0);
						break; 
				default: 
					throw new RangeError("Error setting up Thermostat. Scale is not Celsius or Fahrenheit"); 
			}

	// If either cooling or heating setpoint changes, or the mode, send entire service block for analysis and update!
	thermostatService
		.setConfigValues(deviceConfig)
		.updateUsingHSReference(deviceConfig.coolingSetpointRef) // HomeSeer cooling setpoint changes
		.updateUsingHSReference(deviceConfig.heatingSetpointRef) // HomeSeer heating setpoint changeid
		.updateUsingHSReference (deviceConfig.controlRef) // HomeSeer Thermostat Mode Changes - TargetHeatingCoolingState
		.updateUsingHSReference (deviceConfig.stateRef)
		thermostatService.HSRef = null; //there is no one defined HSRef for this object, so set it to null as  a way of tracing errors if any code tries to rely on HSREf !
		
		switch(thermostatService.thermostatType) { 
			case 1: // Thermostat Supports Heating 
				thermostatService.getCharacteristic(Characteristic.TargetTemperature)
					.setConfigValues(deviceConfig);
				thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
					.setProps({validValues: [0, 1]});	
				break 
			case 2: // Thermostat Supports Cooling 
				thermostatService.getCharacteristic(Characteristic.TargetTemperature)
					.setConfigValues(deviceConfig);
				thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
					.setProps({validValues: [0, 2]});
				break; 
			case 3: // Thermostat Has An Auto Mode 
				thermostatService.getCharacteristic(Characteristic.TargetTemperature)
					.setConfigValues(deviceConfig);

				thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
					.setConfigValues(deviceConfig, deviceConfig.heatingSetpointRef);
					
				thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
					.setConfigValues(deviceConfig, deviceConfig.coolingSetpointRef);
					
				break; 
			case 0: // invalid Thermostat Type
			default: // This One is for Errors 
				throw new SyntaxError("Error - Invalid Thermostat Type. This may be result of failure to specify heating and cooling reference devices in your config.json file. Type should be 1-3. Type is: " + thermostatService.thermostatType);
				break; 
		}		
	
		thermostatService
			.on('HSvalueChanged', (newHSValue, HomeKitObject) => {
				// This is called if there is a change from HomeSeer to a heating or cooling setpoint or to the mode.
				// Calculate the Current Temperature variables
				let targetTemperature = null;
				let heatingTemp = null;
				let coolingTemp = null;
				
				var targetCharacteristic;
				
					// Current Heating and Cooling State Is Update Only
					
				HomeKitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState)
					.updateValue(HomeSeerData.getValue(HomeKitObject.config.controlRef));
					
				HomeKitObject.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
					.updateValue(HomeSeerData.getValue(HomeKitObject.config.stateRef));

				var currentControlMode = HomeSeerData.getValue(HomeKitObject.config.controlRef)
		
				// Type of Thermostat
				switch(currentControlMode)
				{ 
					case 0: // Off 
						HomeKitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(0);	
						break; 
					case 1: // Thermostat Only Supports Heating 
						heatingTemp = parseFloat(HomeSeerData.getValue(HomeKitObject.config.heatingSetpointRef));
						if (thermostatService.temperatureUnit == "F") { 
							// Convert Fahrenheit to Celsius
							heatingTemp = ((heatingTemp - 32 )* (5/9));
						}
						
						targetCharacteristic = HomeKitObject.getCharacteristic(Characteristic.TargetTemperature)
						heatingTemp =  Math.min(Math.max(heatingTemp, targetCharacteristic.props.minValue), targetCharacteristic.props.maxValue )		

						HomeKitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(1);	
						targetCharacteristic.updateValue(heatingTemp)

						break; 
					case 2: // Thermostat Only Supports Cooling 
						coolingTemp = parseFloat(HomeSeerData.getValue(HomeKitObject.config.coolingSetpointRef));
						if (thermostatService.temperatureUnit == "F") { 
							// Convert Fahrenheit to Celsius
							coolingTemp = ((coolingTemp - 32 )* (5/9));
						}
						
						targetCharacteristic = HomeKitObject.getCharacteristic(Characteristic.TargetTemperature)
						coolingTemp =  Math.min(Math.max(coolingTemp, targetCharacteristic.props.minValue), targetCharacteristic.props.maxValue )	
							
						HomeKitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(2);	
						targetCharacteristic.updateValue(coolingTemp)

						break; 
					case 3: // Thermostat Has An Auto Mode
					case 4: // Nest "Eco" mode is like Auto. 
						 heatingTemp = parseFloat(HomeSeerData.getValue(HomeKitObject.config.heatingSetpointRef));
						 coolingTemp = parseFloat(HomeSeerData.getValue(HomeKitObject.config.coolingSetpointRef));
						
						if (thermostatService.temperatureUnit == "F") { 
							// Convert Fahrenheit to Celsius
							heatingTemp = ((heatingTemp - 32 )* (5/9));
							coolingTemp = ((coolingTemp - 32 )* (5/9));
						}
						heatingTemp =  Math.min(Math.max(heatingTemp, HomeKitObject.getCharacteristic(Characteristic.HeatingThresholdTemperature).props.minValue), HomeKitObject.getCharacteristic(Characteristic.HeatingThresholdTemperature).props.maxValue )	
						
						coolingTemp =  Math.min(Math.max(coolingTemp, HomeKitObject.getCharacteristic(Characteristic.CoolingThresholdTemperature).props.minValue), HomeKitObject.getCharacteristic(Characteristic.CoolingThresholdTemperature).props.maxValue )	


						HomeKitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(3);	
						HomeKitObject.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(heatingTemp)
						HomeKitObject.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(coolingTemp)							
						break; 
					default: // This One is for Errors 
						throw new SyntaxError("Error - Invalid Thermostat Type of: " + currentControlMode)
						break; 
				}

				// Does HomeSeer say the mode is Off, Heat, Cool, or Auto
				// Set that mode into iOS
			
				// Do nothing if turned off!
				if (currentControlMode == 0) return;
			})	

	if ((deviceConfig.coolingSetpointRef) && (deviceConfig.heatingSetpointRef) ) 
	{
		thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.on('set', (value, callback) => {
			
				var temperature = parseFloat(value);
				if (thermostatService.temperatureUnit == "F") {
					temperature = (temperature * 1.8) + 32;
					temperature = parseFloat(temperature).toFixed(0);
				}
				
				HomeSeerData.sendDataValue(deviceConfig.coolingSetpointRef, temperature);
				
				callback(null);
			} )

		thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.on('set', (value, callback) => {
				var temperature = parseFloat(value);
				if (thermostatService.temperatureUnit == "F") {
					temperature = (temperature * 1.8) + 32;
					temperature = parseFloat(temperature).toFixed(0);
				}
				
				HomeSeerData.sendDataValue(deviceConfig.heatingSetpointRef, temperature);
				
				callback(null);
			} )			
	}

	thermostatService.getCharacteristic(Characteristic.TargetTemperature)
		.on('set', (value, callback) => {

			var temperature = parseFloat(value);
			if (thermostatService.temperatureUnit == "F") {
				temperature = (temperature * 1.8) + 32;
					temperature = parseFloat(temperature).toFixed(0);
			}
			
			var currentThermostatMode = HomeSeerData.getValue(deviceConfig.controlRef)

			switch(currentThermostatMode) {
				case 1: // heating 
					HomeSeerData.sendDataValue(deviceConfig.heatingSetpointRef, temperature)					
					break; 
				case 2: // cooling 
					HomeSeerData.sendDataValue(deviceConfig.coolingSetpointRef, temperature)
					break; 
			}
			callback(null);
		});
	
	thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
		.setConfigValues(deviceConfig);
			
	thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
		.on('set', (value, callback) => {
				switch(value) {
					case 0: 
							HomeSeerData.sendDataValue(deviceConfig.controlRef, parseInt(deviceConfig.heatingMode.Off), true); 
							break;
					case 1: 
							HomeSeerData.sendDataValue(deviceConfig.controlRef, parseInt(deviceConfig.heatingMode.Heat), true);
							break
					case 2: 
							HomeSeerData.sendDataValue(deviceConfig.controlRef, parseInt(deviceConfig.heatingMode.Cool), true);
							break;
					case 3:
							HomeSeerData.sendDataValue(deviceConfig.controlRef, parseInt(deviceConfig.heatingMode.Auto), true);
							break;
				}
				// HomeSeerData.sendDataValue(deviceConfig.controlRef, value, true);

				// After changing mode from Auto to Heating or Cooling, make sure to set TargetTemperature
				// To current heating or cooling value of HomeSeer device identified by coolingSetpointRef or heatingSetpointRef

				var heatingTemp = (deviceConfig.heatingSetpointRef === undefined) ? undefined : HomeSeerData.getValue(thermostatService.config.heatingSetpointRef);
				var coolingTemp = (deviceConfig.coolingSetpointRef === undefined) ? undefined : HomeSeerData.getValue(thermostatService.config.coolingSetpointRef);
				if (thermostatService.temperatureUnit == "F") { 
						// This should probably do a check for undefined!
						heatingTemp = (heatingTemp === undefined) ? undefined : ((heatingTemp - 32 )* (5/9));
						coolingTemp = (coolingTemp === undefined) ? undefined : ((coolingTemp - 32 )* (5/9));
				}
				
				switch(value) {
					case(0): // mode Off
							break;
					case(1): //mode heating
							thermostatService.getCharacteristic(Characteristic.TargetTemperature).updateValue(heatingTemp); 
							break
					case(2): // mode cooling
							thermostatService.getCharacteristic(Characteristic.TargetTemperature).updateValue(coolingTemp); 
							break;
					case(3): // mode auto
							thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(coolingTemp);
							thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(heatingTemp); 
							break;
				}
				callback(null);
			}
		)

	
	// The following code is now 'dead' code as the range of properties is fixed, above, so you can't actually change it! See lines 155-175.
	thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits)
		 .on('set', (value, callback) => { 	
				globals.log("*Warning * -  Changing Hardware Display Units from iPhone Home Does Nothing!. To change the units used by the iOS Home App, you need to change it in the iOS 'Language and Region' settings. To change the units used by HomeSeer, make the change in the HomeSeer Tools - Setup menu. Continuing to use: " + thermostatService.temperatureUnit);
			
				callback(null);
			}) 
		.on('change', (data) => { 	
				var timer;
				switch(true) {
					case (data.newValue == 0) && (thermostatService.temperatureUnit == "F"): 
						globals.log("Thermostat Hardware Display Unit Changed to Celsius, but HomeSeer is set to Fahrenheit. Resetting Hardware Display Unit to Fahrenheit.");
						timer = setTimeout( () => {	
								thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(1);	 }, 3000)
						break;
					case  (data.newValue == 1) && (thermostatService.temperatureUnit == "C"): 
						globals.log("Thermostat Hardware Display Unit Changed to Fahrenheit, but HomeSeer is set to Celsius. Resetting Hardware Display Unit to Celsius.");
						timer = setTimeout( () => {	thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(1);				
							}, 3000)
						break;
				}
			})
		
	////////   Items Below This Line Receive Updates from HomeSeer, but are not changed from iOS //////////////
	
	//   Humidity is update Only!
	if (deviceConfig.humidityRef) {
		thermostatService.addCharacteristic(Characteristic.CurrentRelativeHumidity)
			.updateUsingHSReference(deviceConfig.humidityRef)
			.setConfigValues(deviceConfig)
			.on('HSvalueChanged', (newHSValue, thisCharacteristic) => { 
					thisCharacteristic.updateValue(newHSValue)
				});	
	}
		
	// Current Temperature Is Update Only		
	thermostatService.getCharacteristic(Characteristic.CurrentTemperature)
		.setProps({minValue:-20, maxValue: 50})
		.updateUsingHSReference(deviceConfig.ref)
		.setConfigValues(deviceConfig);
		
	thermostatService.getCharacteristic(Characteristic.CurrentTemperature)			
		.on('HSvalueChanged', (newHSValue, thisCharacteristic) => {
				var newTemp = newHSValue;
				if (thermostatService.temperatureUnit == "F") { 
						newTemp = ((newHSValue - 32 )* (5/9));
					}
				
				thisCharacteristic.updateValue(newTemp);
		})		
	services.push(informationService);
	services.push(thermostatService);
}
