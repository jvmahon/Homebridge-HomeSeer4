'use strict';

var exports = module.exports;
var globals = [];
globals.allHSDevices = [];
globals.allHSDevices.controlPairs = [];
exports.globals = globals;


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


// Currently the HomeSeer variable is used as a global to allow access to the log variable (function) 
var HomeSeer = [];



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
globals.getHSValue = getHSValue;

function findControlPairByCommand(ref, command)
{
	
		let validCommands = [ 
		{label: "NotSpecified", 	controlValue: 0},
		{label: "On", 				controlValue: 1},
		{label: "Off", 				controlValue: 2},
        {label: "Dim", 				controlValue: 3},
        {label: "OnAlternate", 		controlValue: 4},
        {label: "Play", 			controlValue: 5},
        {label: "Pause", 			controlValue: 6},
        {label: "Stop", 			controlValue: 7},
        {label: "Forward", 			controlValue: 8},
        {label: "Rewind", 			controlValue: 9},
        {label: "Repeat", 			controlValue: 10},
        {label: "Shuffle", 			controlValue: 11},
        {label: "HeatSetPoint", 	controlValue: 12},
        {label: "CoolSetPoint", 	controlValue: 13},
        {label: "ThermModeOff", 	controlValue: 14},
        {label: "ThermModeHeat", 	controlValue: 15},
        {label: "ThermModeCool", 	controlValue: 16},
        {label: "ThermModeAuto", 	controlValue: 17},
        {label: "DoorLock", 		controlValue: 18},
        {label: "DoorUnLock", 		controlValue: 19},
        {label: "ThermFanAuto", 	controlValue: 20},
        {label: "ThermFanOn", 		controlValue: 21},
        {label: "ColorControl", 	controlValue: 22},
        {label: "DimFan", 			controlValue: 23},
        {label: "MotionActive", 	controlValue: 24},
        {label: "MotionInActive", 	controlValue: 25},
        {label: "ContactActive", 	controlValue: 26},
        {label: "ContactInActive", 	controlValue: 27},
        {label: "Mute", 			controlValue: 28},
        {label: "UnMute", 			controlValue: 29},
        {label: "MuteToggle", 		controlValue: 30},
        {label: "Next", 			controlValue: 31},
        {label: "Previous", 		controlValue: 32},
        {label: "Volume", 			controlValue: 33}
			]
		
			/* globals.log(cyan(	"\nContent of globals variable is: " + Object.getOwnPropertyNames(globals)
						+	"\nContent of globals.api variable is: " + Object.getOwnPropertyNames(globals.api)
						+	"\nContents of globals.platformConfig variable is: " + Object.getOwnPropertyNames(globals.platformConfig)
						+	"\nContents of globals.config.platform variable is: " + globals.platformConfig.platform
						+ "\nStructure of globals.allHSDevices variable is: " + Object.getOwnPropertyNames(globals.allHSDevices)

						));
						*/
		var index;
		if (isNaN(command))
		{
			index = validCommands.findIndex( (element) => { return ( element.label.toLowerCase() == command.toLowerCase() )});
			command = validCommands[index].controlValue;
		}
						
	// Next line searches for the HomeSeer Device by its reference.					
	index = globals.allHSDevices.controlPairs.findIndex( (element) => {return(element.ref == ref)})
	if (index != -1) globals.log(yellow("*Debug* - Found Device for reference: " + ref + " at index " + index));
	
	//Then get its set of ControlPairs
	var allThisDevicesControls = globals.allHSDevices.controlPairs[index].ControlPairs;
	// globals.log(yellow("Control pairs are: " + JSON.stringify(allThisDevicesControls)));
	
	//Then check if the ControlPairs has a pair matching the specified command.
	var thisCommandControl = allThisDevicesControls.findIndex( (element) => {return ( element.ControlUse == command)});
	// globals.log(cyan("This command's controls are: " + JSON.stringify(thisCommandControl)));

	
		if (thisCommandControl != -1) {
					globals.log(yellow("*Debug* - Found Matching Control Pairs for reference:  " + ref + ", command: " + command));
					return (allThisDevicesControls[thisCommandControl]);
		}
		if (thisCommandControl == -1) { 
					globals.log(yellow("*Debug* - No matching control pair for reference:  " + ref + ", command: " + command));
					return(null);
			};

}
globals.findControlPairByCommand = findControlPairByCommand;


function forceHSValue(ref, level)
{
		// This function is used to temporarily 'fake' a HomeSeer poll update.
		// Used when, e.g., you set a new value of an accessory in HomeKit - this provides a fast update to the
		// Retrieved HomeSeer device values which will then be "corrected / confirmed" on the next poll.
		 _HSValues[ref] = parseFloat(level);
		
		// Debugging
		// console.log("** DEBUG ** - called forceHSValue with reference: %s,  level: %s, resulting in new value: %s", ref, level, _HSValues[ref]);
}
 globals.forceHSValue = forceHSValue;

function HomeSeerPlatform(log, config, api) {

	if(!config) return([]);

	this.log = log;
    this.config = config;

		globals.log = log; 
		globals.platformConfig = config; // Platform variables from config.json:  platform, name, host, temperatureScale, lightbulbs, thermostats, events, accessories
		globals.api = api; // _accessories, _platforms, _configurableAccessories, _dynamicPlatforms, version, serverVersion, user, hap, hapLegacyTypes,platformAccessory,_events, _eventsCount
		
		globals.log(yellow(	"\nContent of globals variable is: " + Object.getOwnPropertyNames(globals)
						+	"\nContent of globals.api variable is: " + Object.getOwnPropertyNames(globals.api)
						+	"\nContents of globals.platformConfig variable is: " + Object.getOwnPropertyNames(globals.platformConfig)
						+	"\nContents of globals.config.platform variable is: " + globals.platformConfig.platform

						));

}


HomeSeerPlatform.prototype = 
{
	
    accessories: async function (callback) 
	{
        var foundAccessories = [];
		var that = this;


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
	
		// If the config.json file contains a "lightbulbs =" group of references, add them to the accessories array as "type":"Lightbulb"
		if(this.config.lightbulbs) 
		{
			this.config.accessories = this.config.accessories.concat(
					this.config.lightbulbs.map( (HSreference)=> { return( { "type":"Lightbulb", "ref":HSreference} );})
					);
		}
		// Done with Map










		let self = this;	// Assign this to self so you can access its values inside the promise.
		var allStatusUrl = "";
		self.log(green("this is the value of self: \n" + Object.getOwnPropertyNames(self)));
			
		var getStatusInfo = promiseHTTP({ uri: this.config["host"] + "/JSON?request=getstatus", json:true})
		.then( function(HSDevices)
			{

				globals.allHSDevices.HSdeviceStatusInfo = HSDevices.Devices; 
	
					
				// Check entries in the config.json file to make sure there are no obvious errors.		
				HSutilities.checkConfig.call(self, self.config, globals.allHSDevices);

				return (1);
			}) // end then's function
			.catch( (err) => 
			{
				if( err.message.includes("ECONNREFUSED") ) 
					{
						err = red( err + "\nError getting device status info. Check if HomeSeer is running, then start homebridge again.");
					}
				throw err;
			} )
		
		var getControlInfo = promiseHTTP({ uri: this.config["host"] + "/JSON?request=getcontrol", json:true})
			.then( function(HSControls)
			{

				globals.allHSDevices.controlPairs = HSControls.Devices;
				return(true);
		
			})
		.catch( (err) => 
			{
				if( err.message.includes("ECONNREFUSED") ) 
					{
						err = red( err + "\nError getting device control info. Check if HomeSeer is running, then start homebridge again.");
					}
				throw err;
			} )
			
		Promise.all([getStatusInfo, getControlInfo]).then(()=> 
			{
				//////////////////  Identify all of the HomeSeer References of interest  ////////////
				// These are used to obtain status data from HomeSeer

				var allHSRefs = [];
					allHSRefs.pushUnique = function(item) //Pushes item onto stack if it isn't null. Can be chained!
						{ 
	
							if (item === undefined) return this;
							if (item == null) return this;
							if (isNaN(item) || (!Number.isInteger(parseFloat(item)))) throw new SyntaxError("You specified: '" + item +"' as a HomeSeer references, but it is not a number. You need to fix it to continue");
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
						.pushUnique(this.config.accessories[i].tamperRef)
				} // end for
				
				for (var j =0; j< allHSRefs.length; j++)
				{
					// console.log(cyan("*Debug* - Checking allHSRefs has references: " + allHSRefs[j] + " at location: " + j ));
					if(_statusObjects[allHSRefs[j]] === undefined) _statusObjects[allHSRefs[j]] = [];
					_HSValues[allHSRefs[j]] = parseFloat(0);
				}
								
				allHSRefs.sort( (a,b) => (a-b) ); // the internal function (a,b) => (a-b) causes a numeric order sort instead of alpha!
				
				// console.log(cyan("*Debug* - All HomeSeer References Identified in config.json are: " + allHSRefs.concat()  ));

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
						console.log(
							magenta( "\n\n** Error ** creating new HomeSeerAccessory in file index.js.\n" 
							+ "This may be the result of specifying an incorrect HomeSeer reference number in your config.json file. \n" 
							+ "Check all reference numbers and be sure HomeSeer is running. Stopping operation\n" 
							+ "Check Accessory No: ") 
							+ cyan(i+1) 
							+ magenta(", of type: ")
							+ cyan(this.config.accessories[i].type) 
							+ magenta(", and which identifies a reference No.: ") 
							+ cyan(this.config.accessories[i].ref + "\n")
						); 
						
						console.log(red(err));	
						throw err
					}			
					foundAccessories.push(accessory);
				} //endfor.
				return response
			}.bind(this))
		.catch((err) => 
			{
				throw err;
			})
		// Next - if prior .then block was completed without errors, next step is to return all the values to HomeBridge
		.then((response)=> 
			{
				callback(foundAccessories);
				console.log(magenta("Config is: " + this.config.temperatureScale));
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
				var numAttempts = 0;	
				client.on('connect', () =>
					{
						this.log(green("Successfully connected to ASCII Control Interface of HomeSeer. Instant Status Enabled."));
						numAttempts = 1
						instantStatusEnabled = true;
						// resolve(true);
					});	
			
				// Next, set up an event listener to receive any change data from HomeSeer and then update HomeKit				
				client.on('data', (data) => 
						{
							// console.log(red("Received ASCII data, config host is :" + this.config.host));
							
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
									updateCharacteristicFromHSData(statusObjectGroup[thisCharacteristic], myData.ref, this.config);
								}
							} 
						});

					// If the status port closes, print a warning and then try to re-open it in 30 seconds.
					client.on('close', () => 
						{
							this.log(red("* Warning * - ASCII Port closed - Critical Failure!. Restart system if failure continues."));
							
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
							this.log(red("* Warning * - Unable to connect to HomeSeer ASCII Port: " + ASCIIPort + ". Fatal error"));
							if (ASCIIPort != 11000) 
							{
							this.log(red("ASCIIPort configuration value of: " + ASCIIPort + " is unusual. Typical value is 11000. Check setting."));
							}
							this.log(yellow('To enable ASCII Port, see WIKI "Enable the HomeSeer ASCII Commands Interface Port" entry'));
							resolve(false)
						});
					// resolve (true);
				});
			})
		// Next, set up the Polling mechanism as a 'backup' to ensure status remains synchronized.	
		.then((instantStatusEnabled) =>
			{

				// This is the new Polling Mechanism to poll all at once.	
				// If instantStatusEnabled is true, then poll less frequently (once per minute);
				
				// this.log(yellow("Monitoring HomeSeer Device Status for references: " + allHSRefs.concat()));

				if(instantStatusEnabled)
				{
					this.config.platformPoll = 600;
					this.log(green("Setting HomeSeer polling rate to: ") + cyan(this.config.platformPoll) + green(" seconds."))

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

					}, 60000 // end SetInterval's function
					);	//end setInterval function for polling loop

				return true;
			})
			.catch( (error) => 
			{
				// If you get here without handling the error, then stop and report the error
				this.log(error.message);
				process.exit();
			});
	}
}




function HomeSeerAccessory(log, platformConfig, accessoryConfig, status) {
	this.log = log;
    this.config = accessoryConfig;
    this.ref = status.ref;
    this.name = this.config.name || status.name
    this.model = status.device_type_string;
    this.access_url = globals.platformConfig["host"] + "/JSON?";

    
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
		
		// console.log(magenta("* Debug * - setHSValue called with level: " + level +", for item type: " + this.displayName));
		
		// Pass all the variables and functions used. There's probably a cleaner way to do this with module.exports but this works for now!
		DataExchange.sendToHomeSeer(level, this);
  
		// Need to poll  for window coverings that are controlled by a binary switch.
		// But which were adjusted on the iOS Home app using the slider. If poll isn't done, then the icon remains in a changing state until next poll!
		// when the slider set a target state that wasn't 0 or 100
		if (this.UUID == Characteristic.CurrentPosition.UUID || this.UUID == Characteristic.TargetPosition.UUID)
		{
				setTimeout ( ()=>
				{
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
		var url = globals.platformConfig["host"] + "/JSON?request=controldevicebyvalue&ref=" 
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
		HKSetup.setupServices(this, services, _statusObjects);
	
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

    this.access_url = globals.platformConfig["host"] + "/JSON?";
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

function updateCharacteristicFromHSData(characteristicObject, HSReference, )
{	
	// This performs the update to the HomeKit value from data received from HomeSeer
	DataExchange.processDataFromHomeSeer(characteristicObject, HSReference, this, Characteristic, Service);
}

function updateAllFromHSData()
{
    //console.debug("DEBUG -  Executing updateAllFromHSData()");
	for (var HSReference in _statusObjects)
	{
		var statusObjectGroup = _statusObjects[HSReference];
		// console.log(magenta("* Debug * - Updating for reference " + HSReference + " a group with length " + statusObjectGroup.length));
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

