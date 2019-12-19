'use strict';
var net = require('net');
var promiseHTTP = require("request-promise-native");
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var assert = require('assert');
			

var exports = module.exports;
var globals = new function()
		{
				this.allHSDevices = [];
				this.telnetClient = [];
				this.telnetAuthorized = false;
				this.allHSDevices.controlPairs = [];

				this.allHSRefs = [];
						this.allHSRefs.pushUnique = function(item) //Pushes item onto stack if it isn't null. Can be chained!
							{ 
								if ((item === undefined) || (item == null)) return this;
								if (isNaN(item) || (!Number.isInteger(parseFloat(item)))) throw new SyntaxError("You specified: '" + item +"' as a HomeSeer references, but it is not a number. You need to fix it to continue");
								HSutilities.deviceInHomeSeer(item);
								if (this.indexOf(item) == -1) this.push(parseInt(item)); 
								return this
							}
							
				this.getDeviceName = function(reference)
				{
					if (reference == undefined) return null;
					let name = globals.allHSDevices.HSdeviceStatusInfo.find( (element) => { return (element.ref == reference) }).name
					// console.log(red("Found a device name: " + name));
					
				}


				// The array globals.HSValues) stores just the device value of the associated HomeSeer reference. 
				// This is a sparse array with most index values null.
				// The array index corresponds to the HomeSeer reference so HSValues[211] would be the HomeSeer value for device 211.
				this.HSValues = [];
				this.getHSValue = function(ref) { return this.HSValues[ref] }
				this.setHSValue = function(ref, value) { this.HSValues[ref] = parseFloat(value); }
				this.forceHSValue = this.setHSValue; // Alias for setHSValue function


				 
				 
				// globals.statusObjects holds a list of all of the HomeKit HAP Characteristic objects
				// that can be affected by changes occurring at HomeSeer. 
				// The array is populated during by the getServices function when a HomeKit device is created.
				// After HomeSeer is polled, each item in this array is analyzed by the updateAllFromHSData() function to determine 
				// if it needs to be updated.
				this.statusObjects = [];
		}																																		
module.exports.globals = globals;



var HSutilities = require("./lib/HomeSeerUtilities");
var HKSetup = require("./lib/HomeKitDeviceSetup");
var Listen = require("./lib/Setup Listener");


var Accessory, Service, Characteristic, UUIDGen;
	
	
// Following variable stores the full HomeSeer JSON-ified Device status data structure.
// This includes Device data for all of the HomeSeer devices of interest.
globals.currentHSDeviceStatus = []; 



// Note that the HomeSeer json date in globals.currentHSDeviceStatus is of the following form where globals.currentHSDeviceStatus is an array so
// an index must be specified to access the properties, such as 
//  globals.currentHSDeviceStatus[indexvalue] for a dimmer would be of the form...
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
// var HomeSeer = [];



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



function HomeSeerPlatform(log, config, api) {

	if(!config) return([]);

	this.log = log;
    this.config = config;

		globals.log = log; 
		globals.platformConfig = config; // Platform variables from config.json:  platform, name, host, temperatureScale, lightbulbs, thermostats, events, accessories
		globals.api = api; // _accessories, _platforms, _configurableAccessories, _dynamicPlatforms, version, serverVersion, user, hap, hapLegacyTypes,platformAccessory,_events, _eventsCount
		// var MyPrototypes = require('./lib/AddPrototype.js').addPrototypes(api);
}


HomeSeerPlatform.prototype = 
{
    accessories: function (callback) 
	{
        var foundAccessories = [];
		var that = this;
		
		if((globals.platformConfig["login"] == null) || (globals.platformConfig["password"] == null ))
			{
				globals.log(red("*Warning* - You failed to define a login and password in your config.json file. Will attempt login using default HomeSeer login and password of default:default"));
			}
			
				const 	statusURL = new URL(globals.platformConfig["host"]);
						statusURL.password = globals.platformConfig["password"] || "default";
						statusURL.username = globals.platformConfig["login"] || "default";
						statusURL.pathname = "JSON";
						statusURL.search = "request=getstatus";

						
						globals.log(red("Status URL is: " + statusURL.href));
			
		var getStatusInfo = promiseHTTP({ uri:statusURL.href, json:true})
		.then( function(HSDevices)
			{
				globals.allHSDevices.HSdeviceStatusInfo = HSDevices.Devices; 
				globals.log(yellow("*Debug * - Number of status devices retrieved is: " + HSDevices.Devices.length));
				
				for(var currentDevice of HSDevices.Devices)
				{
					globals.HSValues[currentDevice.ref] = parseFloat(currentDevice.value);
				}

				// Check entries in the config.json file to make sure there are no obvious errors.		
				HSutilities.checkConfig(globals.platformConfig);

				return (1);
			}) // end then's function
			.catch( (err) => 
			{

					switch(err.statusCode)
					{
						case 401:
						{
							globals.log(red("Line 192 - Error is: " + err));
							globals.log(red("*HTTP Error 401 - line 193 * - Improper login and password specified in your config.json setup file. Correct and try again."));
							globals.log(red("URL Is: " + retrieveURL));
							break;
						}
						default:
						{
							globals.log(red( err + " : Error line 198 - error getting device status info. Check if HomeSeer is running and that JSON interface is enabled, then start homebridge again. Status code: " + err.statusCode));
						}
					}

				throw err;
			} )
			
				const 	controlURL = new URL(globals.platformConfig["host"]);
						controlURL.password = globals.platformConfig["password"] || "default";
						controlURL.username = globals.platformConfig["login"] || "default";
						controlURL.pathname = "JSON";
						controlURL.search = "request=getcontrol";
	
			
		globals.log(red("Get Control URL is: " + controlURL.href));
		var getControlInfo = promiseHTTP({ uri:controlURL.href, json:true})
			.then( function(HSControls)
			{

				globals.allHSDevices.controlPairs = HSControls.Devices;
				globals.log(cyan("*Debug * - Number of devices with Control Pairs retrieved is: " + HSControls.Devices.length));

				return(true);
		
			})
		.catch( (err) => 
			{
					switch(err.statusCode)
					{
						case 401:
						{
							globals.log(red("Line 191 - Error is: " + err));
							globals.log(red("*HTTP Error 401 - line 192 * - Improper login and password specified in your config.json setup file. Correct and try again."));
							break;
						}
						default:
						{
							globals.log(red( err + " : Error line 228 - error getting device Control info. Check if HomeSeer is running and that JSON interface is enabled, then start homebridge again. Status code: " + err.statusCode));
						}
					}
				throw err;
			} )
			
			
			

		/////////////////////////////////////////////////////////////////////////////////		
		// Make devices for each HomeSeer event in the config.json file

		// Make Devices for each 'Event' entry in the config.json file.
		if (globals.platformConfig.events) 
		{
			for (var currentEvent of globals.platformConfig.events) 
			{
				var createdEvent = new HomeSeerEvent(currentEvent);
				foundAccessories.push(createdEvent);
			}
		}
	
	// if the user has pecified devices in the config.json file using device categories, expand each device into a separate "accessories" array entry.
		if (globals.platformConfig.accessories === undefined) globals.platformConfig.accessories = [];
		// If the config.json file contains a "lightbulbs =" group of references, add them to the accessories array as "type":"Lightbulb"
		var deviceCategories = [
			{category: "Fans", 						typeLabel:"Fan"},
			{category: "GaragedDoorOpeners",		typeLabel:"GarageDoorOpener"},	
			{category: "Lightbulbs",				typeLabel:"Lightbulb"},	
			{category: "lightbulbs",				typeLabel:"Lightbulb"},				
			{category: "Locks",						typeLabel:"Lock"},			
			{category: "Thermostats",				typeLabel:"ThermostatRoot"},
			{category: "Outlets",					typeLabel:"Outlet"},
			{category: "Switches",					typeLabel:"Switch"},			
			{category: "Windows",					typeLabel:"Window"},			
			{category: "WindowCoverings",			typeLabel:"WindowCovering"},			
			{category: "CarbonDioxideSensors",		typeLabel:"CarbonDioxideSensor"},		
			{category: "CarbonMonoxideSensors",		typeLabel:"CarbonMonoxideSensor"},			
			{category: "ContactSensors",			typeLabel:"ContactSensor"},			
			{category: "HumiditySensors",			typeLabel:"HumiditySensor"},			
			{category: "LeakSensors",				typeLabel:"LeakSensor"},			
			{category: "LightSensors",				typeLabel:"LightSensor"},			
			{category: "MotionSensors",				typeLabel:"MotionSensor"},			
			{category: "OccupancySensors",			typeLabel:"OccupancySensor"},			
			{category: "SmokeSensors",				typeLabel:"SmokeSensor"},			
			{category: "TemperatureSensors",		typeLabel:"TemperatureSensor"},			
			{category: "SecuritySystems",			typeLabel:"SecuritySystem"}	

			
			]
		for (let thisCategory of deviceCategories)
		{
			if( globals.platformConfig[thisCategory.category] !== undefined)
			{
				globals.platformConfig.accessories = globals.platformConfig.accessories.concat(

					globals.platformConfig[thisCategory.category].map( (HSreference)=> 
						{ 
							// globals.log(green("'type': " + thisCategory.typeLabel + ", 'ref':" + HSreference));
							
							return( { "type":thisCategory.typeLabel, "ref":HSreference} );
						})
				);
			}
		}
	// end of expanding devices into accessories arrays!	
			

			
		Promise.all([getStatusInfo, getControlInfo]).then(()=> 
			{

				globals.log("Fetching HomeSeer devices.");

				// now get the data from HomeSeer and pass it as the 'response' to the .then stage.
				// return promiseHTTP({ uri: statusURL.href, json:true})	
				
				
			}) // End of gathering HomeSeer references
		.catch((err) => 
			{
				throw err;
			})
		
		// Next - For each device value retrieved from HomeSeer, store it in the globals.HSValues array 
		// and  create HomeKit Accessories for each accessory in the config.json 'accessories' array!		
		.then( function(response) 
			{  

				
				globals.log('HomeSeer status function succeeded!');
				for (var currentAccessory of globals.platformConfig.accessories) {
					// Find the index into the array of all of the HomeSeer devices
					let thisDevice = globals.allHSDevices.HSdeviceStatusInfo.find( (element, index, array)=> 
						{
							return (element.ref == currentAccessory.ref)
						} )
					// Set up initial array of HS Response Values during startup
						try 
						{
							var accessory = new HomeSeerAccessory(that.log, that.config, currentAccessory, thisDevice);
						} catch(err) 
							{
							globals.log(
								magenta( "\n\n** Error ** creating new HomeSeerAccessory in file index.js.\n" 
								+ "This may be the result of specifying an incorrect HomeSeer reference number in your config.json file. \n" 
								+ "Check all reference numbers and be sure HomeSeer is running. Stopping operation\n")
							); 
							
							globals.log(red(err));	
							throw err
						}			
					foundAccessories.push(accessory);
				} //endfor.
				return response
			})
		.catch((err) => 
			{
				throw err;
			})
		// Next - if prior .then block was completed without errors, next step is to return all the values to HomeBridge
		.then((response)=> 
			{
				callback(foundAccessories);
				Listen.setupHomeSeerTelnetPort()
				updateAllFromHSData();

				return response
			})


	}
}




function HomeSeerAccessory(log, platformConfig, accessoryConfig, status) {
    this.config = accessoryConfig;
    this.ref = status.ref;
    this.name = this.config.name || status.name
    this.model = status.device_type_string || "Not Specified";
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

    getServices: function () {
				
        var services = [];

		// The following function gets all the services for a device and returns them in the array 'services' 
		// and also populates the 'globals.statusObjects' array with the Characteristics that need to be updated
		// when polling HomeSeer
		HKSetup.setupServices(this, services);
	
        return services;
    }
}



////////////////////////////////////////////////////////////////////////////////
//    The following code creates devices which can trigger HomeSeer Events   ///
////////////////////////////////////////////////////////////////////////////////
function HomeSeerEvent(eventConfig) {
    this.config = eventConfig;
    this.name = eventConfig.eventName
    this.model = "HomeSeer Event";

    this.on_url = globals.platformConfig["host"] + "/JSON?request=runevent&group=" + encodeURIComponent(eventConfig.eventGroup) + "&name=" + encodeURIComponent(eventConfig.eventName);

    if (eventConfig.offEventGroup && eventConfig.offEventName) {
        this.off_url = globals.platformConfig["host"] + "/JSON?request=runevent&group=" + encodeURIComponent(eventConfig.offEventGroup) + "&name=" + encodeURIComponent(eventConfig.offEventName);
    }

    if (eventConfig.uuid_base)
        this.uuid_base = eventConfig.uuid_base;
}

HomeSeerEvent.prototype = {

    identify: function (callback) {
        callback();
    },

    launchEvent: function (value, callback) {
        globals.log("Setting event value to %s", value);

        var url = this.on_url;
        if (value == 0 && this.off_url) {
            url = this.off_url;
        }
			
		promiseHTTP(url)
			.then( function(htmlString) {
					globals.log(this.name + ': launchEvent function succeeded!');
					callback(null);
					
			if(this.off_url==null && value != 0)
            {
                setTimeout(function() {
                    // globals.log(this.name + ': Momentary switch reseting to 0');
                    this.switchService.getCharacteristic(Characteristic.On).setValue(0);
                }.bind(this),2000);
            }
					
			}.bind(this))
			.catch(function(err)
				{ 	globals.log(this.name + ': launchEvent function failed: %s', err);
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


function updateAllFromHSData(pollingCount)
{

	for (let HSReference in globals.statusObjects)
	{
		let statusObjectGroup = globals.statusObjects[HSReference];
		
		for (let homekitObject of statusObjectGroup)
		{
			
			const newValue = globals.getHSValue(HSReference);
			// globals.log(chalk.blue("Emitting Update for object with Homeseer Reference: " + HSReference + " and a new value: " + newValue));

			homekitObject.emit('HSvalueChanged', newValue, homekitObject)
		}
	}
}

globals.updateAllFromHSData = updateAllFromHSData;

////////////////////    End of Polling HomeSeer Code    /////////////////////////////				

module.exports.platform = HomeSeerPlatform;

////////////////////    End of Polling HomeSeer Code    /////////////////////////////		


