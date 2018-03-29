'use strict';

var net = require('net');
var promiseHTTP = require("request-promise-native");
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var HSutilities = require("./lib/HomeSeerUtilities");
var HKSetup = require("./lib/HomeKitDeviceSetup");
var DataExchange = require("./lib/DataExchange");

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
//         "host": "http://127.0.0.1",     		// Required - If you did setup HomeSeer authentication, use "http://user:password@ip_address:port"
//
//         "events":[                           // Optional - List of Events - Currently they are imported into HomeKit as switches
//            {
//               "eventGroup":"My Group",       // Required - The HomeSeer event group
//               "eventName":"My On Event",     // Required - The HomeSeer event name
//               "offEventGroup":"My Group",    // Optional - The HomeSeer event group for turn-off <event>
//               "offEventName":"My Off Event", // Optional - The HomeSeer event name for turn-off <event>
//               "name":"Test",                 // Optional - HomeSeer event name is the default
//               "uuid_base":"SomeUniqueId"     // Optional - HomeKit identifier will be derived from this parameter instead of the reference value.
//            }
//         ],
//
//         "accessories":[                      // Required - List of Accessories
//            {
//              "ref":8,                        // Required - HomeSeer Device Reference (To get it, select the HS Device - then Advanced Tab) 
//              "type":"Lightbulb",             // Required - Lightbulb (currently not enforced, but may be in future)
//              "name":"My Light",              // Optional - HomeSeer device name is the default
//				"onValue":255					// Optional.  Don't include for Z-Wave devices. For non-Zwave, set to value used in HomeSeer to designate "on".
//              "can_dim":true,                 // Optional - true is the default - false for a non dimmable lightbulb
//              "uuid_base":"SomeUniqueId"     	// Optional - HomeKit identifier will be derived from this parameter instead of the reference value.
//            },
//            {
//              "ref":8,                        // Required - HomeSeer Device Reference (To get it, select the HS Device - then Advanced Tab) 
//              "type":"Fan",             		// Required for a Fan
//              "name":"My Fan",              	// Optional - HomeSeer device name is the default
//				"onValue":255					// Optional.  Don't include for Z-Wave devices. For non-Zwave, set to value used in HomeSeer to designate "on".
//              "can_dim":true,                 // Optional - true is the default - false for fixed speed fan.
//              "uuid_base":"SomeUniqueId"     	// Optional - HomeKit identifier will be derived from this parameter instead of the reference value.
//            },
//            {
//              "ref":58,                       // This is a controllable outlet
//              "type":"Outlet"
//				"onValue":255					// Optional.  Don't include for Z-Wave devices. For non-Zwave, set to value used in HomeSeer to designate "on".
//              "uuid_base":"SomeUniqueId"     	// Optional - HomeKit identifier will be derived from this parameter instead of the reference value.
//            },
//              "ref":113,                      // Required - HomeSeer Device Reference of the Current Temperature Device
//              "type":"Thermostat",            // Required for a Thermostat
//              "name":"Living Room",     		// Optional - HomeSeer device name is the default
//				"stateRef":164
//              "controlRef":165,               // Required - HomeSeer device reference for your thermostat mode control (Off/Heating/Cooling/Auto)
//				"stateRef":	166,				// Required - HomeSeer device reference for your thermostat mode control (Off/Heating/Cooling/Auto)
//              "coolingSetpointRef":167,       // Required - HomeSeer device reference for your thermostat cooling target setpoint.
//              "heatingSetpointRef":168,       // Required - HomeSeer device reference for your thermostat cooling target setpoint.
//              "temperatureUnit":"C",          // Optional - Temperature Unit Used by HomeSeer. F for Fahrenheit, C for Celsius, F is the default
//            },
//            {
//              "ref":111,                      // Required - HomeSeer Device Reference for your sensor
//              "type":"TemperatureSensor",     // Required for a temperature sensor
//              "temperatureUnit":"F",          // Optional - C is the default
//              "name":"Bedroom temp",          // Optional - HomeSeer device name is the default
//              "batteryRef":112,               // Optional - HomeSeer device reference for the sensor battery level
//              "batteryThreshold":15           // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 25
//              "uuid_base":"SomeUniqueId"     	// Optional - HomeKit identifier will be derived from this parameter instead of the reference value.
//            },
//            {
//              "ref":34,                       // Required - HomeSeer Device Reference for your sensor
//              "type":"SmokeSensor",           // Required for a smoke sensor
//              "name":"Kichen smoke detector", // Optional - HomeSeer device name is the default
//              "batteryRef":35,                // Optional - HomeSeer device reference for the sensor battery level
//              "uuid_base":"SomeUniqueId"     	// Optional - HomeKit identifier will be derived from this parameter instead of the reference value.
//              "batteryThreshold":15,          // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 25
//            },
//            {
//              "ref":34,                       // Required - HomeSeer Device Reference for your sensor (Here it's the same device as the SmokeSensor above)
//              "type":"CarbonMonoxideSensor",  // Required for a carbon monoxide sensor
//              "name":"Kitchen CO detector",   // Optional - HomeSeer device name is the default
//              "batteryRef":35,                // Optional - HomeSeer device reference for the sensor battery level
//              "batteryThreshold":15,          // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 25
//              "uuid_base":"SomeUniqueId"     	// Optional - HomeKit identifier will be derived from this parameter instead of the reference value.
//            },
//            {
//              "ref":210,                      // Required - HomeSeer Device Reference of a Lock
//              "type":"Lock",                  // Required for a Lock
//              "batteryRef":35,                // Optional - HomeSeer device reference for the sensor battery level
//              "uuid_base":"SomeUniqueId"     	// Optional - HomeKit identifier will be derived from this parameter instead of the reference value.
//              "batteryThreshold":15,          // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 25
//            }
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

// Currently the HomeSeer variable is used as a global to allow access to the log variable (function) 
var HomeSeer = [];
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
    // HomeSeer.log = log;
	this.log = log;
    this.config = config;

    if(config)
	{
		if (this.config["platformPoll"]==null)  this.config["platformPoll"] = 10;

        this.log(green("System default periodic polling rate set to: ") + cyan(this.config.platformPoll) + green(' seconds'));
	}
}

HomeSeerPlatform.prototype = 
{
	
    accessories: function (callback) 
	{
        var foundAccessories = [];
		var that = this;

		// Check entries in the config.json file to make sure there are no obvious errors.		
		HSutilities.checkConfig.call(this, this.config);

		/////////////////////////////////////////////////////////////////////////////////		
		// Make devices for each HomeSeer event in the config.json file

		// Make Devices for each 'Event' entry in the config.json file.
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
					if (deviceBattery == (-1)) { continue };
					if ((self.config.accessories[i].batteryRef == null) && (deviceBattery != (-1)))
					{
						console.log(chalk.magenta.bold("Device Reference #: " + self.config.accessories[i].ref 
						+ " identifies as a battery operated device, but no battery was specified. Adding a battery reference: " + deviceBattery));
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
			}) // end then's function
		.then (()=> 
			{
				//////////////////  Identify all of the HomeSeer References of interest  ////////////
				// These are used to obtain status data from HomeSeer

				var allHSRefs = [];
					allHSRefs.pushUnique = function(item) //Pushes into onto stack if it isn't null. Can be chained!
						{ 
	
							if (item === undefined) return this;
							if (item == null) return this;
							if (isNaN(item)) throw new SyntaxError("You specified: '" + item +"' as a HomeSeer references, but it is not a number. You need to fix it to continue");
							if (!Number.isInteger(parseFloat(item))) throw new SyntaxError("You specified: '" + item +"' as a HomeSeer references, but it is not an Integer. You need to fix it to continue");
							if (this.indexOf(item) == -1) this.push(parseInt(item)); 
								return this
						}
			
				for (var i in this.config.accessories) 
				{
					// Gather every reference that isn't undefined or null!
					allHSRefs
						.pushUnique(this.config.accessories[i].ref)
						.pushUnique(this.config.accessories[i].batteryRef)
						.pushUnique(this.config.accessories[i].obstructionRef)
						.pushUnique(this.config.accessories[i].stateRef)
						.pushUnique(this.config.accessories[i].controlRef)
						.pushUnique(this.config.accessories[i].doorSensorRef)	
						.pushUnique(this.config.accessories[i].humidityRef)
						.pushUnique(this.config.accessories[i].humidityTargetRef)
						.pushUnique(this.config.accessories[i].coolingSetpointRef)
						.pushUnique(this.config.accessories[i].heatingSetpointRef)
				} // end for
				
				for (var j =0; j< allHSRefs.length; j++)
				{
					// console.log(chalk.cyan.bold("*Debug* - Checking allHSRefs has references: " + allHSRefs[j] + " at location: " + j ));
					if(_statusObjects[allHSRefs[j]] === undefined) _statusObjects[allHSRefs[j]] = [];
					_HSValues[allHSRefs[j]] = parseFloat(0);
				}
								
				allHSRefs.sort( (a,b) => (a-b) ); // the internal function (a,b) => (a-b) causes a numeric order sort instead of alpha!
				
				// console.log(chalk.cyan.bold("*Debug* - All HomeSeer References Identified in config.json are: " + allHSRefs.concat()  ));

				/////////////////////////////////////////////////////////////////////////////////

				// Then make a HomeKit device for each "regular" HomeSeer device.
				this.log("Fetching HomeSeer devices.");

				// URL to get status on everything.
				allStatusUrl = this.config["host"] + "/JSON?request=getstatus&ref=" + allHSRefs.concat();

				// now get the data from HomeSeer and pass it as the 'response' to the .then stage.
				return promiseHTTP({ uri: allStatusUrl, json:true})	
				
			}) // End of gathering HomeSeer references
		.catch((err) => 
			{
				console.log(magenta("Error Gathering HomeSeer Device References: " + err));
				err = red(err + " Check if HomeSeer is running, then start homebridge again.");
				throw err;
			})
		
		// Next - For each device value retrieved from HomeSeer, store it in the _HSValues array 
		// and  create HomeKit Accessories for each accessory in the config.json 'accessories' array!		
		.then( function(response) 
			{  
				for(var i in response.Devices)
				{
					_HSValues[response.Devices[i].ref] = parseFloat(response.Devices[i].value);
				}
				
				this.log('HomeSeer status function succeeded!');
				for (var i in this.config.accessories) {
					let index = response.Devices.findIndex( (element, index, array)=> {return (element.ref == this.config.accessories[i].ref)} )
					// Set up initial array of HS Response Values during startup
				try 
				{
					var accessory = new HomeSeerAccessory(that.log, that.config, this.config.accessories[i], response.Devices[index]);
				} catch(err) 
					{
						console.log(chalk.magenta.bold(
						"\n\n** Error ** creating new HomeSeerAccessory in file index.js.\n" +
						"This may be the result of specifying an incorrect HomeSeer reference number in your config.json file. \n" +
						"Check all reference numbers and be sure HomeSeer is running. Stopping operation\n" +
						"Check Accessory No: " + (i+1) + ", of type: "+ this.config.accessories[i].type +", and which identifies a reference No.: " + this.config.accessories[i].ref + "\n"
						)); 
						console.log(chalk.red.bold(err));	
						throw err
					}			
					foundAccessories.push(accessory);
				} //endfor.
				return response
			}.bind(this))
		.catch((err) => 
			{
				console.log("Error setting up Devices: " + err);
				err = chalk.red.bold(err + " Check if HomeSeer is running, then start homebridge again.");
				throw err;
			})
		// Next - if prior .then block was completed without errors, next step is to return all the values to HomeBridge
		.then((response)=> 
			{
				callback(foundAccessories);
				updateAllFromHSData();
				return response
			})
		// Next step is to check if HomeSeer's ASCII control port is enabled and to make a connection to that port
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
					// this.log(green("Attempting connection to HomeSeer ASCII Port: "));
					var client;
				client = net.createConnection({port:ASCIIPort, host:uri.host}, ()=> {resolve(true)});
					
				client.on('connect', () =>
					{
						this.log(green("Successfully connected to ASCII Control Interface of HomeSeer. Instant Status Enabled."));
						instantStatusEnabled = true;
						// resolve(true);
					});	
				
				// Next, set up an event listener to receive any change data from HomeSeer and then update HomeKit				
				client.on('data', (data) => 
						{

							var myData = new HSData(data.toString().slice(0, -2).split(","));
							
							//Only need to do an update if there is HomeKit data associated with it!
							// Which occurs if the _statusObjects array has a non-zero length for the reference reported.
							if( _statusObjects[myData.ref])
							{
								this.log("Received HomeSeer status update data for HomeSeer device: " + cyan(myData.ref) +", new value: " + cyan(myData.newValue) + ", old value: " + cyan(myData.oldValue));
								_HSValues[myData.ref] = 	parseFloat(myData.newValue);	

								var statusObjectGroup = _statusObjects[myData.ref];
								for (var thisCharacteristic in statusObjectGroup)
								{
									updateCharacteristicFromHSData(statusObjectGroup[thisCharacteristic], myData.ref);
								}
							} 
						});
					var numAttempts = 0;
					// If the status port closes, print a warning and then try to re-open it in 30 seconds.
					client.on('close', () => 
						{
							this.log(red("* Warning * - ASCII Port closed - Instant Status Failure!. Restart system if failure continues."));
							
							// Try to re-connect every 30 seconds If there is a failure, another error will be generated
							// which will cause this code to run again.
							setTimeout( ()=>
							{
								numAttempts = numAttempts +1;
								try
								{
									this.log(red("Attempting to re-start ASCII Port Interface, Attempt: " + numAttempts));
									// client = net.createConnection({port:ASCIIPort, host:uri.host});
									client.connect({port:ASCIIPort, host:uri.host});
								} catch(err)
								{
									this.log(red("Attempt not successful with error: "));
								}
							}, 30000); // Try to connect every 30 seconds
						
						});
				
					// If there is an error setting up the ASCII status port, print a message. Note that client.on('close', ...) is automatically called
					// by the 'error' listener and will cause code to try and re-open the port after 30 seconds. A new error is raised and this cycle repeats
					// if that fails.
					client.on('error', (data) => 
						{
							this.log(red("* Warning * - Unable to connect to HomeSeer ASCII Port: " + ASCIIPort + ". Instant Status Not Enabled."));
							if (ASCIIPort != 11000) 
							{
							this.log(red("ASCIIPort configuration value of: " + ASCIIPort + " is unusual. Typical value is 11000. Check setting."));
							}
							this.log(yellow('To enable ASCII Port / Instant Status, see WIKI "Instant Status" entry at:'));
							this.log(yellow("https://github.com/jvmahon/homebridge-homeseer/wiki/Enable-Instant-Status-(HomeSeer-ASCII-Port)"));
							resolve(false)
						});
					// resolve (true);
				});
			})
		// Next, set up the Polling mechanism as a 'backup' to the instant status.  If instant status is enabled, poll less frequently.	
		.then((instantStatusEnabled) =>
			{

				// This is the new Polling Mechanism to poll all at once.	
				// If instantStatusEnabled is true, then poll less frequently (once per minute);
				
				// this.log(chalk.yellow.bold("Monitoring HomeSeer Device Status for references: " + allHSRefs.concat()));

				if(instantStatusEnabled)
				{
					this.config.platformPoll = 30;
					this.log(green("Reducing HomeSeer polling rate to: ") + cyan(this.config.platformPoll) + green(" seconds."))

				}
				else{
					this.log(red("Instant Status Was Not Enabled"));
				}
					//set the polling interval.
					setInterval( function () 
					{
						// Now do the poll
						promiseHTTP({ uri: allStatusUrl, json:true})
							.then( function(json) 
								{
									_currentHSDeviceStatus = json.Devices;
									that.log(cyan("Poll # " + pollingCount) + ": Retrieved values for " + cyan(_currentHSDeviceStatus.length) + " HomeSeer devices.");
									if(instantStatusEnabled == false && ((pollingCount % 5) == 0)) // only display once every 5 polls!
									{
										that.log(red("* Warning * - Instant status not enabled. Operating in polling mode only which may degrade performance."));
										that.log(red('To enable ASCII Port / Instant Status, see WIKI "Instant Status" entry at:'));
										that.log(red("https://github.com/jvmahon/homebridge-homeseer/wiki/Enable-Instant-Status-(HomeSeer-ASCII-Port)"));											
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
			/*
			.then( (data)=>
			{
				_HSValues.forEach( (element, index) => 
				{
					promiseHTTP({ uri: HomeSeerHost + "/JSON?request=getstatus&ref=" + index, json:true})
					.then( (jsonData) => 
						{
							console.log("Testing Comunications with HomeSeer - retrieved data value: " + jsonData.Devices[0].value +", for reference: " +index)
							
							promiseHTTP({ uri: HomeSeerHost + "/JSON?request=controldevicebyvalue&ref=" + index + "&value=" + jsonData.Devices[0].value, json:false})
							.catch((error) => 
								{
									console.log(red("Failed to Access HomeSeer device with reference: " + index ));
									console.log(red(error));
								});
							return true;
						})
					.catch((error) => 
						{
						console.log(red("Failed Accessing HomeSeer Device with Reference: " + index))
						});

				})
			});
			*/
	}
}




function HomeSeerAccessory(log, platformConfig, accessoryConfig, status) {
    HomeSeer.log = this.log = log;
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

	// setHSValue function should be bound by .bind() to a HomeKit Service Object Characteristic!
	setHSValue: function (level, callback) {
		
		// console.log(chalk.magenta.bold("* Debug * - setHSValue called with level: " + level +", for item type: " + this.displayName));
		
		// Pass all the variables and functions used. There's probably a cleaner way to do this with module.exports but this works for now!
		this.log = HomeSeer.log;
		DataExchange.sendToHomeSeer(level, HomeSeerHost, Characteristic, Service, forceHSValue, getHSValue, instantStatusEnabled, this);
  
		// Strange special case of extra poll needed for window coverings that are controlled by a binary switch.
		// But which were adjused using the slider. If poll isn't done, then the icon remains in a changing state until next poll!
		// If the slider set a target state that wasn't 0 or 100
		if (this.UUID == Characteristic.CurrentPosition.UUID || this.UUID == Characteristic.TargetPosition.UUID)
		{
				setTimeout ( ()=>
				{
					// console.log(chalk.cyan.bold("Window Covering Extra Polling!"));
					var statusObjectGroup = _statusObjects[this.HSRef];
					for (var thisCharacteristic in statusObjectGroup)
					{
						updateCharacteristicFromHSData(statusObjectGroup[thisCharacteristic], this.HSRef);
					}
				}, 500);
		} 
		callback(null);

	},
	
	// blindly transmit a particular value to HomeSeer
	transmitToHS: function(level, ref)
	{
		this.log("Transmitting to HomeSeer device: " + cyan(ref) +", a new value: " + cyan(level));
		var url = HomeSeerHost + "/JSON?request=controldevicebyvalue&ref=" 
					+ ref + "&value=" + level;

		promiseHTTP(url)
			.then( function(returnData) {
				if(returnData.trim() == "error")
				{
					console.log(red("transmitToHS Error sending: " + level +", to: " + ref ));
					return false
				}
				else 
				{
					return true;
				}
			})
			.catch(function(err)
				{ 	
				console.log(red("transmitToHS function Failed with error: " + err ));
				return false;
				}
			);
	},
	
    getServices: function () {
				
        var services = [];

		// The following function gets all the services for a device and returns them in the array 'services' 
		// and also populates the '_statusObjects' array with the Characteristics that need to be updated
		// when polling HomeSeer
		HKSetup.setupServices(this, services, _statusObjects, Characteristic, Service, getHSValue);
	
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

function updateCharacteristicFromHSData(characteristicObject, HSReference)
{
	// This performs the update to the HomeKit value from data received from HomeSeer
	DataExchange.processDataFromHomeSeer(characteristicObject, HSReference, this, Characteristic, Service, getHSValue);
}

function updateAllFromHSData()
{
	for (var HSReference in _statusObjects)
	{
		var statusObjectGroup = _statusObjects[HSReference];
		// console.log(chalk.magenta.bold("* Debug * - Updating for reference " + HSReference + " a group with length " + statusObjectGroup.length));
		for (var thisCharacteristic in statusObjectGroup)
		{
		updateCharacteristicFromHSData(statusObjectGroup[thisCharacteristic], HSReference);
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
	try
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
			// console.log(green("Found a Root Device with associated devices: " + rootDevice.associated_devices));
			
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
	catch(err)
	{
		console.log(chalk.yellow.bold("Warning - Error Executing Find Battery Function for device with HomeSeer reference: " + findRef));
		console.log(chalk.yellow.bold("Find Battery function may not function for non-Z-Wave devices. Manually specify your battery! " ));
		console.log(chalk.yellow.bold("Error: " + err));
		return(-1);
	}
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

