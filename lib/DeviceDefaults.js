'use strict'
var globals = require("../index.js")
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

var exports = module.exports;

// typeProperites is an array used to check if a user has specified the correct configuration
// parameters in their config.json file. For each type, there are three sub-arrays, "Properties", "mandatory" and "setDefaults".
// The "Properties" sub-array list every valid property for a given type.
// The "mandatory" sub-array, list the names of the properties that 'must' be in config.json array by the time the function hasMandatoryProperties()
// is called. However, some of these 'mandatory' properties may have been filled-in by the "checkConfig()" function in HOmeSeerUtilities.js
// the 'setDefaults' array identifies properties for which the program will automatically set a default if it hasn't been provided by the user.
 
var typeProperties =
{
	"Switch":
	{
		Properties: 
		{
			"type": "Switch",	// Mandatory - User selected.
			"name":null,		// Automatically set to the Homeseer room name + device name if not user-specified
			"ref": 0,			// Mandatory  - User selected. Generally set to the reference # of the primary HomeSeer device for the given "type"
			"uuid_base": 0,		// Optional - Usually autoatically set to "Ref" + the reference #
			"batteryRef": 0,	// Optional. Identifies the related 'battery' device, if any. Plugin can automatically determine this for Z-Wave devices.
			"batteryThreshold": 25, // Optional - User can select the battery threshold, if desired.
			"onValue": 255,		// Optional. User RARELY needs to set this. Generally, only set if your device turns on using a value other than 255.
			"offValue": 0		// Optional. User RARELY needs to set this. Generally, only set if your device turns off using a value other than 0.
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["onValue", "offValue"]
	},
	
	"Outlet":
	{
		Properties:  // See description of parameters for "Switch" type.
		{
			"type": "Outlet",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"onValue": 255,
			"offValue": 0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["onValue", "offValue"]
	},
	
	"TemperatureSensor":
	{
		Properties:  // For 'type', 'name', 'ref', 'uuid_base', 'batteryRef', 'batteryThreshold' description, See "Switch" type.
		{
			"type": "TemperatureSensor",
			"name":null,
			"ref": 0,					// Mandatory - Set to Reference of the 'main' TemperatureSensor HomeSeer device.
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"temperatureUnit":"F",		// Optional. Temperature Unit used by HomeSeer. Choices are "F" or "C".
			"tamperRef":0				// Optional. Set to the tamper alarm device, if any.
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["temperatureUnit"]
	},
	
	"CarbonMonoxideSensor":
	{
		Properties:   // For parameter descriptions, see "TemperatureSensor" type, above.
		{
			"type": "CarbonMonoxideSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["offValues"]
	},
	
	"CarbonDioxideSensor":
	{
		Properties:      // For parameter descriptions, see "TemperatureSensor" type, above.
		{
			"type": "CarbonDioxideSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["offValues"]
	},
	
	"ContactSensor":
	{
		Properties:      // For parameter descriptions, see "TemperatureSensor" type, above.
		{
			"type": "ContactSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["offValues"]
	},
	
	"MotionSensor":     // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "MotionSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["offValues"]
	},
	
	"LeakSensor":   // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "LeakSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["offValues"]
	},
	
	"OccupancySensor":   // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "OccupancySensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["offValues"]
	},
	
	"SmokeSensor":   // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "SmokeSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"offValues":[0], 	// Values reported from HomeSeer when alert is 'off' / nothing triggered!
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["offValues"]
	},
	
	"LightSensor":   // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "LightSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"HumiditySensor":   // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "HumiditySensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"Lock":
	{
		Properties: 
		{
			"type": "Lock",
			"name":null,
			"ref": 0,			// Mandatory. Main reference for the lock device.
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 33,
			"lockValue":255,	// Value to command HomeSeer to lock door / reported when door is locked.
			"unlockValue": 0,	// Value to command HomeSeer to unlock door / reported when door is unlocked.
			
			"doorSensorRef":0,	// Optional. Set to ref # of contact sensor indicating if door is open or closed. 
								// As of iOS 11.3, and plugin 2.3.12, "doorSensorRef" doesn't do anything. In future versions of plugin, it may be used to inhibit door locking if the door isn't fully closed.
			
			// The following parameters are rarely ever user-set. These are only relevant if the "doorSensorRef" is used!
			"openValue": 255,		// Value reported by HomeSeerwhen door is open
			"closedValue": 0,		// Value reported by HomeSeerwhen door is open
			"openingValue": 254, 	// Value reported by HomeSeer when door is in the process of opening
			"closingValue": 252,	// Value reported by HomeSeer when door is in the process of closing
			"stoppedValue": 253		// Value reported by HomeSeer when door has stopped moving, but is neither open or closed.
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["lockValue", "unlockValue", "openValue", "closedValue", "openingValue", "closingValue", "stoppedValue"]
	},
	
	"Fan":
	{
		Properties: 
		{
			"type": "Fan",		// Parameters are similar to "Lightbulb" type. See that type, below.
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"can_dim": true,			
			"uses99Percent":true,  	   	
			"onValue": 255,
			"offValue": 0
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["onValue", "offValue"]
	},
	
	"Lightbulb":
	{
		Properties: 
		{
			"type": "Lightbulb",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"can_dim": true,   			// Code in HomeSeerUtilities.js will set this if it is undefined in config.json.
			"uses99Percent":true,    	// Code in HomeSeerUtilities.js will set this if it is undefined in config.json. Z-Wave uses a scale of 1-99 % for dimming. Setting this flag to "true" causes the 99% value to be displayed as 100% in HomeKit (so user doesn't question why lights don't turn on fully!).
			"onValue": 255,				// Leave at 255 ("On" for non-dimmers; "Last-Value" for dimmers) if using Z-Wave.
			"offValue": 0				// Rarely ever changed!
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["onValue", "offValue"]
	},
	
	"GarageDoorOpener":
	{
		Properties: 
		{
			"type": "GarageDoorOpener",
			"name":null,
			"ref": 0,			
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"obstructionRef": 0,
			"obstructionClearValues":[0,74], // An array of values to indicate obstruction is clear. This is a mapping from the Z-Wave barrier class. For some bizarre reason, some Z-Wave garage door openers send the value of 74 on the barrier class to indicate a low battery in the door sensor so if we get that value, ignore it. Any value not in this array is treated as indicating the door is obstructed.
			"openValue": 255,		// Rarely user-set! Value to command the door to open / reported when door is open
			"closedValue": 0,		// Rarely user-set! Value to command the door to open / reported when door is open
			"openingValue": 254, 	// Rarely user-set! Value reported by HomeSeer to indicate door is in the process of opening
			"closingValue": 252,	// Rarely user-set! Value reported by HomeSeer to indicate door is in the process of closing
			"stoppedValue": 253		// Rarely user-set! Value reported by HomeSeer to indicate door has stopped moving, but is neither open or closed.
			
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["obstructionClearValues", "openValue", "closedValue", "openingValue", "closingValue", "stoppedValue"]
	},
	
	"Window":
	{
		Properties: 
		{
			"type": "Window",
			"name": null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"openValue": 99,		// Value to open window covering fully.
			"closedValue": 0,		// Value to close window covering fully.
			"uses99Percent":true,    	// Code in HomeSeerUtilities.js will set this if it is undefined in config.json. Z-Wave uses a scale of 1-99% for percentages. Setting this flag to "true" causes the 99% value to be displayed as 100% in HomeKit.
			"binarySwitch":false,   // Code in HomeSeerUtilities.js will set this if it is undefined.
			"obstructionRef":0,		// Optional. Set if the WindowCovering has a sensor to detect if it is obstructed.
			"obstructionClearValues":[0] // Array of values indicating WindowCovering is not obstructed.
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["obstructionClearValues", "openValue", "closedValue"]
	},	
	
	"WindowCovering":
	{
		Properties: 
		{
			"type": "WindowCovering",
			"name": null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"openValue": 255,		// Value to open window covering fully.
			"closedValue": 0,		// Value to close window covering fully.
			"binarySwitch":false,   // Code in HomeSeerUtilities.js will set this if it is undefined.
			"uses99Percent":true,    	// Code in HomeSeerUtilities.js will set this if it is undefined in config.json. Z-Wave uses a scale of 1-99 % for dimming. Setting this flag to "true" causes the 99% value to be displayed as 100% in HomeKit.
			"obstructionRef":0,		// Optional. Set if the WindowCovering has a sensor to detect if it is obstructed.
			"obstructionClearValues":[0] // Array of values indicating WindowCovering is not obstructed.
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["obstructionClearValues", "openValue", "closedValue"]
	},
	
	"Thermostat":
	{
		Properties: 
		{
			"type": "Thermostat",
			"name":null,
			"ref": 0,					// Set to HomeSeer device reporting the current temperature.
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"temperatureUnit":"F",	
			"controlRef": 0,			// Set to HomeSeer device by which you select the Off / Heat / Cool / Auto state.
			"stateRef": 0,				// Set to HomeSeer device reporting the actually running state (Off / Heat / Cool). Sometimes this is the same as controlRef!
			"heatingSetpointRef": 0,	// Either "heatingSetpointRef" or "coolingSetpointRef" must be set (usually both are!)
			"coolingSetpointRef": 0,	// Either "heatingSetpointRef" or "coolingSetpointRef" must be set (usually both are!)
			"humidityRef": 0,			// optional. Set to HomeSeer device that provides a humidity report.
			"humidityTargetRef": 0		// optional. Set to HomeSeer device that allows you to set humidity setpoint.
		},
		
		mandatory: ["type", "name", "ref", "uuid_base", "controlRef", "stateRef"],
		
		setDefaults:["temperatureUnit"]
	},
	
	"SecuritySystem":
	{
		Properties: 
		{
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
			"alarmValues": [4]			// Array of Values reporting system is currently in an alarm triggered state.
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
	
	"Valve":
	{
		Properties: 
		{
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
			"minTime": 30			// Optional / Experimental - minimum time in Seconds when valve timer functionality is enabled.
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[	"valveType", "openValve", "closeValve",	"useTimer", "minTime" ]
	}
}

module.exports.typeProperties = typeProperties

/////////////////////////////////////////////////////////////

var hasValidType = function(configItem)
{
	if( (configItem.type === undefined) || (configItem.type == null)) return false;

	return ( typeProperties.hasOwnProperty(configItem.type))
}
module.exports.hasValidType = hasValidType


/////////////////////////////////////////////////////////////


var hasValidProperties = function(configItem)
{
	if( (configItem.type === undefined) || (configItem.type == null)) return false;
	if( (typeProperties[configItem.type] === undefined) || (typeProperties[configItem.type] == null) ) return false;

	var validPropertiesList = typeProperties[configItem.type].Properties;

	for (var property in configItem)
	{
		if (validPropertiesList.hasOwnProperty(property) == false) 
			{ 
				var error = red("\nconfig.json error: property: ") +cyan(property) 
					+ red(" is not a valid property for item named: " ) + cyan(configItem.name) 
					+ red(" of type: ") + cyan(configItem.type)
					+ red(". \nValid Properties for this type are: ")
					+ cyan (Object.getOwnPropertyNames(typeProperties[configItem.type].Properties) +"." )	
					
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
	if( (configItem.type === undefined) || (configItem.type == null)) return false;
	if( (typeProperties[configItem.type] === undefined) || (typeProperties[configItem.type] == null) ) return false;
	
	// If function variable 'property' is undefined, then set all the default listed in the type's setDefaults array.
	// Else, just set the default for the specific property that was specified.
	if (property === undefined) // check all defaults in the setDefaults list unless a specific property was identified.
	{	
		var defaultsList = typeProperties[configItem.type].setDefaults;

		for (var thisDefault in defaultsList)
		{
			var key = defaultsList[thisDefault]
			
			if (configItem[key] === undefined)
			{
				console.log("Item type: %s, named: %s :Adding property %s with value: %s", cyan(configItem.type), cyan(configItem.name), cyan(defaultsList[thisDefault]), cyan(typeProperties[configItem.type].Properties[ key ]));
				configItem[key] = typeProperties[configItem.type].Properties[ key ];
			}
		}
		
		// Set a battery threshold if the batteryRef is defined but the threshold isn't.
		if ((configItem.batteryRef != undefined) && (configItem.batteryThreshold === undefined) )
		{
			configItem.batteryThreshold = typeProperties[configItem.type].Properties["batteryThreshold"];
		}
		return true;
	}
	else // If a specific 'property' was named in the function call, just set its' default value.
	{
		if( typeProperties[configItem.type].Properties[property] != undefined)
		{
			if (configItem[property] === undefined)
			{
			configItem[property] = typeProperties[configItem.type].Properties[property];
			return true;
			}
		}
	}
	return false;
}

module.exports.setMissingDefaults = setMissingDefaults


/////////////////////////////////////////////////////////////

var hasMandatoryProperties = function(configItem)
{
	if( (configItem.type === undefined) || (configItem.type == null)) return false;
	if( (typeProperties[configItem.type] === undefined) || (typeProperties[configItem.type] == null) ) return false;
	
		var mandatory = typeProperties[configItem.type].mandatory;

		for (var index in mandatory)
		{
			var key = mandatory[index]
			
			if (configItem[key] === undefined)
			{
				console.log("Item named %s of type %s is missing its mandatory property: %s", cyan(configItem.name), cyan(configItem.type), cyan(key));
				return false;
			}
		}
		return true;

	return false;
}

module.exports.hasMandatoryProperties = hasMandatoryProperties





