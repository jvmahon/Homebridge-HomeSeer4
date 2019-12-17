{
	"type": "Switch",	// Mandatory - User selected.
	"name":null,		// Automatically set to the Homeseer room name + device name if not user-specified
	"ref": 0,			// Mandatory  - User selected. Generally set to the reference # of the primary HomeSeer device for the given "type"
	"uuid_base": 0,		// Optional - Usually automatically set to "Ref" + the reference #
	"batteryRef": 0,	// Optional. Identifies the related 'battery' device, if any. Plugin can automatically determine this for Z-Wave devices.
	"batteryThreshold": 25, // Optional - User can select the battery threshold, if desired.
	"onValue": 255,		// Optional. User RARELY needs to set this. Generally, only set if your device turns on using a value other than 255.
	"offValue": 0		// Optional. User RARELY needs to set this. Generally, only set if your device turns off using a value other than 0.
},

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

{
	"type": "TemperatureSensor",
	"name":null,
	"ref": 0,					// Mandatory - Set to Reference of the 'main' TemperatureSensor HomeSeer device.
	"uuid_base": 0,
	"batteryRef": 0,
	"batteryThreshold": 25,
	"tamperRef":0				// Optional. Set to the tamper alarm device, if any.
},

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

{
	"type": "LightSensor",
	"name":null,
	"ref": 0,
	"uuid_base": 0,
	"batteryRef": 0,
	"batteryThreshold": 25,
	"tamperRef":0
},

{
	"type": "HumiditySensor",
	"name":null,
	"ref": 0,
	"uuid_base": 0,
	"batteryRef": 0,
	"batteryThreshold": 25,
	"tamperRef":0
},

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

{
	"type": "Fan",		// Parameters are similar to "Lightbulb" type. See that type, below.
	"name":null,
	"ref": 0,
	"uuid_base": 0,
	"batteryRef": 0,
	"batteryThreshold": 25,
	"can_dim": true,			
	"onValue": 255,
	"offValue": 0
},

{
	"type": "Lightbulb",
	"name":null,
	"ref": 0,
	"uuid_base": 0,
	"batteryRef": 0,
	"batteryThreshold": 25,
	"can_dim": true,   			// Code in HomeSeerUtilities.js will set this if it is undefined in config.json.
	"onValue": 255,				// Leave at 255 ("On" for non-dimmers; "Last-Value" for dimmers) if using Z-Wave.
	"offValue": 0				// Rarely ever changed!
},

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

{
	"type": "Window",
	"name": null,
	"ref": 0,
	"uuid_base": 0,
	"batteryRef": 0,
	"batteryThreshold": 25,
	"openValue": 99,		// Value to open window covering fully.
	"closedValue": 0,		// Value to close window covering fully.
	"binarySwitch":false,   // Code in HomeSeerUtilities.js will set this if it is undefined.
	"obstructionRef":0,		// Optional. Set if the WindowCovering has a sensor to detect if it is obstructed.
	"obstructionClearValues":[0] // Array of values indicating WindowCovering is not obstructed.
},

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
	"obstructionRef":0,		// Optional. Set if the WindowCovering has a sensor to detect if it is obstructed.
	"obstructionClearValues":[0] // Array of values indicating WindowCovering is not obstructed.
},

{
	"type": "Thermostat",
	"name":null,
	"ref": 0,					// Set to HomeSeer device reporting the current temperature.
	"uuid_base": 0,
	"batteryRef": 0,
	"batteryThreshold": 25,
	"controlRef": 0,			// Set to HomeSeer device by which you select the Off / Heat / Cool / Auto state.
	"stateRef": 0,				// Set to HomeSeer device reporting the actually running state (Off / Heat / Cool). Sometimes this is the same as controlRef!
	"heatingSetpointRef": 0,	// Either "heatingSetpointRef" or "coolingSetpointRef" must be set (usually both are!)
	"coolingSetpointRef": 0,	// Either "heatingSetpointRef" or "coolingSetpointRef" must be set (usually both are!)
	"humidityRef": 0,			// optional. Set to HomeSeer device that provides a humidity report.
	"humidityTargetRef": 0		// optional. Set to HomeSeer device that allows you to set humidity setpoint.
},


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
}


