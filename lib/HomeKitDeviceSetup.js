//				.on('set', function(value, callback, context)); function called when a change originates from the iOS Home Application.  This should process the value receive from iOS to then send a new value to HomeSeer. 
// 				.on('change', function(data)) - Similar to .on('set' ...) - 'change' will trigger when the HomeKit Object's value was changed from the iOS application as well as when an updateValue was called.
//				.on('HSvalueChanged', function(newHSValue, HomeKitObject) - use this to process a change originating from HomeSeer. The value of HomeKitObject is either a HomeKit Service or a HomeKit Characteristic. This HomeKit Object is identified by the call .updateUsingHSReference(that.config.ref) which registers the object to receive a change originating from HomeSeer

'use strict'
var exports = module.exports;
var HSutilities = require("../lib/HomeSeerUtilities");

var globals = require("../index").globals;
var Listen = require("../lib/Setup Listener");
var Thermostats = require("../lib/Setup Thermostat");
var Sensors = require("../lib/Setup Sensor")
var Valves = require("../lib/Setup Valve")
var LocksDoorsWindows = require("../lib/Setup LocksDoorsWindows")
var LightsFansPlugs = require("../lib/Setup LightsFansPlugs")
var SecuritySystem = require("../lib/Setup SecuritySystem")

var HomeSeerData = require("../index.js").HomeSeer;


exports.setupServices = function (that, services) {
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
    //globals.log("DEBUG - Executing setupServices(obj, obj, obj, obj, obj, obj, obj)");
	
			Characteristic.prototype.updateUsingHSReference = function(reference) {
				HomeSeerData.registerObjectToReceiveUpdates(reference, this);
				return this;
			}
			Characteristic.prototype.setConfigValues = function(configuration, setAsRef) {
				if (configuration === undefined) return this;
				this.HSRef ??= (setAsRef || configuration.ref);
				this.config = configuration;
				return this;
			}

			Characteristic.prototype.findCommandValue = function(controlName) {
				var reference = this.HSRef || this.ref || this.config?.ref  || null; 
				if (reference === null) { 
						globals.log("*Programming Error* - Called Characteristic.prototype.findCommandValue with a null HomeSeer reference. Please report this on github.");
						return null
					};
				return globals.findCommandValue(reference, controlName)
			}


			Service.prototype.setConfigValues = function(configurationSet, setAsRef) {
				if (configurationSet === undefined) return this;
				this.config = configurationSet;
				this.HSRef ??= (setAsRef || this.config.ref || null);
				return this;
			}

			Service.prototype.setAsPrimary = function(value) {
				this.isPrimaryService = value ? value : true; 
				return this;
			}

			Service.prototype.updateUsingHSReference = function(reference) {
				HomeSeerData.registerObjectToReceiveUpdates(reference, this);
				return this;
			}	

			/////////////////////////////////////////////////////////////

	
	// Use the Z-Wave Model Info. from HomeSeer if the type is undefined!
	// as of version 2.3.12, these should never be undefined as the initial config.json checking routines
	// will assign a type!
	that.config.type ??= that.model;
	that.config.model ??= that.model;
	
	switch (that.config.type)  {
		case "ThermostatRoot":			
		case "Thermostat":
			Thermostats.setupThermostat(that, services)
			break;
			
		case "CarbonDioxideSensor":
		case "CarbonMonoxideSensor": 
		case "ContactSensor": 
		case "HumiditySensor": 
		case "LeakSensor": 
		case "LightSensor": 
		case "MotionSensor": 
		case "OccupancySensor": 
		case "SmokeSensor": 
		case "TemperatureSensor": 
			Sensors.setupSensor(that, services)
			break;
			
		case "Valve":
			Valves.setupValves(that, services)
			break;
		
		case "GarageDoorOpener": 
		case "BinaryWindowCovering": 
		case "BinaryWindow": 	
		case "VariableWindowCovering": 
		case "VariableWindow": 	
		case "Lock": 		
			LocksDoorsWindows.setupLocksDoorsWindows(that, services)
			break;

		case "Switch": 
		case "Outlet":
		case "LightSwitch":
		case "BinaryLight":
		case "BinaryFan":
		case "Lightbulb":
		case "MultilevelFan":
		case "DimmingLight":
			LightsFansPlugs.setupLightsFansPlugs(that, services)
			break;

		case "SecuritySystem":
			SecuritySystem.setupSecuritySystem(that, services)
			break;	
			
		default:
			throw new SyntaxError("Type not handle!" + JSON.stringify(that.config));
	}	
			
	// If batteryRef has been defined, then add a battery service.
	if (that.config.batteryRef && (that.config.batteryRef !== 0) )  {
		var batteryService = new Service.BatteryService();
			batteryService.setAsPrimary(false);

		batteryService.getCharacteristic(Characteristic.BatteryLevel)
			.updateUsingHSReference(that.config.batteryRef)
			.setConfigValues(that.config)
			.on('HSvalueChanged', (newHSValue, homekitObject) => { 
					homekitObject.updateValue( newHSValue > 100 ? 0 : newHSValue )
				})	
	
		batteryService
			.getCharacteristic(Characteristic.StatusLowBattery)
			.updateUsingHSReference(that.config.batteryRef)
			.setConfigValues(that.config)
			.on('HSvalueChanged', (newHSValue, homekitObject) => { 
				var lowBattery = ((newHSValue < globals.platformConfig.batteryThreshold) || (newHSValue > 100 ) ) ? true : false
					homekitObject.updateValue(lowBattery)
				})	;						
		
		services.push(batteryService);
	}
}
