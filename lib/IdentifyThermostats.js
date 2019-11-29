'use strict'
//				.on('set', function(value, callback, context)); function called when a change originates from the iOS Home Application.  This should process the value receive from iOS to then send a new value to HomeSeer. 
// 				.on('change', function(data)) - Similar to .on('set' ...) - 'change' is triggered either when there is an update originating from the iOS Home Application or else when you use updateValue from hap-nodejs.
//				.on('HSvalueChanged', function(newHSValue, HomeKitObject) - use this to process a change originating from HomeSeer. The value of HomeKitObject is either a HomeKit Service or a HomeKit Characteristic. This HomeKit Object is identified by the call .updateUsingHSReference(that.config.ref) which registers the object to receive a change originating from HomeSeer




var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var globals = require("../index").globals;


module.exports.identifyThermostatData = function (thermostatRoot, allAccessories)
{
console.log(chalk.yellow("Called identifyThermostatData with data: thermostatRoot of: " + JSON.stringify(thermostatRoot)));
console.log(chalk.yellow("Called identifyThermostatData with data: allAccessories of: " + JSON.stringify(allAccessories)));
console.log(chalk.yellow("Called identifyThermostatData with data: globals of: " + Object.getOwnPropertyNames(globals)));

}
