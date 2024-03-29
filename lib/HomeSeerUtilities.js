'use strict'
var exports = module.exports;

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
				throw new TypeError(`Boolean true/false expected but value: ${value} is not a Valid boolean`);
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
		globals.log("Checking Configuration Data");
		
		 // it = the configuration device for this accessory
		config.accessories.forEach((it) => {
			// This is used for reporting changes at the close of the for loop.
			const initialData = JSON.stringify(it) ;

			//	Make sure the specified HomeSeer device references are all numbers
	
			if (it.ref === undefined) {
				throw new SyntaxError(`config.json error for device of type: ${it.type} missing mandatory 'ref' property. Specified properties are: ${JSON.stringify(it )}`)
			}
			if( isNaN(it.ref)) {
				throw new TypeError(`config.json error for device name: ${it.name} ref value is not a number for ref: ${it.ref}`)
			}
			
			let isVariable =  HomeSeerData.supportsDimming(it.ref) 
			switch (it.type) {
				case "Lightbulb":
					it.type = (isVariable) ? "DimmingLight": "BinaryLight"
					break;
				case "Window":
					it.type =  (isVariable) ? "VariableWindow" : "BinaryWindow"
					break;
				case "WindowCovering":
					it.type =  (isVariable) ? "VariableWindowCovering" : "BinaryWindowCovering"
					break;
				case "Fan":
					it.type =  (isVariable) ? "MultilevelFan" : "BinaryFan"
					break;
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
			error =  `ERROR: config.json error for device name: ${it.name}, of type: ${it.type}. Device base_uuid already used for base_uuid: ${it.uuid_base}. If you have intentionally used the same HomeSeer reference for more than one device, you need to manually set the 'uuid_base' values in config.json for these devices. Don't use the label 'Ref' followed by a number, but any other non-duplicate value should work!`;

				throw new SyntaxError(error);
			}			
			
			//////////////////   Battery Checking ////////////
			
			var deviceBattery = undefined
			
			if (it.batteryRef === 0) {
				globals.log(`You manually set a batteryRef to a value of 0. This inhibits automatic battery checking. No battery will be set for device: ${it.ref}` );
			} else {
				deviceBattery = HomeSeerData.findBattery(it.ref);
			}
			if (deviceBattery)
			{
				if (it.batteryRef === undefined ||  it.batteryRef === null)  {
					globals.log(`Added a battery to device#: ${it.ref}` );
					it.batteryRef = deviceBattery;
				} else  if (it.batteryRef != deviceBattery)  {
						globals.log(`Wrong battery Specified for device Reference #: ${it.ref}. You specified reference: ${it.batteryRef}, but correct device reference appears to be: ${deviceBattery}. Fixing error.`);
								
						it.batteryRef = deviceBattery;
				}

				if ((deviceBattery == false) && (it.batteryRef)  ) {
					globals.log(`You specified battery reference: ${it.batteryRef} for device Reference #: ${it.ref} but device does not seem to be battery operated. Check config.json file and fix if this is an error.`);
				}	
			}
			
			//////////////////////////////////////////

			// If type is undefined, default based on Z-Wave type or if all else fails, to a lightbulb!
			if (it.type === undefined) {
				throw new SyntaxError( "*Error* - Device specified in config.json with undefined 'type' property. Correct error and retry HomeBridge")
			}

			// Has a valid type been specified?		
			if (checkDefaults.hasValidType(it) == false) {
				throw new SyntaxError(`config.json settings error for device name: ${it.name}, Incorrect device type: ${it.type}.`);
			}
				
			// Check that the config.json entry only specifies valid properties - no typos!
			checkDefaults.hasValidProperties(it); // This will throw an error if properties are incorrect!
			
			// Make sure it has its mandatory properties
			if( checkDefaults.hasMandatoryProperties(it) == false) { 
				throw new SyntaxError(`config.json settings error for device name: ${it.name}": is missing a mandatory property.`)
			};

			// check the remaining properties and fill in default values for any
			// that need to be there but haven't been specified.
			checkDefaults.setMissingDefaults(it)
			
			// Any Additional type-specific checking is performed here!
			switch(it.type) {
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
				error =   "config.json error for device name: " 
						+ it.name
						+ " batteryRef value is not a number for associated HomeSeer ref: " 
						+ it.ref;
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
