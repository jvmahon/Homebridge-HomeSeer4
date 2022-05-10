'use strict';
var fetch  = require("node-fetch");
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var cyan = chalk.cyan.bold;

const HomeSeerSystem = require('./lib/HomeSeerSystemObject');
const HomeSeerData = new HomeSeerSystem();
		
var exports = module.exports;
module.exports.HomeSeer = HomeSeerData;

var globals = []																										
module.exports.globals = globals;

var HSutilities = require("./lib/HomeSeerUtilities");
var HKSetup = require("./lib/HomeKitDeviceSetup");
var Listen = require("./lib/Setup Listener");

var Accessory, Service, Characteristic, UUIDGen;

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
    accessories: async function (callback) {
        var foundAccessories = [];
		var that = this;
		
		if((globals.platformConfig["login"] == null) || (globals.platformConfig["password"] == null )) {
				globals.log(red("*Warning* - You failed to define a login and password in your config.json file. Will attempt login using default HomeSeer login and password of default:default"));
		}

		globals.log(green("Start"));
	
		var getTestInfo =   await HomeSeerData.initialize( globals.platformConfig["host"], globals.platformConfig["login"], globals.platformConfig["password"], globals.platformConfig["ASCIIport"],  );
			globals.log(green("End"));

		console.log("Creating HomeKit devices from HomeSeer data.");
		
		// Make Devices for each 'Event' entry in the config.json file.
			globals.platformConfig?.events?.forEach((currentEvent)=>  {
				var createdEvent = new HomeSeerEvent(currentEvent);
				foundAccessories.push(createdEvent);
			})
			
		// if the user has pecified devices in the config.json file using device categories, expand each device into a separate "accessories" array entry.
			globals.platformConfig.accessories ??= [];
			var deviceCategories = [
				{category: "DimmingLights", 			typeLabel:"DimmingLight"},
				{category: "BinaryLights", 			typeLabel:"BinaryLight"},
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
				{category: "Valves",					typeLabel:"Valve"},						
				{category: "SecuritySystems",			typeLabel:"SecuritySystem"}	
				]

			deviceCategories
				.filter((it) => globals.platformConfig[it.category] !== undefined)
				.forEach((thisCategory)=> {
					globals.platformConfig.accessories = globals.platformConfig.accessories.concat(

					globals.platformConfig[thisCategory.category].map( (HSreference)=>  { 
							return( { "type":thisCategory.typeLabel, "ref":HSreference} );
						})
					);
			})
		// end of expanding devices into accessories arrays!	

		// Check entries in the config.json file to make sure there are no obvious errors.		
		HSutilities.checkConfig(globals.platformConfig);			

		globals.platformConfig.accessories.forEach((currentAccessory)=> {
			var thisDevice, accessory;
			// Set up initial array of HS Response Values during startup
				try {
					thisDevice = HomeSeerData.HomeSeerDevices[currentAccessory.ref].status;						
					accessory = new HomeSeerAccessory(that.log, that.config, currentAccessory, thisDevice);
					foundAccessories.push(accessory);
					
				} catch(err) {
					globals.log(red(`${err} resulting in problem creating new HomeSeerAccessory. This may be the result of specifying an incorrect HomeSeer reference number in your config.json file. You specified reference ${cyan(currentAccessory.ref)}, Check all reference numbers and be sure HomeSeer is running. Stopping homebridge.`))
					
					throw err;
				}			
		});
		callback(foundAccessories);
		Listen.setupHomeSeerTelnetPort()
	}
}

function HomeSeerAccessory(log, platformConfig, accessoryConfig, status) {
    this.config = accessoryConfig;
    this.ref = status.ref;
    this.name = this.config.name || status.name
    this.model = status.device_type_string || "Not Specified";
    
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
    this.name = eventConfig.name || eventConfig.eventName
    this.model = "HomeSeer Event";
	
	const 	onURL = new URL(globals.platformConfig["host"]);
		onURL.password = globals.platformConfig["password"] || "default";
		onURL.username = globals.platformConfig["login"] || "default";
		onURL.pathname = "JSON";
		onURL.search = "request=runevent&group=" + encodeURIComponent(eventConfig.eventGroup) + "&name=" + encodeURIComponent(eventConfig.eventName)

    this.on_url = onURL.href;

    if (eventConfig.offEventGroup && eventConfig.offEventName) {
		
	const 	offURL = new URL(globals.platformConfig["host"]);
		offURL.password = globals.platformConfig["password"] || "default";
		offURL.username = globals.platformConfig["login"] || "default";
		offURL.pathname = "JSON";
		offURL.search = "request=runevent&group=" + encodeURIComponent(eventConfig.offEventGroup) + "&name=" + encodeURIComponent(eventConfig.offEventName)
		
        this.off_url = offURL.href;
    }
	this.uuid_base = eventConfig.uuid_base || (this.name) ;
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
					
		fetch(url)
			.then( function(htmlString) {
					globals.log(this.name + ': launchEvent function succeeded!');
					callback(null);
						
				if(this.off_url == null && value != 0) {
					setTimeout(function() {
						this.switchService.getCharacteristic(Characteristic.On).setValue(0);
					}.bind(this), 2000);
				}	
			}.bind(this))
			.catch(function(err) { 	globals.log(this.name + ': launchEvent function failed: %s', err);
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
            .on('set', this.launchEvent.bind(this))
			.name = this.config.name;
			
        services.push(this.switchService);

        return services;
    }
}

module.exports.platform = HomeSeerPlatform;

////////////////////    End of Polling HomeSeer Code    /////////////////////////////		


