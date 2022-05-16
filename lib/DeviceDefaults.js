'use strict'
var exports = module.exports;

// typeProperites is an array used to check if a user has specified the correct configuration
// parameters in their config.json file. For each type, there are three sub-arrays, "Properties", "mandatory" and "setDefaults".
// The "Properties" sub-array list every valid property for a given type.
// The "mandatory" sub-array, list the names of the properties that 'must' be in config.json array by the time the function hasMandatoryProperties()
// is called. However, some of these 'mandatory' properties may have been filled-in by the "checkConfig()" function in HOmeSeerUtilities.js
// the 'setDefaults' array identifies properties for which the program will automatically set a default if it hasn't been provided by the user.
 
var typeProperties =
{
	"ThermostatRoot": {
		Properties:  {
			"type": "ThermostatRoot",	// Mandatory - User selected.
			"name":null,		// Automatically set to the HomeSeer room name + device name if not user-specified
			"ref": 0,			// Mandatory  - User selected. Generally set to the reference # of the primary HomeSeer device for the given "type"
			"uuid_base": 0,		// Optional - Usually automatically set to "Ref" + the reference #
			"interface_name":null
		},	
		mandatory: ["type", "name", "ref", "uuid_base"],
	},
	
	"Switch": {
		Properties:  {
			"type": "Switch",	// Mandatory - User selected.
			"name":null,		// Automatically set to the Homeseer room name + device name if not user-specified
			"ref": 0,			// Mandatory  - User selected. Generally set to the reference # of the primary HomeSeer device for the given "type"
			"uuid_base": 0,		// Optional - Usually autoatically set to "Ref" + the reference #
			"interface_name":null,
			"onValue": 255,
			"offValue": 0,
			"batteryRef":null,
			"batteryThreshold": 25
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
	},
	
	"Speaker": {
		Properties:  {
			"type": "Speaker",	// Mandatory - User selected.
			"name":null,		// Automatically set to the Homeseer room name + device name if not user-specified
			"ref": 0,			// Mandatory  - User selected. Generally set to the reference # of the primary HomeSeer device for the given "type"
			"uuid_base": 0,		// Optional - Usually autoatically set to "Ref" + the reference #
			"interface_name":null,
			"batteryRef":null,
			"batteryThreshold": 25,
			"muteValue": -1,
			"unmuteValue": -2
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
	},
	
	"Outlet": {
		Properties: {
			"type": "Outlet",	// Mandatory - User selected.
			"name":null,		// Automatically set to the Homeseer room name + device name if not user-specified
			"ref": 0,			// Mandatory  - User selected. Generally set to the reference # of the primary HomeSeer device for the given "type"
			"uuid_base": 0,		// Optional - Usually autoatically set to "Ref" + the reference #
			"interface_name":null,
			"onValue":255,
			"offValue":0,
			"batteryRef":null,
			"batteryThreshold": 25
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
	},
	
	"LightSwitch": {
		Properties: {
			"type": "LightSwitch",	// Mandatory - User selected.
			"name":null,		// Automatically set to the Homeseer room name + device name if not user-specified
			"ref": 0,			// Mandatory  - User selected. Generally set to the reference # of the primary HomeSeer device for the given "type"
			"uuid_base": 0,		// Optional - Usually autoatically set to "Ref" + the reference #
			"interface_name":null,
			"onValue":255,
			"offValue":0,
			"batteryRef":null,
			"batteryThreshold": 25,
			"colorTemperatureRef":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
	},
	
	"BinaryLight": {
		Properties:  {
			"type": "BinaryLight",	// Mandatory - User selected.
			"name":null,		// Automatically set to the Homeseer room name + device name if not user-specified
			"ref": 0,			// Mandatory  - User selected. Generally set to the reference # of the primary HomeSeer device for the given "type"
			"uuid_base": 0,		// Optional - Usually autoatically set to "Ref" + the reference #
			"interface_name":null,
			"onValue":255,
			"offValue":0,
			"batteryRef":null,
			"batteryThreshold": 25,
			"colorTemperatureRef":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
	},	
	
	"TemperatureSensor": {
		Properties:{  // For 'type', 'name', 'ref', 'uuid_base', 'batteryRef', 'batteryThreshold' description, See "Switch" type.
			"type": "TemperatureSensor",
			"name":null,
			"ref": 0,					// Mandatory - Set to Reference of the 'main' TemperatureSensor HomeSeer device.
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"temperatureUnit": "F",
			"tamperRef":0,
			"minCelsius":-100,
			"maxCelsius":100,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["minCelsius", "maxCelsius"]
	},
	
	"CarbonMonoxideSensor": {
		Properties:{
			"type": "CarbonMonoxideSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0, 254], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["offValues"]
	},
	
	"CarbonDioxideSensor": {
		Properties:{
			"type": "CarbonDioxideSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0, 254], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["offValues"]
	},
	
	"ContactSensor":{
		Properties:  {
			"type": "ContactSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0, 23, 254], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["offValues"]
	},
	
	"MotionSensor": {
		Properties:{
			"type": "MotionSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0, 254], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["offValues"]
	},
	
	"LeakSensor":{
		Properties:{
			"type": "LeakSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0, 254], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["offValues"]
	},
	
	"OccupancySensor": {
		Properties: {
			"type": "OccupancySensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0, 254], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["offValues"]
	},
	
	"SmokeSensor":{
		Properties: {
			"type": "SmokeSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0, 254], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["offValues"]
	},
	
	"LightSensor": {
		Properties:{
			"type": "LightSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
	},
	
	"HumiditySensor":{
		Properties:{
			"type": "HumiditySensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
	},
	
	"Lock":{
		Properties: {
			"type": "Lock",
			"name":null,
			"ref": 0,			// Mandatory. Main reference for the lock device.
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 33,
			"lockValue":255,	// Value to command HomeSeer to lock door / reported when door is locked.
			"unlockValue": 0,	// Value to command HomeSeer to unlock door / reported when door is unlocked.
			"lockedStatusValues":[65, 129, 255], // An array of values to indicate door is locked. Examples values are those typically used for Z-Wave.
			"unlockedStatusValues":[0, 1, 16, 17, 32, 33, 64, 128], // An array of values to indicate door is unlocked.	 Examples values are those typically used for Z-Wave.
			"interface_name":null,
			"doorSensorRef":null,
			"doorSensorClosedValues": [0]	
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
	},
	
	"BinaryFan":{
		Properties: {
			"type": "BinaryFan",		// Parameters are similar to "Lightbulb" type. See that type, below.
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"interface_name":null,
			"onValue":255,
			"offValue":0,
			"batteryRef":null,
			"batteryThreshold": 25
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
	},	
	
	"MultilevelFan":{
		Properties: {
			"type": "MultilevelFan",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"levels": 99,
			"interface_name": null,
			"onValue":255,
			"offValue":0,
			"batteryRef":null,
			"batteryThreshold": 25
			
		},
		mandatory: ["type", "name", "ref", "uuid_base"]
	},
	
	"DimmingLight":{
		Properties: {
			"type": "DimmingLight",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"levels": 99,
			"interface_name": null,
			"onValue":255,
			"offValue":0,
			"batteryRef":null,
			"batteryThreshold": 25,
			"colorTemperatureRef":null
			
		},
		mandatory: ["type", "name", "ref", "uuid_base"]
	},
	
	"GarageDoorOpener":{
		Properties: {
			"type": "GarageDoorOpener",
			"name":null,
			"ref": 0,
			"batteryRef":0,
			"batteryThreshold":25,			
			"uuid_base": 0,
			"obstructionRef": 0,
			"obstructionClearValues":[0,74], // An array of values to indicate obstruction is clear. This is a mapping from the Z-Wave barrier class. For some bizarre reason, some Z-Wave garage door openers send the value of 74 on the barrier class to indicate a low battery in the door sensor so if we get that value, ignore it. Any value not in this array is treated as indicating the door is obstructed.
			"openValue": 255,		// Rarely user-set! Value to command the door to open / reported when door is open
			"closedValue": 0,		// Rarely user-set! Value to command the door to open / reported when door is open
			"openingValue": 254, 	// Rarely user-set! Value reported by HomeSeer to indicate door is in the process of opening
			"closingValue": 252,	// Rarely user-set! Value reported by HomeSeer to indicate door is in the process of closing
			"stoppedValue": 253,		// Rarely user-set! Value reported by HomeSeer to indicate door has stopped moving, but is neither open or closed.
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["obstructionClearValues"]
	},
	
	"BinaryWindow":{
		Properties: {
			"type": "Window",
			"name": null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"openValue": 255,		// Value to open window covering fully.
			"closedValue": 0,		// Value to close window covering fully.
			"obstructionRef":0,		// Optional. Set if the WindowCovering has a sensor to detect if it is obstructed.
			"obstructionClearValues":[0], // Array of values indicating WindowCovering is not obstructed.
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["obstructionClearValues"]
	},	
	
	"BinaryWindowCovering":{
		Properties: {
			"type": "WindowCovering",
			"name": null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"openValue": 255,		// Value to open window covering fully.
			"closedValue": 0,		// Value to close window covering fully.
			"obstructionRef":0,		// Optional. Set if the WindowCovering has a sensor to detect if it is obstructed.
			"obstructionClearValues":[0], // Array of values indicating WindowCovering is not obstructed.
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["obstructionClearValues"]
	},
	
	"VariableWindow":{
		Properties: {
			"type": "Window",
			"name": null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"openValue": 99,		// Value to open window covering fully.
			"closedValue": 0,		// Value to close window covering fully.
			"obstructionRef":0,		// Optional. Set if the WindowCovering has a sensor to detect if it is obstructed.
			"obstructionClearValues":[0], // Array of values indicating WindowCovering is not obstructed.
			"levels":99,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["obstructionClearValues"]
	},	
	
	"VariableWindowCovering":{
		Properties: {
			"type": "WindowCovering",
			"name": null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"openValue": 255,		// Value to open window covering fully.
			"closedValue": 0,		// Value to close window covering fully.
			"obstructionRef":0,		// Optional. Set if the WindowCovering has a sensor to detect if it is obstructed.
			"obstructionClearValues":[0], // Array of values indicating WindowCovering is not obstructed.
			"levels":99,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["obstructionClearValues"]
	},
	
	"Thermostat":{
		Properties:{
			"type": "Thermostat",
			"name":null,
			"ref": 0,					// Set to HomeSeer device reporting the current temperature.
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"temperatureUnit":"F",		// Should generally not be needed - only for plugins which fail to include the unit in their temperature scale.
			"controlRef": 0,			// Set to HomeSeer device by which you select the Off / Heat / Cool / Auto state.
			"stateRef": 0,				// Set to HomeSeer device reporting the actually running state (Off / Heat / Cool). Sometimes this is the same as controlRef!
			"heatingSetpointRef": 0,	// Either "heatingSetpointRef" or "coolingSetpointRef" must be set (usually both are!)
			"coolingSetpointRef": 0,	// Either "heatingSetpointRef" or "coolingSetpointRef" must be set (usually both are!)
			"humidityRef": 0,			// optional. Set to HomeSeer device that provides a humidity report.
			"humidityTargetRef": 0,		// optional. Set to HomeSeer device that allows you to set humidity setpoint.,
			"interface_name":null,
			"heatingRange": {"min":40 , "max": 70},
			"coolingRange": {"min":74, "max":99},
			"heatingMode": { "Off": 0, "Heat": 1, "Cool": 2, "Auto": 3},	
		},
		mandatory: ["type", "name", "ref", "uuid_base"]
	},
	
	"SecuritySystem":{
		Properties: {
			"type": "SecuritySystem", 
			"name":null,
			"ref": 0,					// Value of main HomeSeer reference for the Security System
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			
			"armStayValue": 0,			// Value sent to HomeSeer to indicate the system should be armed, with people home mode.
			"armAwayValue": 1,			// Value sent to HomeSeer to indicate the system should be armed, with nobody home.
			"armNightValue": 2,			// Value sent to HomeSeer to indicate the system should be armed, night mode.
			"disarmValue": 3,			// Value sent to HomeSeer to indicate the system should be disarmed.
			
			"armedStayValues": [0],		// Array of Values reporting system is armed, with people home mode.
			"armedAwayValues": [1],		// Array of Values reporting system is armed, with nobody home.
			"armedNightValues": [2],	// Array of Values reporting system is armed in home mode, night mode.
			"disarmedValues": [3],		// Array of Values reporting system is disarmed.
			"alarmValues": [4],			// Array of Values reporting system is currently in an alarm triggered state.,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:[	"armStayValue",
						"armAwayValue",
						"armNightValue",
						"disarmValue",
						"armedAwayValues",
						"armedStayValues",
						"armedNightValues",
						"disarmedValues",
						"alarmValues"
					]
	},
	
	"Valve":{
		Properties:{
			"type": "Valve",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"valveType": 0,			// Valve type. 0 = , 1 = , 2 = , 3 =
			"openValve": 255,		// Value sent to open the valve
			"closeValve": 0,		// Value sent to close the valve
			"useTimer": false,		// Optional / Experimental - enables valve timer functionality. Set timer from devices "details" page.
			"minTime": 30,			// Optional / Experimental - minimum time in Seconds when valve timer functionality is enabled.,
			"interface_name":null
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["valveType", "useTimer", "minTime" ]
	}
}

module.exports.typeProperties = typeProperties

/////////////////////////////////////////////////////////////

var hasValidType = function(configItem) {
	if( (configItem.type === undefined) || (configItem.type === null)) return false;

	return ( typeProperties.hasOwnProperty(configItem.type))
}
module.exports.hasValidType = hasValidType

/////////////////////////////////////////////////////////////

var hasValidProperties = function(configItem)
{
	if( (configItem.type === undefined) || (configItem.type === null)) return false;

	var validPropertiesList = typeProperties[configItem.type]?.Properties;

	for (var property in configItem) {
		if (validPropertiesList.hasOwnProperty(property) == false)  { 
				var error = `config.json error: property: ${(property)} is not a valid property for item named: ${(configItem.name)} of type: ${(configItem.type)}. \nValid Properties for this type are: ${ (Object.getOwnPropertyNames(typeProperties[configItem.type].Properties))}.`	
					
				throw new SyntaxError(error);
				return false; 
			}
	}
	return true;
}

module.exports.hasValidProperties = hasValidProperties

/////////////////////////////////////////////////////////////

var setMissingDefaults = function(configItem, property)
{
	if( (configItem.type === undefined) || (configItem.type === null)) return false;
	
	if( property) {  //if a specific property was named, just set that and return
		configItem[property] ??= typeProperties[configItem.type].Properties[property];
		return
	}
	
	// Else set all the defaults in the setDefaults list
	typeProperties[configItem.type].setDefaults?.forEach((nameOfDefaultKey) => {
		configItem[nameOfDefaultKey] ??= typeProperties[configItem.type].Properties[nameOfDefaultKey]
	});
	
	// Set a battery threshold if the batteryRef is defined but the threshold isn't.
	if (configItem.batteryRef) {
		configItem.batteryThreshold ??= typeProperties[configItem.type].Properties["batteryThreshold"];
	}
}

module.exports.setMissingDefaults = setMissingDefaults

/////////////////////////////////////////////////////////////

var hasMandatoryProperties = function(configItem) {
	if( (configItem.type === undefined) || (configItem.type === null)) return false;
	
	return typeProperties[configItem.type]?.mandatory.every((key) => { return (key in configItem) } )
}

module.exports.hasMandatoryProperties = hasMandatoryProperties
