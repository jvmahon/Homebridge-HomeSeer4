'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

var checkDefaults = require("../lib/DeviceDefaults");

var globals = require("../index.js").globals;
var HomeSeerData = require("../index.js").HomeSeer;

var parseBoolean = function(value)
{
	if (typeof value == "boolean") return value;
	
	if (value === 0) return false;
	if (value === 1) return true;
	
	if (typeof value == "string") {
		switch(value.toLowerCase())
		{
			case("1"):
			case("true"):
				return true;
				break;
			case("0"):
			case("false"):
				return false;
				break;
			default:
				var error = red("Boolean true/false expected but value: ") + cyan(value) + red(" Is not a Valid boolean")
				throw new TypeError(error);
		} 
	}
}

var alreadyUsedUUIDbase;
var usedUUIDs = [];

var alreadyUsedUUIDbase = function(uuid_base) {
	if( usedUUIDs.indexOf(uuid_base) == -1 ){
		usedUUIDs.push(uuid_base);
		return false;
	} else {
		return true;
	}
}
exports.alreadyUsedUUIDbase = alreadyUsedUUIDbase;

var config;
var checkConfig = function(config) {
	var error = [];

	try  { 
		globals.log(green("Checking Configuration Data"));
		 // it = the configuration device for this accessory

		config.accessories.forEach((it) => {
			// This is used for reporting changes at the close of the for loop.
			const initialData = JSON.stringify(it) ;

			//	Make sure the specified HomeSeer device references are all numbers
			// globals.log(yellow("*Debug* - it is: " + JSON.stringify(it)));
			
			if (it.ref === undefined) {
				error =  red("config.json error for device of type: ")
					+ cyan(it.type) + red(" missing mandatory ")
					+ cyan("'ref'") + red(" property. Specified properties are: "
					+ cyan( JSON.stringify(it ))) 
				throw new SyntaxError(error);
			}
			if( isNaN(it.ref)) {
				error =  red("config.json error for device name: ")
					+ cyan(it.name) + red(" ref value is not a number for ref: ")  + cyan(it.ref);
				throw new TypeError(error);
			}
			
			if (it.type == "Lightbulb") {
				let isVariable = HomeSeerData.supportsDimming(it.ref) 
				it.type = (isVariable) ? "DimmingLight": "BinaryLight"
			} else if (it.type == "Window") {
				let isVariable = HomeSeerData.supportsDimming(it.ref) 
				it.type =  (isVariable) ? "VariableWindow" : "BinaryWindow"
			} else if (it.type == "WindowCovering") {
				let isVariable = HomeSeerData.supportsDimming(it.ref) 
				it.type =  (isVariable) ? "VariableWindowCovering" : "BinaryWindowCovering"
			} else if (it.type == "Fan") {
				let isVariable =  HomeSeerData.supportsDimming(it.ref) 
				it.type =  (isVariable) ? "MultilevelFan" : "BinaryFan"
			}
			// Find the HomeSeer device corresponding to the current it item.
			let findRef = it.ref || 0;

			// Name the unnamed! Maximum name length is 64
				it.name ??= (HomeSeerData.getLocation(findRef) + " " + HomeSeerData.getName(findRef)).slice(0,64)
				
			// If the user has not specified a .uuid_base, create one.
				it.uuid_base ??= "Ref" + it.ref;
				
			it.interface_name = HomeSeerData.getInterfaceName(findRef) || "Unknown";

			// Make sure that each uuid_base is used only once!
			if(alreadyUsedUUIDbase(it.uuid_base)) {
				error =  red("ERROR: config.json error for device name: ") 	+ cyan(it.name) 
						+ red(", of type: ")  + cyan(it.type)
						+ red(" Device base_uuid already used for base_uuid: ") + cyan(it.uuid_base)
						+ red(". If you have intentionally used the same HomeSeer reference for more than one device, you need to manually set the 'uuid_base' values in config.json for these devices. Don't use the label 'Ref' followed by a number, but any other non-duplicate value should work!");

				throw new SyntaxError(error);
			}			
			
			//////////////////   Battery Checking ////////////
			
			// globals.log(magenta("*Debug* - Found Batteries: " + findBattery(it.ref) ));
			var deviceBattery = undefined
			
			if (it.batteryRef === 0) {
				globals.log(chalk.red(`You manually set a batteryRef to a value of 0. This inhibits automatic battery checking. No battery will be set for device: ${it.ref}` ));
			} else {
				deviceBattery = HomeSeerData.findBattery(it.ref);
			}
			if (deviceBattery)
			{
				if (it.batteryRef === undefined ||  it.batteryRef == null)  {
					globals.log(yellow("Added a battery to device#: " + it.ref ));
					it.batteryRef = deviceBattery;
				} else {
					if (it.batteryRef != deviceBattery)  {
						globals.log(
								red("Wrong battery Specified for device Reference #: ") 
								+ cyan(it.ref)
								+ red(" You specified reference: ") 
								+ cyan(it.batteryRef) 
								+ red(" but correct device reference appears to be: ") 
								+ cyan(deviceBattery)
								+ red(". Fixing error."));
								
						it.batteryRef = deviceBattery;
					}	
				}

				if ((deviceBattery == false) && (it.batteryRef)  ) {
					globals.log(yellow("You specified battery reference: "+ it.batteryRef + " for device Reference #: " + it.ref 
					+ " but device does not seem to be battery operated. Check config.json file and fix if this is an error."));
				}	
			}
			
			//////////////////////////////////////////

			// If type is undefined, default based on Z-Wave type or if all else fails, to a lightbulb!
			if (it.type === undefined) {
				throw new SyntaxError( red("*Error* - Device specified in config.json with undefined 'type' property. Correct error and retry HomeBridge"))
			}

			// Has a valid type been specified?		
			if (checkDefaults.hasValidType(it) == false) {
				error = 	red("config.json settings error for device name: ") 
						+ 	cyan(it.name) 
						+ 	red(", Incorrect device type: ") + cyan(it.type);
				throw new SyntaxError(error);
			}
				
			// Check that the config.json entry only specifies valid properties - no typos!
			checkDefaults.hasValidProperties(it); // This will throw an error if properties are incorrect!
			
			// Make sure it has its mandatory properties
			if( checkDefaults.hasMandatoryProperties(it) == false) { 
				error = red("config.json settings error for device name: ") + cyan(it.name) 
								+ red(": is missing a mandatory property.")
				throw new SyntaxError(error)
			};

			// check the remaining properties and fill in default values for any
			// that need to be there but haven't been specified.
			checkDefaults.setMissingDefaults(it)
			
			
			// Any Additional type-specific checking is performed here!
			switch(it.type)
			{
				case ("Window"):
				case ("WindowCovering"):
					if(CurrentHomeSeerDevice.device_type_string == "Z-Wave Switch Binary") { 
						it.binarySwitch = true; 
					} else if(it.binarySwitch != null) {
						it.binarySwitch = parseBoolean(it.binarySwitch) 	
					} 
					break
			
				case ("Valve"):
					if (it.useTimer) {
						checkDefaults.setMissingDefaults(it, "minTime");
					}
					break;
			} // end switch.

			//	Make sure the specified HomeSeer device references are all numbers
			if((it.batteryRef != null) && (isNaN(it.batteryRef))) {
				error =  red( "config.json error for device name: ") 
						+ cyan(it.name)
						+ red(" batteryRef value is not a number for associated HomeSeer ref: " )
						+ cyan(it.ref);
				throw new TypeError(error);
			}

			var finalData = JSON.stringify(it)
			initialData
		})	

		return true;
	} catch(err) {
		throw err;
		return false;
	} 
}
exports.checkConfig = checkConfig;
