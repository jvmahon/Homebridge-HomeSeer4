'use strict';

// Remember to add platform to config.json. 
//
// You can get HomeSeer Device References by clicking a HomeSeer device name, then 
// choosing the Advanced Tab.
//
// The uuid_base parameter is valid for all events and accessories. 
// If you set this parameter to some unique identifier, the HomeKit accessory ID will be based on uuid_base instead of the accessory name.
// It is then easier to change the accessory name without messing the HomeKit database.
// 
//
// Example:
// "platforms": [
//     {
//         "platform": "HomeSeer",              // Required
//         "name": "HomeSeer",                  // Required
//         "host": "http://192.168.3.4:81",     // Required - If you did setup HomeSeer authentication, use "http://user:password@ip_address:port"
//
//         "events":[                           // Optional - List of Events - Currently they are imported into HomeKit as switches
//            {
//               "eventGroup":"My Group",       // Required - The HomeSeer event group
//               "eventName":"My On Event",     // Required - The HomeSeer event name
//               "offEventGroup":"My Group",    // Optional - The HomeSeer event group for turn-off <event>
//               "offEventName":"My Off Event", // Optional - The HomeSeer event name for turn-off <event>
//               "name":"Test",                 // Optional - HomeSeer event name is the default
//               "uuid_base":"SomeUniqueId"     // Optional - HomeKit identifier will be derived from this parameter instead of the name
//            }
//         ],
//
//         "accessories":[                      // Required - List of Accessories
//            {
//              "ref":8,                        // Required - HomeSeer Device Reference (To get it, select the HS Device - then Advanced Tab) 
//              "type":"Lightbulb",             // Required - Lightbulb (currently not enforced, but may be in future)
//              "name":"My Light",              // Optional - HomeSeer device name is the default
//              "can_dim":true,                 // Optional - true is the default - false for a non dimmable lightbulb
//              "uuid_base":"SomeUniqueId"     // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !
//            },
//            {
//              "ref":8,                        // Required - HomeSeer Device Reference (To get it, select the HS Device - then Advanced Tab) 
//              "type":"Fan",             		// Required for a Fan
//              "name":"My Fan",              	// Optional - HomeSeer device name is the default
//              "can_dim":true,                 // Optional - true is the default - false for fixed speed fan.
//              "uuid_base":"SomeUniqueId"     // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !
//            },
//            {
//              "ref":58,                       // This is a controllable outlet
//              "type":"Outlet"
//              "uuid_base":"SomeUniqueId"     // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !

//            },
//            {
//              "ref":111,                      // Required - HomeSeer Device Reference for your sensor
//              "type":"TemperatureSensor",     // Required for a temperature sensor
//              "temperatureUnit":"F",          // Optional - C is the default
//              "name":"Bedroom temp",          // Optional - HomeSeer device name is the default
//              "batteryRef":112,               // Optional - HomeSeer device reference for the sensor battery level
//              "batteryThreshold":15           // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 25
//              "uuid_base":"SomeUniqueId"     // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !
//            },
//            {
//              "ref":34,                       // Required - HomeSeer Device Reference for your sensor
//              "type":"SmokeSensor",           // Required for a smoke sensor
//              "name":"Kichen smoke detector", // Optional - HomeSeer device name is the default
//              "batteryRef":35,                // Optional - HomeSeer device reference for the sensor battery level
//              "uuid_base":"SomeUniqueId"     // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !
//              "batteryThreshold":15,          // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 25
//            },
//            {
//              "ref":34,                       // Required - HomeSeer Device Reference for your sensor (Here it's the same device as the SmokeSensor above)
//              "type":"CarbonMonoxideSensor",  // Required for a carbon monoxide sensor
//              "name":"Kitchen CO detector",    // Optional - HomeSeer device name is the default
//              "batteryRef":35,                // Optional - HomeSeer device reference for the sensor battery level
//              "batteryThreshold":15,          // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 25
//              "uuid_base":"SomeUniqueId"     // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !
//            },
//            {
//              "ref":210,                      // Required - HomeSeer Device Reference of a Lock
//              "type":"Lock",                  // Required for a Lock
//              "batteryRef":35,                // Optional - HomeSeer device reference for the sensor battery level
//              "uuid_base":"SomeUniqueId"     // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !
//              "batteryThreshold":15,          // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 25
//            },
//            {
//              "ref":115,                      // Required - HomeSeer Device Reference for a device holding battery level (0-100)
//              "type":"Battery",               // Required for a Battery
//              "name":"Roomba battery",        // Optional - HomeSeer device name is the default
//              "batteryThreshold":15           // Optional - If the level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 25
//              "uuid_base":"SomeUniqueId"     // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !
//            },
//         ]
//     }
// ],
//
//
// SUPORTED TYPES:
// - Lightbulb              (can_dim  options)
// - Fan              		(can_dim  options, here "can_dim" =' true is for a fan with rotation speed control)
// - Switch                 
// - Outlet                 
// - TemperatureSensor      (temperatureUnit=C|F)
// - ContactSensor          (batteryRef, batteryThreshold options)
// - MotionSensor           (batteryRef, batteryThreshold options)
// - LeakSensor             (batteryRef, batteryThreshold options)
// - OccupancySensor        (batteryRef, batteryThreshold options)
// - SmokeSensor            (batteryRef, batteryThreshold options)
// - CarbonMonoxideSensor   (batteryRef, batteryThreshold options)
// - CarbonDioxideSensor    (batteryRef, batteryThreshold options)
// - Lock                   


var net = require('net');
var promiseHTTP = require("request-promise-native");
var chalk = require("chalk");
var HSutilities = require("./lib/HomeSeerUtilities");
var Accessory, Service, Characteristic, UUIDGen;
	
// The following variable is set to 0 ("true" the first time HomeSeer is polled.
// This ensures that all associated HomeKit devices get an .updateValue call during processing of updateAllFromHSData()
// On subsequent polls, this is set to false and the HomeKit .updateValue function only executes 
// if there has been a (potential) change in the HomeKit value due to a HomeSeer change.
var pollingCount = 0;
	
// Following variable stores the full HomeSeer JSON-ified Device status data structure.
// This includes Device data for all of the HomeSeer devices of interest.
var _currentHSDeviceStatus = []; 
var _everyHSDevice = [];
var allHSDevices = [];
// Note that the HomeSeer json date in _currentHSDeviceStatus is of the following form where _currentHSDeviceStatus is an array so
// an index must be specified to access the properties, such as 
//  _currentHSDeviceStatus[indexvalue] for a dimmer would be of the form...
// note indexvalue does not correspond to the HomeSeer reference, but is arbitrary. You need to loop
// through the entire array and do comparisons to find the "ref" value you are interested in
/*
		 { ref: 299,
			name: 'Floods',
			location: 'Guest Bedroom',
			location2: '1 - First Floor',
			value: 0,
			status: 'Off',
			device_type_string: 'Z-Wave Switch Multilevel',
			last_change: '/Date(1517009446329)/',
			relationship: 4,
			hide_from_view: false,
			associated_devices: [ 297 ],
			device_type:
			 { Device_API: 4,
			   Device_API_Description: 'Plug-In API',
			   Device_Type: 0,
			   Device_Type_Description: 'Plug-In Type 0',
			   Device_SubType: 38,
			   Device_SubType_Description: '' },
			device_image: '',
			UserNote: '',
			UserAccess: 'Any',
			status_image: '/images/HomeSeer/status/off.gif',
			voice_command: '',
			misc: 4864 },
*/	




// The next array variable (_HSValues) stores just the value of the associated HomeSeer reference. 
// This is a sparse array with most index values null.
// The array index corresponds to the HomeSeer reference so _HSValues[211] would be the HomeSeer value for device 211.
var _HSValues = []; 

// The next array variable holds a list of all of the HomeKit HAP Characteristic objects
// that can be affected by changes occurring at HomeSeer. 
// The array is populated during by the getServices function when a HomeKit device is created.
// After HomeSeer is polled, each item in this array is analyzed by the updateAllFromHSData() function to determine 
// if it needs to be updated.
var _statusObjects = []; 

var HomeSeerHost = "";

var instantStatusEnabled = false;

module.exports = function (homebridge) {
    console.log("homebridge API version: " + homebridge.version);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    // For platform plugin to be considered as dynamic platform plugin,
    // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
    homebridge.registerPlatform("homebridge-HomeSeerPlatform", "HomeSeer", HomeSeerPlatform, true);
}

function getHSValue(ref) {
	return _HSValues[ref];
}
function forceHSValue(ref, level)
{
		// This function is used to temporarily 'fake' a HomeSeer poll update.
		// Used when, e.g., you set a new value of an accessory in HomeKit - this provides a fast update to the
		// Retrieved HomeSeer device values which will then be "corrected / confirmed" on the next poll.
		 _HSValues[ref] = parseFloat(level);
		
		// Debugging
		// console.log("** DEBUG ** - called forceHSValue with reference: %s,  level: %s, resulting in new value: %s", ref, level, _HSValues[ref]);
}


function HomeSeerPlatform(log, config, api) {
    this.log = log;
    this.config = config;

    if(config)
	{
		if (this.config["platformPoll"]==null)  this.config["platformPoll"] = 10;

        this.log("System default periodic polling rate set to " + this.config.platformPoll + ' seconds');
	}
}

HomeSeerPlatform.prototype = 
{
	
    accessories: function (callback) 
	{
        var foundAccessories = [];
		var that = this;
        // var refList = [];
		
		

			
		// Check entries in the config.json file to make sure there are no obvious errors.		
		HSutilities.checkConfig.call(this, this.config);

		/////////////////////////////////////////////////////////////////////////////////		
		// Make devices for each HomeSeer event in the config.json file

		if (this.config.events) 
		{
			for (var i in this.config.events) 
			{
				var event = new HomeSeerEvent(that.log, that.config, that.config.events[i]);
				foundAccessories.push(event);
			}
		}
	
		// If the config.json file contains a "lightbulbs =" group of references, push them onto the accessories array as "type":"Lightbulb"
		if(this.config.lightbulbs)
		{
			if(this.config.accessories == null) this.config.accessories = []; // make sure there's an accessories array to push bulbs onto
			for (var thisRef in this.config.lightbulbs)
			{
				var addLight = { "type":"Lightbulb", "ref":this.config.lightbulbs[thisRef] };
				this.config.accessories.push(addLight);
			}
		}

			var self = this;	// Assign this to self so you can access its values inside the promise.
			var allStatusUrl = "";
			
			promiseHTTP({ uri: this.config["host"] + "/JSON?request=getstatus", json:true})
			.then( function(json) //  Find the Batteries!
					{
						allHSDevices = json.Devices;

						for (var i in self.config.accessories)
						{
							var deviceBattery = findBattery(self.config.accessories[i].ref);
							if ((self.config.accessories[i].batteryRef == null) && (deviceBattery != (-1)))
							{
								console.log(chalk.magenta.bold("Device Reference #: " + self.config.accessories[i].ref 
								+ " appears to be a battery operated device, but no battery was specified. Adding a battery reference: " + deviceBattery));
								self.config.accessories[i].batteryRef = deviceBattery;
							}
							if ((deviceBattery != (-1)) && (self.config.accessories[i].batteryRef != deviceBattery)  )
							{
								console.log(chalk.red.bold("Wrong battery Specified for device Reference #: " + self.config.accessories[i].ref 
								+ " You specified reference: " + self.config.accessories[i].batteryRef + " but correct device reference appears to be: " + deviceBattery +". Fixing error."));
								self.config.accessories[i].batteryRef = deviceBattery;
							}	

							if ((deviceBattery == (-1)) && (self.config.accessories[i].batteryRef)  )
							{
								console.log(chalk.yellow.bold("You specified battery reference: "+ self.config.accessories[i].batteryRef + " for device Reference #: " + self.config.accessories[i].ref 
								+ " but device does not seem to be battery operated. Check config.json file and fix if this is an error."));

							}									
						}

						return (1);
					} // end then's function
				)
			.then (()=> 
				{
					//////////////////  Identify all of the HomeSeer References of interest  /////////////////////////
					var allHSRefs = [];
						allHSRefs.pushUnique = function(item) { if (this.indexOf(item) == -1) this.push(item); }

				
					for (var i in this.config.accessories) 
					{
						// console.log(chalk.bold.green("Returned Battery  Value" + findBattery(this.config, this.config.accessories[i].ref) ));

						// refList.push(this.config.accessories[i].ref);
						
						allHSRefs.pushUnique(this.config.accessories[i].ref);
						
						_HSValues[this.config.accessories[i].ref] = parseFloat(0);
						
						_statusObjects[this.config.accessories[i].ref] = [];
						
						// Add extra references if the device had a battery
						if(this.config.accessories[i].batteryRef) 
						{
							_statusObjects[this.config.accessories[i].batteryRef] = [];
							allHSRefs.pushUnique(this.config.accessories[i].batteryRef);
							_HSValues[this.config.accessories[i].batteryRef] = parseFloat(0);
						}
						// Add an extra references for Garage Door Openers
						if(this.config.accessories[i].obstructionRef) 
						{
							_statusObjects[this.config.accessories[i].obstructionRef] = [];
							allHSRefs.pushUnique(this.config.accessories[i].obstructionRef);
							_HSValues[this.config.accessories[i].obstructionRef] = parseFloat(0);
						}			
					} // end for
					
					//For New Polling Method to poll all devices at once
					allHSRefs.sort();

					/////////////////////////////////////////////////////////////////////////////////

					// Then make a HomeKit device for each "regular" HomeSeer device.
					this.log("Fetching HomeSeer devices.");

					// Get status on everything that isn't a battery!
					allStatusUrl = this.config["host"] + "/JSON?request=getstatus&ref=" + allHSRefs.concat();

					return promiseHTTP({ uri: allStatusUrl, json:true})	
				}) // End Battery Check		

			.then( function(response) 
				{
					for(var i in response.Devices)
					{
						_HSValues[response.Devices[i].ref] = parseFloat(response.Devices[i].value);
					}
					
					this.log('HomeSeer status function succeeded!');
					for (var i in this.config.accessories) {
						for (var j = 0; j < response.Devices.length; j++) {
							// Set up initial array of HS Response Values during startup
							if (this.config.accessories[i].ref == response.Devices[j].ref) {
								var accessory = new HomeSeerAccessory(that.log, that.config, this.config.accessories[i], response.Devices[j]);
								foundAccessories.push(accessory);
								break;
							} //endif
						} // endfor
					} //endfor.
					return response
				}.bind(this))
			.catch((err) => 
				{
					console.log("Error setting up Devices: " + err);
					err = chalk.red.bold(err + " Check if HomeSeer is running, then start homebridge again.");
					throw err;
				})
			.then((response)=> 
				{
					callback(foundAccessories);
					updateAllFromHSData();
					return response
				})
			.then((response) =>
				{
					function HSData(array) 
					{
						this.ref = array[1];
						this.newValue = array[2];
						this.oldValue = array[3];
					}
					var ASCIIPort = "11000";
						if(this.config["ASCIIPort"]) ASCIIPort = this.config["ASCIIPort"];

				
					var uri = parseUri(this.config["host"]);
					this.log("Host for ASCII Interface set to: " + uri.host + " at port " + ASCIIPort);
				
					return new Promise((resolve, reject) => 
					{
						// this.log(chalk.green.bold("Attempting connection to HomeSeer ASCII Port: "));
						var client = net.createConnection({port:ASCIIPort, host:uri.host}, () => 
							{
								this.log(chalk.green.bold("Successfully connected to ASCII Control Interface of HomeSeer. Instant Status Enabled."));
								instantStatusEnabled = true;
								client.on('data', (data) => 
									{

										var myData = new HSData(data.toString().slice(0, -2).split(","));
										
										//Only need to do an update if there is HomeKit data associated with it!
										// Which occurs if the _statusObjects array has a non-zero length for the reference reported.
										if( _statusObjects[myData.ref])
										{
											this.log("Received HomeSeer status update data: " + data);
											_HSValues[myData.ref] = 	parseFloat(myData.newValue);	

											var statusObjectGroup = _statusObjects[myData.ref];
											for (var thisCharacteristic in statusObjectGroup)
											{
												updateCharacteristicFromHSData(statusObjectGroup[thisCharacteristic]);
											}

											// updateAllFromHSData();
										} else
										{
											
											// this.log(chalk.magenta.bold("*Debug* - Received Instant Status data " + data ));
										}
									});
								resolve(true);
							});
						client.on('error', (data) => 
							{
								this.log(chalk.red.bold("* Warning * - Unable to connect to HomeSeer ASCII Port: " + ASCIIPort + ". Instant Status Not Enabled."));
								if (ASCIIPort != 11000) 
								{
								this.log(chalk.red.bold("ASCIIPort configuration value of: " + ASCIIPort + " is unusual. Typical value is 11000. Check setting."));
								}
								this.log(chalk.red.bold('To enable ASCII Port / Instant Status, see WIKI "Instant Status" entry at:'));
								this.log(chalk.red.bold("https://github.com/jvmahon/homebridge-homeseer/wiki/Enable-Instant-Status-(HomeSeer-ASCII-Port)"));
								resolve(false)
							});
					});
				})
			.then((instantStatusEnabled) =>
				{

					// This is the new Polling Mechanism to poll all at once.	
					// If instantStatusEnabled is true, then poll less frequently (once per minute);
					
					// this.log(chalk.yellow.bold("Monitoring HomeSeer Device Status for references: " + allHSRefs.concat()));

					if(instantStatusEnabled)
					{
						this.config.platformPoll = 60;
						this.log(chalk.green.bold("Reducing HomeSeer polling rate to: " + this.config.platformPoll + " seconds."))

					}
						
						setInterval( function () 
						{
							// Now do the poll
							promiseHTTP({ uri: allStatusUrl, json:true})
								.then( function(json) 
									{
										_currentHSDeviceStatus = json.Devices;
										that.log("Poll # %s: Retrieved values for %s HomeSeer references.",  pollingCount, _currentHSDeviceStatus.length);
										if(instantStatusEnabled == false && ((pollingCount % 5) == 0)) // only display once every 5 polls!
										{
											that.log(chalk.red.bold("* Warning * - Instant status not enabled. Operating in polling mode only which may degrade performance."));
											that.log(chalk.red.bold('To enable ASCII Port / Instant Status, see WIKI "Instant Status" entry at:'));
											that.log(chalk.red.bold("https://github.com/jvmahon/homebridge-homeseer/wiki/Enable-Instant-Status-(HomeSeer-ASCII-Port)"));											
										}
										for (var index in _currentHSDeviceStatus)
										{
											_HSValues[_currentHSDeviceStatus[index].ref] = parseFloat(_currentHSDeviceStatus[index].value);
										} //endfor

											updateAllFromHSData();
											
									} // end then's function
									) // end then
								.catch(function(err)
									{
										that.log("HomeSeer poll attempt failed with error %s", err);
									} // end catch's function
									);//end catch

						}, this.config.platformPoll * 1000 // end SetInterval's function
						);	//end setInterval function for polling loop

					return true;
				});
	}
}




function HomeSeerAccessory(log, platformConfig, accessoryConfig, status) {
    this.log = log;
    this.config = accessoryConfig;
    this.ref = status.ref;
    this.name = status.name
    this.model = status.device_type_string;

    this.access_url = platformConfig["host"] + "/JSON?";
	
	// this.log(chalk.magenta.bold("ASCII Instant Status Port is: " + platformConfig["ASCIIPort"]));
	
	this.HomeSeerHost = platformConfig["host"];
	// _accessURL = this.access_url;
	HomeSeerHost = this.HomeSeerHost;


    if (this.config.name)
        this.name = this.config.name;

	
	// Force uuid_base to be "Ref" + HomeSeer Reference # if the uuid_base is otherwise undefined.
    if (!this.config.uuid_base)
		{this.config.uuid_base = "Ref" + this.config.ref};
    
	this.uuid_base = this.config.uuid_base;
	
	if(this.config.can_dim)
			this.can_dim = this.config.can_dim;

    var that = this; // May be unused?

}

HomeSeerAccessory.prototype = {

    identify: function (callback) {
        callback();
    },

	// setHSValue function expects to be bound by .bind() to a HomeKit Service Object Characteristic!
	setHSValue: function (level, callback) {
		var url;
		var callbackValue = 1;
		var transmitValue = level;
		var performUpdate = true;
		
		// Uncomment for Debugging
		// console.log ("** Debug ** - Called setHSValue with level %s for UUID %s", level, this.UUID);
		
		if (!this.UUID) {
			var error = "*** PROGRAMMING ERROR **** - setHSValue called by something without a UUID";
			console.log (chalk.bold.red("*** PROGRAMMING ERROR **** - setHSValue called by something without a UUID"));
			console.log (this);                
			callback(error);
		}

			// Add Any Special Handling Based on the UUID
			// Uncomment any UUID's actually used!
				switch( this.UUID)
				{
					case(Characteristic.RotationSpeed.UUID):
					case(Characteristic.Brightness.UUID ): 
					{
						// If the _HSValues array has a 255 value, it means that this Brightness / Rotation speed change
						// Is being sent as part of an initial dimmable device turn-on pair. 
						// In HomeSeer, it is better not to send this second value until after the last-level feature settles to a new value.
						// So inhibit the transmission but only if you have Instant Status feature enabled. 
						if(instantStatusEnabled && (_HSValues[this.HSRef] == 255))
						{
							performUpdate = false;
						}
						
						// Maximum ZWave value is 99 so covert 100% to 99!
						transmitValue = (level == 100) ? 99 : level;
						
						forceHSValue(this.HSRef, transmitValue); 
						callbackValue = level; // but call back with the value instructed by HomeKit rather than the modified 99 sent to HomeSeer
						
						// this.updateValue(transmitValue); // Assume success. This gets corrected on next poll if assumption is wrong.
						// console.log ("          ** Debug ** called for Brightness update with level %s then set to transmitValue %s", level, transmitValue); 

						break;
					}
					
					case(Characteristic.TargetDoorState.UUID):
					{
						switch(level)
						{
							case 0: {transmitValue =  255;   callbackValue = 0;  break;} // Door Open
							case 1: {transmitValue =  0; callbackValue = 1;  break; } // Door Closed
						}
						// setHSValue(this.HSRef, transmitValue); ** Don't assume success for the lock. Wait for a poll!
						console.log("Set TransmitValue for lock characteristic %s to %s ", this.displayName, transmitValue);
						break;
					}					
					case(Characteristic.LockTargetState.UUID ):
					{
						switch(level)
						{
							case 0: {transmitValue =  0;   callbackValue = 0;  break;} // Lock Unsecured
							case 1: {transmitValue =  255; callbackValue = 1;  break; } // Lock Secured
						}
						// setHSValue(this.HSRef, transmitValue); ** Don't assume success for the lock. Wait for a poll!
						console.log("Set TransmitValue for lock characteristic %s to %s ", this.displayName, transmitValue);
						break;
					}
	
					case(Characteristic.On.UUID ):  
					{
						// For devices such as dimmers, HomeKit sends both "on" and "brightness" when you adjust brightness.
						// But Z-Wave only expects a brighness value if light is already on. So, if the device is already on (non-Zero ZWave value)
						// then don't send again.
						// HomeKit level == false means turn off, level == true means turn on.
						
						if (level == false) 
							{
								transmitValue = 0 ; 
								callbackValue = 0;
								forceHSValue(this.HSRef, 0); // assume success and set to 0 to avoid jumping of any associated dimmer / range slider.
						}
						else // turn on!
						{
							if(getHSValue(this.HSRef) == 0)	// if it is currently off, then turn fully on.
							{
								// if it is off, turn on to full level.
								transmitValue = 255;
								forceHSValue(this.HSRef, 255);
								callbackValue = 1; // and callback with a 1 meaning it was turned on
							}
							else // If it appears to be on, then send same value!
							{
								// if it is on then use current value.
								// don't use the "255" value because Z-Wave dimmer's can be ramping up/down 
								// and use of set-last-value (255)  will cause jumping of the HomeKit Dimmer slider interface
								// if a poll occurs during ramping.
								transmitValue = getHSValue(this.HSRef); // if it is already on, then just transmit its current value
								callbackValue = 1;
								performUpdate = false; // or maybe don't transmit at all (testing this feature)
							}
						}
						break; // 
					}

					default:
					{
						console.log (chalk.bold.red("*** PROGRAMMING ERROR **** - Service or Characteristic UUID not handled by setHSValue routine"));
						
						var err = "*** PROGRAMMING ERROR **** - Service or Characteristic UUID not handled by setHSValue routine" 
										+ characteristicObject.UUID + "  named  " + characteristicObject.displayName;
						callback(err, 0);
						return;
						break;
					}
				}
		
		if (isNaN(transmitValue)) 
			{
			console.log(chalk.bold.red("*************************** PROGRAM ERROR ***************************"));
			console.log ("Attempting to transmit non-numeric value to HomeSeer for %s with UUID %s", this.displayName, this.UUID);
			callback("Programming Error in function setHSValue. Attempt to send value to HomeSeer that is not a number");
			console.log(chalk.bold.red("*********************************************************************"));

			};
	
		 url = HomeSeerHost + "/JSON?request=controldevicebyvalue&ref=" + this.HSRef + "&value=" + transmitValue;
 
		 // For debugging
		 //console.log ("Debug - Called setHSValue has URL = %s", url);
 
		 // console.log("Sending URL %s", url);

		if (performUpdate)
		 {
			 promiseHTTP(url)
				.then( function(htmlString) {
						// console.log(this.displayName + ': HomeSeer setHSValue function succeeded!');
						callback(null, callbackValue);
						// updateCharacteristic(this);// poll for this one changed Characteristic after setting its value.
				}.bind(this))
				.catch(function(err)
					{ 	console.log(chalk.bold.red("Error attempting to update %s, with error %s", this.displayName, this.UUID, err));
					}.bind(this)
				);
		 } 
		else 
			{
				callback(null, callbackValue);
			}
    },


    getServices: function () {
		// this.log("---------------getServices function called --------- Debug ----------------------------");
		// this.log("Configuration ", this.config);
		// this.log("---------------getServices function called --------- Debug ----------------------------");
				
        var services = [];
		
		// Use the Z-Wave Model Info. from HomeSeer if the type is undefined!
		if(this.config.type == undefined) this.config.type = this.model;
		
		this.log("Configuring Device with user selected type " + this.config.type + " and HomeSeer Device Type: " + this.model);


        switch (this.config.type) {
			
		case "Appliance Module":
		case "Lamp Module":
		case "Z-Wave Switch Binary":
	    	case "Switch": 
			{
                var switchService = new Service.Switch();
				switchService.isPrimaryService = true;
				
				switchService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;
					
                switchService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setHSValue.bind(switchService.getCharacteristic(Characteristic.On)));
				_statusObjects[this.config.ref].push(switchService.getCharacteristic(Characteristic.On));

                services.push(switchService);
                break;
            }

			
            case "Outlet": {
                var outletService = new Service.Outlet();
				outletService.isPrimaryService = true;
				
				outletService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;
				
                outletService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setHSValue.bind(outletService.getCharacteristic(Characteristic.On)));

				_statusObjects[this.config.ref].push(outletService.getCharacteristic(Characteristic.On));
                services.push(outletService);
                break;
            }
			
            case "Z-Wave Temperature":
			case "TemperatureSensor": 
			{
                var temperatureSensorService = new Service.TemperatureSensor();
				temperatureSensorService.isPrimaryService = true;
				temperatureSensorService.displayName = "Service.TemperatureSensor";
				
                temperatureSensorService
                    .getCharacteristic(Characteristic.CurrentTemperature).setProps({ minValue: -100 });				

                temperatureSensorService
                    .getCharacteristic(Characteristic.CurrentTemperature)
					.HSRef = this.config.ref;
					
				temperatureSensorService
                    .getCharacteristic(Characteristic.CurrentTemperature)
					.HStemperatureUnit = ((this.config.temperatureUnit) ? this.config.temperatureUnit : "F" );

                services.push(temperatureSensorService);
				
				_statusObjects[this.config.ref].push(temperatureSensorService.getCharacteristic(Characteristic.CurrentTemperature));	

                break;
            }
			
            case "CarbonMonoxideSensor": {
                var carbonMonoxideSensorService = new Service.CarbonMonoxideSensor();
                carbonMonoxideSensorService.isPrimaryService = true;
				
                carbonMonoxideSensorService
                    .getCharacteristic(Characteristic.CarbonMonoxideDetected)
					.HSRef = this.config.ref;

                services.push(carbonMonoxideSensorService);
				
				_statusObjects[this.config.ref].push(carbonMonoxideSensorService.getCharacteristic(Characteristic.CarbonMonoxideDetected));	
				
                break;
            }
            case "CarbonDioxideSensor": {
                var carbonDioxideSensorService = new Service.CarbonDioxideSensor();
				carbonDioxideSensorService.isPrimaryService = true;
				
                carbonDioxideSensorService
                    .getCharacteristic(Characteristic.CarbonDioxideDetected)
                    .HSRef = this.config.ref;

                services.push(carbonDioxideSensorService);
				
				_statusObjects[this.config.ref].push(carbonDioxideSensorService.getCharacteristic(Characteristic.CarbonDioxideDetected));	

                break;
            }
            case "ContactSensor": {
                var contactSensorService = new Service.ContactSensor();
                contactSensorService.isPrimaryService = true;
				
				contactSensorService
                    .getCharacteristic(Characteristic.ContactSensorState)
                    .HSRef = this.config.ref;

                services.push(contactSensorService);

				_statusObjects[this.config.ref].push(contactSensorService.getCharacteristic(Characteristic.ContactSensorState));	

                break;
            }
            case "MotionSensor": {
                var motionSensorService = new Service.MotionSensor();
                motionSensorService.isPrimaryService = true;
                motionSensorService.HSRef = this.config.ref;
				
                motionSensorService
                    .getCharacteristic(Characteristic.MotionDetected)
                   .HSRef = this.config.ref;

                services.push(motionSensorService);
				
				_statusObjects[this.config.ref].push(motionSensorService.getCharacteristic(Characteristic.MotionDetected));	
				
                break;
            }
            case "Z-Wave Water Leak Alarm":
			case "LeakSensor": 
			{
                var leakSensorService = new Service.LeakSensor();
                leakSensorService
                    .getCharacteristic(Characteristic.LeakDetected)
                    .HSRef = this.config.ref;

                services.push(leakSensorService);

				_statusObjects[this.config.ref].push(leakSensorService.getCharacteristic(Characteristic.LeakDetected));	
				
                break;
            }
            case "OccupancySensor": {
                var occupancySensorService = new Service.OccupancySensor();
                occupancySensorService
                    .getCharacteristic(Characteristic.OccupancyDetected)
                    .HSRef = this.config.ref;

                services.push(occupancySensorService);
				
				_statusObjects[this.config.ref].push(occupancySensorService.getCharacteristic(Characteristic.OccupancyDetected));	
				
                break;
            }
            case "SmokeSensor": {
                var smokeSensorService = new Service.SmokeSensor();
                smokeSensorService
                    .getCharacteristic(Characteristic.SmokeDetected)
					.HSRef = this.config.ref;

                services.push(smokeSensorService);
				
				_statusObjects[this.config.ref].push(smokeSensorService.getCharacteristic(Characteristic.SmokeDetected));	

                break;
            }
			
			
            case "LightSensor": 
			{
                var lightSensorService = new Service.LightSensor();
                lightSensorService
                    .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
                    .HSRef = this.config.ref;

                services.push(lightSensorService);
				
				_statusObjects[this.config.ref].push(lightSensorService.getCharacteristic(Characteristic.CurrentAmbientLightLevel));	

                break;
            }
			

            case "HumiditySensor": 
			{
                var humiditySensorService = new Service.HumiditySensor();
                humiditySensorService
                    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
					.HSRef = this.config.ref;
					
                services.push(humiditySensorService);
				
				_statusObjects[this.config.ref].push(humiditySensorService.getCharacteristic(Characteristic.CurrentRelativeHumidity));	

                break;
            }
		
			case "Z-Wave Door Lock":
            case "Lock": {
                this.config.lockRef = this.ref;
                var lockService = new Service.LockMechanism();
				lockService.isPrimaryService = true;
				lockService.displayName = "Service.LockMechanism";
				
				lockService
                    .getCharacteristic(Characteristic.LockCurrentState)
					.HSRef = this.config.ref;
					
                lockService
                    .getCharacteristic(Characteristic.LockTargetState)
						.HSRef = this.config.ref;
						
                lockService
                    .getCharacteristic(Characteristic.LockTargetState)
					.on('set', this.setHSValue.bind(lockService.getCharacteristic(Characteristic.LockTargetState)));
                    // .on('set', this.setLockTargetState.bind(this));
				
				// Next two values are not currently used.
				if (this.config.unlockValue)
					 lockService.getCharacteristic(Characteristic.LockTargetState).HSunlockValue = this.config.unlockValue;
				if (this.config.lockValue)
					lockService.getCharacteristic(Characteristic.LockTargetState).HSlockValue = this.config.lockValue;
		    
				lockService.isPrimaryService = true;
		    
				services.push(lockService);
				
		    	_statusObjects[this.config.ref].push(lockService.getCharacteristic(Characteristic.LockCurrentState));
				
				// If an manual lock / unlock occurs, then you need to change the TargetState so that HomeKit
				// presents correct informration about the states. I.e., you need the target state to be updated to be
				// set to the actual state.
				_statusObjects[this.config.ref].push(lockService.getCharacteristic(Characteristic.LockTargetState));
								
                break;
            }
			case "GarageDoorOpener": 
			{
				var garageDoorOpenerService = new Service.GarageDoorOpener();
				garageDoorOpenerService
					.getCharacteristic(Characteristic.CurrentDoorState)
					.HSRef = this.config.ref;
					
				garageDoorOpenerService
					.getCharacteristic(Characteristic.TargetDoorState)
					.HSRef = this.config.ref;

				garageDoorOpenerService
					.getCharacteristic(Characteristic.TargetDoorState)
					.on('set', this.setHSValue.bind(garageDoorOpenerService.getCharacteristic(Characteristic.TargetDoorState)));		

				if(this.config.obstructionRef != null)
				{
				garageDoorOpenerService
					.getCharacteristic(Characteristic.ObstructionDetected)
					.HSRef = this.config.obstructionRef;
					_statusObjects[this.config.obstructionRef].push(garageDoorOpenerService.getCharacteristic(Characteristic.ObstructionDetected));
				}
					
				services.push(garageDoorOpenerService);
			_statusObjects[this.config.ref].push(garageDoorOpenerService.getCharacteristic(Characteristic.CurrentDoorState));
			_statusObjects[this.config.ref].push(garageDoorOpenerService.getCharacteristic(Characteristic.TargetDoorState));


				break;
			}			
            case "Fan": {
                var fanService = new Service.Fan
				fanService.isPrimaryService = true;
				fanService.displayName = "Service.Fan";
				
				fanService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;				
                fanService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setHSValue.bind(fanService.getCharacteristic(Characteristic.On)));
					
				_statusObjects[this.config.ref].push(fanService.getCharacteristic(Characteristic.On));	

		    	if (this.config.can_dim == null) // if can_dim is undefined, set it to 'true' unless its a Z-Wave Binary Switch.
				{
					this.config.can_dim = true; // default to true
					
					if ( (this.model.indexOf("Z-Wave") != -1) && (this.model == "Z-Wave Switch Binary"))
					{
						this.config.can_dim = false;
					}
				}
				
				if (typeof(this.config.can_dim) == "string")
				{	// This error should have been checked and fixe by the checkConfig() function, but this is a debugging check.
					var error = chalk.red.bold("Program Error. can_dim setting has a type of 'string'. Should be 'boolean' for device with reference " + this.ref)
					throw new SyntaxError(error);
				}

                if (this.config.can_dim == true) {
					
					if ( (this.model.indexOf("Z-Wave") != -1) && (this.model != "Z-Wave Switch Multilevel"))
					{
						this.log(chalk.magenta.bold("* Warning * - Check can_dim setting for Fan named: " + this.name + ", and HomeSeer reference: " + this.config.ref ));
						this.log(chalk.magenta.bold("HomeSeer reports model type: " + this.model + ", which typically does not provide rotation speed adjustment."));
					}
					
					this.log("          Adding RotationSpeed to Fan");
                    fanService
                        .addCharacteristic(new Characteristic.RotationSpeed())
						.HSRef = this.config.ref;
						
					fanService
						.getCharacteristic(Characteristic.RotationSpeed)
						.on('set', this.setHSValue.bind(fanService.getCharacteristic(Characteristic.RotationSpeed)));
				_statusObjects[this.config.ref].push(fanService.getCharacteristic(Characteristic.RotationSpeed));						
                }
				else
				{
					if ( (this.model.indexOf("Z-Wave") != -1) && (this.model == "Z-Wave Switch Multilevel"))
					{
						this.log(chalk.magenta.bold("* Warning * - Check can_dim setting for Fan named: " + this.name + ", and HomeSeer reference: " + this.config.ref ));
						this.log(chalk.magenta.bold("Setting without rotation speed adjustment, but HomeSeer reports model type: " + this.model + ", which typically does provide rotation speed adjustment."));
					}					
				}

				
                services.push(fanService);
                break;
            }	
/*			
			case ("RGBLight"):
			{
				// this.log("** Debug ** - Setting up bulb %s with can_dim %s", this.config.name, this.config.can_dim);
                var lightbulbService = new Service.Lightbulb();
				lightbulbService.isPrimaryService = true;
				lightbulbService.displayName = "Service.Lightbulb"
				
				lightbulbService
					.getCharacteristic(Characteristic.On)
					.HSREf = this.config.ref;
				
                lightbulbService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.On)));

					
				lightbulbService
                        .addCharacteristic(new Characteristic.Brightness());
				
				var RBG = 	{	
								red:this.config.red, 
								green:this.config.green, 
								blue:this.config.blue
							};

				
				lightbulbService
						.getCharacteristic(Characteristic.Brightness)
						.HSRef = this.config.ref;
						
				lightbulbService
						.getCharacteristic(Characteristic.Brightness)						
						.RGB = RGB;	
					
				lightbulbService
						.addCharacteristic(new Characteristic.Hue());
						
				lightbulbService
						.getCharacteristic(Characteristic.Hue)
						.HSRef = this.config.ref;	
						
				lightbulbService
						.getCharacteristic(Characteristic.Hue)						
						.RGB = RGB;
						
				lightbulbService
						.addCharacteristic(new Characteristic.Saturation());
						
				lightbulbService
						.getCharacteristic(Characteristic.Saturation)
						.HSRef = this.config.ref;	
						
				lightbulbService
						.getCharacteristic(Characteristic.Saturation)
						.RGB = RGB;		

						
					
				_statusObjects[this.config.ref].push(lightbulbService.getCharacteristic(Characteristic.On));
				_statusObjects[this.config.ref].push(lightbulbService.getCharacteristic(Characteristic.Brightness));
				_statusObjects[this.config.red].push(lightbulbService.getCharacteristic(Characteristic.Brightness));
				_statusObjects[this.config.green].push(lightbulbService.getCharacteristic(Characteristic.Brightness));
				_statusObjects[this.config.blue].push(lightbulbService.getCharacteristic(Characteristic.Brightness));
				_statusObjects[this.config.ref].push(lightbulbService.getCharacteristic(Characteristic.Hue));
				_statusObjects[this.config.red].push(lightbulbService.getCharacteristic(Characteristic.Hue));
				_statusObjects[this.config.green].push(lightbulbService.getCharacteristic(Characteristic.Hue));
				_statusObjects[this.config.blue].push(lightbulbService.getCharacteristic(Characteristic.Hue));				
				_statusObjects[this.config.ref].push(lightbulbService.getCharacteristic(Characteristic.Saturation));
				_statusObjects[this.config.red].push(lightbulbService.getCharacteristic(Characteristic.Saturation));
				_statusObjects[this.config.green].push(lightbulbService.getCharacteristic(Characteristic.Saturation));
				_statusObjects[this.config.blue].push(lightbulbService.getCharacteristic(Characteristic.Saturation));
				
                services.push(lightbulbService);				
				break;
			}
	*/		
			
            case "Z-Wave Switch Multilevel":
			case "Lightbulb": 
			default: 
			{
				if(!this.config || !this.config.type || (this.config.type == null))
				{
					this.log(chalk.bold.yellow("WARNING: adding unspecified device type with HomeSeer reference " + this.config.ref + ". Defaulting to type Lightbulb. "));
					this.log(chalk.bold.yellow("Future versions of this plugin may require specification of the type of each device."));
					this.log(chalk.bold.yellow("Please update your config.json file to specify the device type."));
				}
				
				// this.log("** Debug ** - Setting up bulb %s with can_dim: %s", this.config.name, this.config.can_dim);
                var lightbulbService = new Service.Lightbulb();
				lightbulbService.isPrimaryService = true;
				lightbulbService.displayName = "Service.Lightbulb"
				
				lightbulbService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;
				
                lightbulbService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.On)));
                    // .on('get', this.getPowerState.bind(this));
					
				_statusObjects[this.config.ref].push(lightbulbService.getCharacteristic(Characteristic.On));
				

		    	if (this.config.can_dim == null) // if can_dim is undefined, set it to 'true' unless its a Z-Wave Binary Switch.
				{
					this.config.can_dim = true; // default to true
					
					if ( (this.model.indexOf("Z-Wave") != -1) && (this.model == "Z-Wave Switch Binary"))
					{
						this.config.can_dim = false;
					}
				}
		
				if (typeof(this.config.can_dim) == "string")
				{	// This error should have been checked and fixe by the checkConfig() function, but this is a debugging check.
					var error = chalk.red.bold("Program Error. can_dim setting has a type of 'string'. Should be 'boolean' for device with reference " + this.ref)
					throw new SyntaxError(error);
				}

                if (this.config.can_dim == true) 
				{
					// this.log(chalk.magenta.bold("*Debug* Making lightbulb dimmable"));
					
					if ( (this.model.indexOf("Z-Wave") != -1) && (this.model != "Z-Wave Switch Multilevel"))
					{
						this.log(chalk.magenta.bold("* Warning * - Check can_dim setting. Setting Lightbulb named " + this.name + " and HomeSeer reference " + this.config.ref + " as dimmable, but"));
						this.log(chalk.magenta.bold("HomeSeer reports model type: " + this.model + " which is typically a non-dimmable type"));

					}
					
                    lightbulbService
                        .addCharacteristic(new Characteristic.Brightness())
						.HSRef = this.config.ref;
					
					lightbulbService
						.getCharacteristic(Characteristic.Brightness)
                        .on('set', this.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.Brightness)));
						
					_statusObjects[this.config.ref].push(lightbulbService.getCharacteristic(Characteristic.Brightness));
                }
				else
				{
					if ( (this.model.indexOf("Z-Wave") != -1) && (this.model == "Z-Wave Switch Multilevel"))
					{
						this.log(chalk.magenta.bold("* Warning * - Check can_dim setting. Setting Lightbulb named " + this.name + " and HomeSeer reference " + this.config.ref + " as non-dimmable, but"));
						this.log(chalk.magenta.bold("HomeSeer reports model type: " + this.model + " which is typically a dimmable type"));

					}
				}

                services.push(lightbulbService);

                break;
            }
        }
		
		 // If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("          Adding a Battery Service");

                    var batteryService = new Service.BatteryService();
					batteryService.displayName = "Service.BatteryService";
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
					
					if (this.config.batteryThreshold == null) this.config.batteryThreshold = 25;
					
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
                    services.push(batteryService);
					
					_statusObjects[this.config.batteryRef].push(batteryService.getCharacteristic(Characteristic.BatteryLevel));
					_statusObjects[this.config.batteryRef].push(batteryService.getCharacteristic(Characteristic.StatusLowBattery));					
                }
				
		// And add a basic Accessory Information service		
        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, "HS " + this.config.type + " ref " + this.ref);
        services.push(informationService);
		// 

        return services;
    }
}

////////////////////////////////////////////////////////////////////////////////
//    The following code creates devices which can trigger HomeSeer Events   ///
////////////////////////////////////////////////////////////////////////////////
function HomeSeerEvent(log, platformConfig, eventConfig) {
    this.log = log;
    this.config = eventConfig;
    this.name = eventConfig.eventName
    this.model = "HomeSeer Event";

    this.access_url = platformConfig["host"] + "/JSON?";
    this.on_url = this.access_url + "request=runevent&group=" + encodeURIComponent(this.config.eventGroup) + "&name=" + encodeURIComponent(this.config.eventName);

    if (this.config.offEventGroup && this.config.offEventName) {
        this.off_url = this.access_url + "request=runevent&group=" + encodeURIComponent(this.config.offEventGroup) + "&name=" + encodeURIComponent(this.config.offEventName);
    }

    if (this.config.name)
        this.name = this.config.name;

    if (this.config.uuid_base)
        this.uuid_base = this.config.uuid_base;
}

HomeSeerEvent.prototype = {

    identify: function (callback) {
        callback();
    },

    launchEvent: function (value, callback) {
        this.log("Setting event value to %s", value);

        var url = this.on_url;
        if (value == 0 && this.off_url) {
            url = this.off_url;
        }
			
		promiseHTTP(url)
			.then( function(htmlString) {
					console.log(this.name + ': launchEvent function succeeded!');
					callback(null);
					
			if(this.off_url==null && value != 0)
            {
                setTimeout(function() {
                    this.log(this.name + ': Momentary switch reseting to 0');
                    this.switchService.getCharacteristic(Characteristic.On).setValue(0);
                }.bind(this),2000);
            }
					
			}.bind(this))
			.catch(function(err)
				{ 	console.log(this.name + ': launchEvent function failed: %s', err);
					callback(err);
				}.bind(this)
			);
    },

    getServices: function () {
        var services = []

        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, "HS Event " + this.config.eventGroup + " " + this.config.eventName);
        services.push(informationService);

        
        this.switchService = new Service.Switch();
        this.switchService
            .getCharacteristic(Characteristic.On)
            .on('set', this.launchEvent.bind(this));
        services.push(this.switchService);

        return services;
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//    The following code is associated with polling HomeSeer and updating HomeKit Devices from Returned data   //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function updateCharacteristicFromHSData(characteristicObject)
{
	
	// This performs the update to the HomeKit value from data received from HomeSeer
	//Debug
	// console.log("** Debug ** - Updating Characteristic %s with name %s and current value %s", characteristicObject.UUID, characteristicObject.displayName, characteristicObject.value)

	if (characteristicObject.HSRef)
	{
		var newValue = getHSValue(characteristicObject.HSRef);
		
		// The following "if" is a quick check to see if any change is needed.
		// if the HomeKit object value already matches what was received in the poll, then return and skip
		// processing the rest of this function code!
		if ((pollingCount != 0) && (characteristicObject.value == newValue)) return; 


		switch(true)
		{
			case(characteristicObject.UUID == Characteristic.StatusLowBattery.UUID):
			{
				// that.log("Battery Threshold status of battery level %s with threshold %s", newValue, characteristicObject.batteryThreshold);
				characteristicObject.updateValue((newValue < characteristicObject.batteryThreshold) ? true : false);
				break;
			}
			case(characteristicObject.UUID == Characteristic.CurrentDoorState.UUID): // For a Garage Door Opener
			{
				// console.log(chalk.magenta.bold("Debug - Setting CurrentDoorState to: " + newValue));
				switch(newValue)
				{
					case(255):	{	characteristicObject.updateValue(0);	break;	} // Open
					case(0):	{	characteristicObject.updateValue(1);	break;	} // Closed
					case(254):	{	characteristicObject.updateValue(2);	break;	} // Opening
					case(252):	{	characteristicObject.updateValue(3);	break;	} // Closing
					case(253):	{	characteristicObject.updateValue(4);	break;	} // Stopped
				}
				break;
			}
			case(characteristicObject.UUID == Characteristic.LockCurrentState.UUID): // For a Lock.
			{
				// Set to 0 = UnSecured, 1 - Secured, 2 = Jammed.
				// console.log("** Debug ** - Attempting LockCurrentState update with received HS value %s", newValue);
				
				switch(newValue)
				{
					case(0):	{	characteristicObject.updateValue(0);	break;	} // Locked
					case(255):	{	characteristicObject.updateValue(1);	break;	} // unlocked
					default:	{	characteristicObject.updateValue(2);	break;	} // unknown
				}
				break;
			}
			case (characteristicObject.UUID == Characteristic.TargetDoorState.UUID): // For garage door openers
			{
				// console.log(chalk.magenta.bold("Deug - Setting TargetDoorState to: " + newValue));
				switch(newValue)
				{
					case(0):	{	characteristicObject.updateValue(1);	break;	} // Door Closed
					case(255):	{	characteristicObject.updateValue(0);	break;	} // 255=Door Opened
					default:	{ 	console.log("ERROR - Unexpected Lock Target State Value %s", newValue); break;}
				}
				break;
			}			
			
			case (characteristicObject.UUID == Characteristic.LockTargetState.UUID): // For door locks
			{
				// console.log(chalk.magenta.bold("Deug - Setting TargetDoorState to: " + newValue));
				switch(newValue)
				{
					case(0):	{	characteristicObject.updateValue(0);	break;	} // Lock Unlocked
					case(255):	{	characteristicObject.updateValue(1);	break;	} // Lock Locked
					default:	{ 	console.log("ERROR - Unexpected Lock Target State Value %s", newValue); break;}
				}
				break;
			}
			// The following is for garage door openers and is an attempt to map the Z-Wave "Barrier" class
			// to an obstruction value. For some bizarre reason, some Z-Wave garage door openers use the value
			// of 74 to indicate a low battery in the sensor so if we get that value, ignore it.
			case( characteristicObject.UUID == Characteristic.ObstructionDetected.UUID ):
			{
				switch(newValue)
				{
					case(74): return; // The data was for a battery value update. Ignore it
					case(0):{	characteristicObject.updateValue(0);	break;	} // No Event Value
					default: {	characteristicObject.updateValue(1);	break;	} // Anything else, consider it obstructed.
					
				}
				break;
			}
			case( characteristicObject.UUID == Characteristic.CarbonDioxideDetected.UUID ):
			case( characteristicObject.UUID == Characteristic.CarbonMonoxideDetected.UUID):
			case( characteristicObject.UUID == Characteristic.ContactSensorState.UUID 	):
			case( characteristicObject.UUID == Characteristic.MotionDetected.UUID 	):
			case( characteristicObject.UUID == Characteristic.LeakDetected.UUID 		):
			case( characteristicObject.UUID == Characteristic.OccupancyDetected.UUID 	):
			case( characteristicObject.UUID == Characteristic.SmokeDetected.UUID 	):
			case( characteristicObject.UUID == Characteristic.On.UUID):
			{
				characteristicObject.updateValue( ((newValue) ? true: false) );
				break;
			}
			
			
			// For the following characteristics, no special handling is needed.
			// Simply provide HomeKit with whatever you got from HomeSeer
			case(characteristicObject.UUID == Characteristic.CurrentAmbientLightLevel.UUID):
			case(characteristicObject.UUID == Characteristic.CurrentRelativeHumidity.UUID):
			case(characteristicObject.UUID == Characteristic.BatteryLevel.UUID):
			{
				characteristicObject.updateValue(parseFloat(newValue));
				break;
			}
			
			// Handling Percentage values
			// The following characteristics are all exprssed in percentages.
			// Homekit uses 0 - 100 values. However, Z-Wave generally uses 0 - 99.
			// Simply passing the Z-wave value to HomeKit would result in HomeKit never showing 100%
			// even when device is fully on. So force a Z-Wave "99" to appear as 100%.
			case (characteristicObject.UUID == Characteristic.RotationSpeed.UUID):
			case (characteristicObject.UUID == Characteristic.Brightness.UUID):
			{
					// Zwave uses 99 as its maximum. Make it appear as 100% in Homekit
				characteristicObject.updateValue( (newValue == 99) ? 100 : newValue);
				break;
			}
			case (characteristicObject.UUID == Characteristic.CurrentTemperature.UUID):
			{
				// HomeKit uses celsius, so if HS is using Fahrenheit, convert to Celsius.
				if (characteristicObject.HStemperatureUnit && (characteristicObject.HStemperatureUnit == "F")) 
					{ newValue = (newValue -32 )* (5/9);}
								
				characteristicObject.updateValue(newValue);
				break;
			}

			default:
			{
					console.log("** WARNING ** -- Possible Incorrect Value Assignment for characteristic %s set to value %s", characteristicObject.displayName, newValue);
					characteristicObject.updateValue( newValue);
			}
		}; //end switch
		
		// Uncomment for debugging
		// console.log("** Debug ** -   %s value after update is: %s", characteristicObject.displayName, characteristicObject.value);
	} // end if
}

function updateAllFromHSData()
{
	for (var HSReference in _statusObjects)
	{
		var statusObjectGroup = _statusObjects[HSReference];
		// console.log(chalk.magenta.bold("* Debug * - Updating for reference " + HSReference + " a group with length " + statusObjectGroup.length));
		for (var thisCharacteristic in statusObjectGroup)
		{
		updateCharacteristicFromHSData(statusObjectGroup[thisCharacteristic]);
		}
	} // end for aindex
	
	pollingCount++; // Increase each time you poll. After at least 1 round of updates, no longer in startup mode!
	
} // end function



////////////////////    End of Polling HomeSeer Code    /////////////////////////////				

module.exports.platform = HomeSeerPlatform;

////////////////////    End of Polling HomeSeer Code    /////////////////////////////		

// Testing Only!

function findBattery(findRef)
{
	var returnValue = 9999;
			
	// first find the index of the HomeSeer device having the reference findRef
	var deviceIndex = allHSDevices.findIndex( (element, index, array)=> {return (element.ref == findRef)} );
	if (deviceIndex == -1) return (-1);
	
	var thisDevice = allHSDevices[deviceIndex]; // this is the HomeSeer data for the device being checked!
	if ((thisDevice.associated_devices == null) || (thisDevice.associated_devices.length == 0)) return (-1);

	
	// The associated device should be a root device. Get it! ...
	var rootDevice = allHSDevices[ allHSDevices.findIndex( (element, index, array)=> {return (element.ref == thisDevice.associated_devices)} )];
	
	if(rootDevice.device_type_string.indexOf("Battery") != (-1)) return (rootDevice.ref);
	
	if(rootDevice.device_type_string.indexOf("Root Device") != (-1)) // if true, we found the root device. Check all its elements for a battery
	{
		// console.log(chalk.green.bold("Found a Root Device with associated devices: " + rootDevice.associated_devices));
		
		// does the found device have associated devices?
		if (rootDevice.associated_devices != null)
		{
			for (var j in rootDevice.associated_devices)
			{
				var checkDeviceIndex = allHSDevices.findIndex( (element, index, array)=> {return (element.ref == rootDevice.associated_devices[j])} )
				if (checkDeviceIndex != -1)
				{
					var candidateDevice = allHSDevices[checkDeviceIndex]
					if (candidateDevice.device_type_string.indexOf("Battery") != -1)
					{
						// console.log(chalk.bold.red("Found a Battery reference: " + candidateDevice.ref + " for device reference " + findRef));
						return (candidateDevice.ref);
					}
				}
			}
		}
	}	
	return (-1);
}



////////////////////////   Code to Parse a URI and separate out Host and Port /////////////
// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License

function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};

