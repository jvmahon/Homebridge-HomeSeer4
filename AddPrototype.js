//				.on('set', function(value, callback, context)); function called when a change originates from the iOS Home Application.  This should process the value receive from iOS to then send a new value to HomeSeer. 
// 				.on('change', function(data)) - Similar to .on('set' ...) - 'change' will trigger when the HomeKit Object's value was changed from the iOS application as well as when an updateValue was called.
//				.on('HSvalueChanged', function(newHSValue, HomeKitObject) - use this to process a change originating from HomeSeer. The value of HomeKitObject is either a HomeKit Service or a HomeKit Characteristic. This HomeKit Object is identified by the call .updateUsingHSReference(that.config.ref) which registers the object to receive a change originating from HomeSeer

'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var HSutilities = require("../lib/HomeSeerUtilities");
var promiseHTTP = require("request-promise-native");
var globals = require("../index.js").globals;

var Sensors = require("../lib/Sensor Setup")
var assert = require('assert');

var Service, Characteristic;

module.exports.addPrototypes = function()
{
	Service = globals.api.hap.Service;
    Characteristic = globals.api.hap.Characteristic;
	console.log(yellow(JSON.stringify(globals)));

		
	Characteristic.prototype.updateUsingHSReference = function(value) 
	{
		if (value === undefined) return this;
		if(globals.statusObjects[value] === undefined) globals.statusObjects[value] = [];

		this.HSRef = value;
		globals.statusObjects[value].push(this);
		return this;
	}
	Characteristic.prototype.setConfigValues = function(value) 
	{
		if (value === undefined) return this;
		if (this.HSRef === undefined) this.HSRef = value.ref;
		this.config = value;
		return this;
	}
	Characteristic.prototype.setDisplayName = function(name) 
	{
		if (name === undefined) return this;
		this.displayName = name;
		return this;
	}
	Characteristic.prototype.findCommandValue = function(controlName)
	{
		var reference = this.HSRef || this.ref ||  (this.config && this.config.ref ) || null; 
		
		if (reference == null) throw new SyntaxError("Characteristic.prototype.findCommandValue called for a characteristic without a specified HomeSeer reference. Need to set its .HSRef or .ref property");
		
		var foundValue = globals.findCommandValue(reference, controlName)
		globals.log(chalk.yellow("*Debug * - Found controlvalue of: " + foundValue + " for command: " + controlName + " and device reference: " + reference));
		
		return foundValue;
	}
	Characteristic.prototype.setSupportedLevels = function(HomeKitObject) 
	{
		if ((this.config === undefined ) || (this.config.interface_name === undefined)) 
		{
			throw new SyntaxError(chalk.red("Trying to set supported levels for a characteristic, but can't find interface name"+ JSON.stringify(this.config) ));
			return this;
		}
		if ((this.config.ref === undefined ) )
		{
			throw new SyntaxError(chalk.red("Trying to set supported levels for a characteristic, but can't find this.config.HSRef: " + JSON.stringify(this.config) ));
			return this;
		}
		if ((this.config.levels) )
		{
			throw new SyntaxError(chalk.red("Called setSupportedLevels but levels was already defined in config.json " + JSON.stringify(this.config) ));
			return this;
		}
		try
		{
			this.isBinary = (HSutilities.findControlPairByCommand(this.config.ref, "Dim") == null) ? true: false;
		
			// Set up maximum number of supported levels depending on controller technology
			// If Homeseer says the device has dimming controls, then it uses a percentage level which is
			// 99 for Z-Wave, but presume to be 100 for everything else.
			if( this.isBinary) // assume Z-wave which supports maximum of 99
			{ // binary open/closed
				globals.log(yellow("* Debug * - Setting device as binary, maxValue property set to 1"));
				this.setProps({maxValue:1});
			}
			else
			{
				switch(this.config.interface_name)
				{
					case("Z-Wave"):
					{
						globals.log(yellow("* Debug * - Setting Z-wave device, maxValue property set to 99 levels"));
						this.setProps({maxValue:99});

						break;
					}
					default:
					{
						globals.log(yellow("* Debug * - Setting Non-Z-wave device, maxValue property set to 100 levels"));
						this.setProps({maxValue:100});
						break;
					}
				}					

			}
		}
		catch(error)
		{
			// likely cause of error is failure of the usese percentage
			globals.log(red("*ERROR* Function setSupportedLevels failed")); 
		};
		
		return this;
	}


		


	Characteristic.prototype.sendHS = function(value)
	{
		globals.sendHS(this.HSRef, value);
		return this;
	}
	/////////////////////////////////////////////////////////////


	Service.prototype.setConfigValues = function(value) 
	{
		if (value === undefined) return this;
		this.config = value;
		return this;
	}
	Service.prototype.setDisplayName = function(name) 
	{
		if (name === undefined) return this;
		this.displayName = name;
		return this;
	}
	Service.prototype.setAsPrimary = function(value) 
	{
		if (value === undefined) 	{ this.isPrimaryService = true; }
			else					{ this.isPrimaryService =  value; }
		
		return this;
	}

	Service.prototype.updateUsingHSReference = function(value) 
	{
		if (value === undefined) return this;
		if(globals.statusObjects[value] === undefined) globals.statusObjects[value] = [];

		this.HSRef = value;
		globals.statusObjects[value].push(this);
		return this;
	}	

	Service.prototype.sendHS = function(value)
	{
		assert(this.HSRef != null, "Error in Service.prototype.sendHS function, HSRef is null")
		globals.sendHS(this.HSRef, value);
		return this;
	}		
}

