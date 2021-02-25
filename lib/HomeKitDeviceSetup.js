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

var globals = require("../index").globals;
// var Characteristic = require("hap-nodejs").Characteristic;
// var Service = require("hap-nodejs").Service;
var Listen = require("../lib/Setup Listener");
var Thermostats = require("../lib/ThermostatSetup");
var Sensors = require("../lib/Sensor Setup")
var assert = require('assert');
var URL = require('url').URL;

var HomeSeerData = require("../index.js").HomeSeer;

function isZwaveLock(reference) {
	
		var StatusInfo = [];
		StatusInfo = HomeSeerData.getStatusData(reference)
		
		if ((StatusInfo === null) || (StatusInfo === undefined) )
			{
				throw new SyntaxError(red("You specified a Lock using HomeSeer reference: '" + reference + "' which is not a valid HomeSeer reference. Check your config.json file and fix!"))
			}
		if (StatusInfo.interface_name == "Z-Wave")
		{
			if (StatusInfo.device_type_string == "Z-Wave Door Lock")
			{
				// globals.log(green("*Debug* - Identified lock with reference '%s' by device_type_string"), reference );
				return true;
			}
			else if (	(StatusInfo.device_type.Device_API 		== 4) 
					&& 	(StatusInfo.device_type.Device_Type 	== 0) 
					&& 	(StatusInfo.device_type.Device_SubType 	== 98)
					)
					{
						// globals.log(green("*Debug* - Identified lock with reference '%s' by API / Type / Subtype"), reference);
						return true
					}
		}
		else
		{
			// globals.log(green("*Debug* - Reference ID '%s' is Not for a Z-Wave Lock!"), reference);

			return false
		}
}



exports.setupServices = function (that, services)
{
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
    //globals.log("DEBUG - Executing setupServices(obj, obj, obj, obj, obj, obj, obj)");

			Characteristic.prototype.updateUsingHSReference = function(reference) 
			{
				HomeSeerData.registerObjectToReceiveUpdates(reference, this);
				return this;
			}
			Characteristic.prototype.setConfigValues = function(configuration, setAsRef) 
			{
				if (configuration === undefined) return this;
				if (this.HSRef === undefined) this.HSRef = (setAsRef || configuration.ref);
				this.config = configuration;
				return this;
			}

			Characteristic.prototype.findCommandValue = function(controlName)
			{
				var reference = this.HSRef || this.ref ||  (this.config && this.config.ref ) || null; 
				if (reference == null) 
					{ 
						globals.log(red("*Programming Error* - Called Characteristic.prototype.findCommandValue with a null HomeSeer reference. Please report this on github."));
						return null
					};
				var foundValue = globals.findCommandValue(reference, controlName)
				// globals.log(chalk.yellow("*Debug * - Found controlvalue of: " + foundValue + " for command: " + controlName + " and device reference: " + reference));
				
				return foundValue;
			}


			Service.prototype.setConfigValues = function(configurationSet, setAsRef) 
			{
				if (configurationSet === undefined) return this;
				this.config = configurationSet;
				if (this.HSRef === undefined) this.HSRef = (setAsRef || this.config.ref || null);
				return this;
			}

			Service.prototype.setAsPrimary = function(value) 
			{
				if (value === undefined) 	{ this.isPrimaryService = true; }
					else					{ this.isPrimaryService =  value; }
				
				return this;
			}

			Service.prototype.updateUsingHSReference = function(reference) 
			{
				HomeSeerData.registerObjectToReceiveUpdates(reference, this);
				return this;
			}	


			/////////////////////////////////////////////////////////////

	
	// Use the Z-Wave Model Info. from HomeSeer if the type is undefined!
	// as of version 2.3.12, these should never be undefined as the initial config.json checking routines
	// will assign a type!
	if(that.config.type == undefined) that.config.type = that.model;
	if(that.config.model == undefined) that.config.model = that.model;
	
	// that.log(green("Configuring device named: ") + cyan (that.config.name) + green(", with type ") + cyan(that.config.type) + green(" and HomeSeer Device Type: ") + cyan(that.model));

	// And add a basic Accessory Information service		
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, that.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + that.config.type + " ref " + that.ref);
		
	
	switch (that.config.type) 
	{
		case "Thermostat":
		{

				if (HomeSeerData.isRootDevice(that.ref))
					{
						globals.log(yellow("Thermostat identified by a root device. Attempting to automatically determine its parameters."));
						that.config.type = "ThermostatRoot";
						Thermostats.identifyThermostatData(that, services)
					}
					
			Thermostats.setupThermostat(that, services)
			break;
		}
		case "ThermostatRoot":
		{
			Thermostats.identifyThermostatData(that, services)
			Thermostats.setupThermostat(that, services)
			break;
		}
		case "CarbonDioxideSensor":
		case "CarbonMonoxideSensor": 
		case "ContactSensor": 
		case "HumiditySensor": 
		case "LeakSensor": 
		case "LightSensor": 
		case "MotionSensor": 
		case "OccupancySensor": 
		case "SmokeSensor": 
		case "TemperatureSensor": 
		{
			Sensors.setupSensor(that, services)
			break;
		}	
		case "Valve":
		{
		    //globals.log("DEBUG - Case Valve");
			var valveService = new Service.Valve();

			if ((that.config.openValve === undefined) || (that.config.openValve === null)) 
			{
				var foundOpenValve = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.On)	
				that.config.openValve = foundOpenValve;
			}
			if ((that.config.closeValve === undefined) || (that.config.closeValve === null))
			{
				var foundCloseValve = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.Off)	

				that.config.closeValve = foundCloseValve;
			}
			// globals.log(chalk.yellow("*Debug* - valve Open value is: " + that.config.openValve + ", and valve close value is: " + that.config.closeValve));
			
			if (that.config.openValve === null || that.config.openValve === undefined || that.config.closeValve === null || that.config.closeValve === undefined)
			{
				throw new RangeError(red("Error - Missing Valve Open or Close values for Valve with HomeSeer Reference: " + that.config.ref));
			}
		
			valveService
				.setConfigValues(that.config).updateUsingHSReference(that.config.ref)
				.setAsPrimary()
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
					{
						switch(parseFloat(newHSValue))
						{
							case (HomeKitObject.config.closeValve):
							{
								HomeKitObject.getCharacteristic(Characteristic.Active).updateValue(0);
								HomeKitObject.getCharacteristic(Characteristic.InUse).updateValue(0);
								break;
							}
							case (HomeKitObject.config.openValve):
							{
								HomeKitObject.getCharacteristic(Characteristic.Active).updateValue(1);
								HomeKitObject.getCharacteristic(Characteristic.InUse).updateValue(1);								
								break
							}
							default:
							{
								throw new RangeError("Error in valve type. Received unexpected value from HomeSeer of: " + newHSValue + " for device with a HomeSeer reference of: " + HomeKitObject.HSRef);
							}
						}

					})
			valveService.timer = null;
			
			valveService.getCharacteristic(Characteristic.Active)
				.setConfigValues(that.config)
				.on('set', function(value, callback, context)
					{
						// globals.log(yellow("Called Active on 'set' with value: " + value));
						switch (value)
						{
						case 0: { HomeSeerData.sendDataValue( that.config.ref, that.config.closeValve ); break; }// 0 = HomeKit Valve Closed
						case 1: { HomeSeerData.sendDataValue( that.config.ref, that.config.openValve) ; break; } // 1 = HomeKit Valve Open
						}

						callback(null);
					} );

			valveService.getCharacteristic(Characteristic.InUse)
			.setConfigValues(that.config)
				.on('set', function(value, callback, context)
					{
						switch (value)
						{
						case 0: { HomeSeerData.sendDataValue( that.config.ref, that.config.closeValve); break; }// 0 = HomeKit Valve Closed
						case 1: { HomeSeerData.sendDataValue( that.config.ref, that.config.openValve) ; break; } // 1 = HomeKit Valve Open
						}
						callback(null);
					} );



					
			valveService.getCharacteristic(Characteristic.ValveType)
				.updateValue(that.config.valveType)
				

			if (that.config.useTimer)
			{
				valveService.addCharacteristic(Characteristic.SetDuration)
					.on('change', (data)=> 
						{
							globals.log(yellow("Valve Time Duration Set to: " + data.newValue + " seconds"))
							if(valveService.getCharacteristic(Characteristic.InUse).value)
							{
								valveService.getCharacteristic(Characteristic.RemainingDuration)
									.updateValue(data.newValue);
									
								clearTimeout(valveService.timer); // clear any existing timer
								valveService.timer = setTimeout( ()=> 
										{
											globals.log(yellow("Valve Timer Expired. Shutting off Valve"));
											// use 'setvalue' when the timer ends so it triggers the .on('set'...) event
											valveService.getCharacteristic(Characteristic.Active).setValue(0); 
										}, (data.newValue *1000));	
							}
						}); // end .on('change' ...

				valveService.addCharacteristic(Characteristic.RemainingDuration)
					.on('change', (data) => { globals.log("Valve Remaining Duration changed to: " + data.newValue) });

				valveService.getCharacteristic(Characteristic.InUse)
					.on('change', (data) =>
						{
							switch(data.newValue)
							{
								case 0:
								{
									valveService.getCharacteristic(Characteristic.RemainingDuration).updateValue(0);
									clearTimeout(valveService.timer); // clear the timer if it was used!
									break;
								}
								case 1:
								{
									var timer = valveService.getCharacteristic(Characteristic.SetDuration).value;
									
									if (timer < that.config.minTime) 
										{
											globals.log(magenta("Selected Valve On Duration of: ") + cyan(timer) 
													+ 	magenta(" seconds is less than the minimum permitted time, setting On time to: ") 
													+ 	cyan(that.config.minTime) + " seconds");
													timer = that.config.minTime
										}
									valveService.getCharacteristic(Characteristic.RemainingDuration)
										.updateValue(timer);
									
									globals.log(yellow("Turning Valve ") + cyan(that.config.name) + yellow(" on with Timer set to: ")+ cyan(timer) + yellow(" seconds"));									
									valveService.timer = setTimeout( ()=> {
														globals.log(yellow("Valve Timer Expired. Shutting off Valve"));
														// use 'setvalue' when the timer ends so it triggers the .on('set'...) event
														valveService.getCharacteristic(Characteristic.Active).setValue(0); 
												}, (timer *1000));
									break;
								}
							}
						}); // end .on('change' ...
			} // end if(that.config.useTimer)
			//globals.log("   valveService: " + JSON.stringify(valveService))
			services.push(valveService);
			break;
		}
		

		
		case "GarageDoorOpener": 
		{
            //globals.log("DEBUG - Case GarageDoorOpener");
			var thisService = new Service.GarageDoorOpener()
				.updateUsingHSReference(that.config.ref);
			
			// IF user-specified, choose that first!

			thisService.control = [];
			var targetDoorState = thisService.getCharacteristic(Characteristic.TargetDoorState);
			targetDoorState
				.setConfigValues(that.config)
			
			var currentDoorState = thisService.getCharacteristic(Characteristic.CurrentDoorState)
			currentDoorState
				.setConfigValues(that.config);
				
		
				switch (that.config.interface_name)
				{
					
					case ("Z-Wave"):
					{
						that.config.openValue		=	255 // Open
						that.config.closedValue		=	0 	// Closed
						that.config.openingValue	=	254 // Opening
						that.config.closingValue	=	252 // Closing
						that.config.stoppedValue	=	253 // Stopped

						break;
					}
					case ("LiftMaster MyQ"):
					{
						that.config.openValue		=	1 // Open
						that.config.closedValue		=	2 	// Closed
						that.config.openingValue	=	4 // Opening
						that.config.closingValue	=	5 // Closing
						that.config.stoppedValue	=	3 // Stopped						
						break;
					}
					case ("MyQ"):
					{
						that.config.openValue		=	1 // Open
						that.config.closedValue		=	3 	// Closed
						that.config.openingValue	=	undefined  // Opening
						that.config.closingValue	=	undefined  // Closing
						that.config.stoppedValue	=	undefined  // Stopped						
						break;
					}
					case ("HSMyQ"):
					{
						that.config.openValue		=	3 // Open
						that.config.closedValue		=	1 	// Closed
						that.config.openingValue	=	4  // Opening
						that.config.closingValue	=	2  // Closing
						that.config.stoppedValue	=	5  // Stopped						
						break;
					}
					default:
					{
						if (that.config.closedValue === undefined) 
						{
							that.config.closedValue = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.DoorLock);
						};
					
						if (that.config.openValue === undefined) 
						{
							that.config.openValue = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.DoorUnLock);
						};
						
						if ((that.config.closedValue === undefined) || (that.config.openValue === undefined) )
						{
							globals.log(red("*Warning* - openValue, closeValue, openingValue, closingValue, or stoppedValue not defined in config.json for GarageDoorOpener with reference: " + that.config.ref));
							globals.log(red("For proper configuration, Consult Wiki entry at: " + "https://github.com/jvmahon/Homebridge-HomeSeer4/wiki/Garage-Door-Openers"));
							throw new SyntaxError(red("Undefined garage door control values"));
						}
					}
				}
				
			thisService	
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
					{
						// globals.log(yellow("Received HomeSeer value of: " + newHSValue));

							switch(true)
							{
								case(currentDoorState.config.openValue === newHSValue)	:	// Open
										{	
											// globals.log(yellow("Executing Open"));

											targetDoorState.updateValue(0);	
											currentDoorState.updateValue(0);	
											break;	
										} 
								case(currentDoorState.config.closedValue === newHSValue)	:	// Closed
										{	
											// globals.log(yellow("Executing Closed"));

											targetDoorState.updateValue(1);
											currentDoorState.updateValue(1);	
											break;	
										} 
								case(currentDoorState.config.openingValue === newHSValue)	:	// Opening
										{	
											// globals.log(yellow("Executing Opening"));
											targetDoorState.updateValue(0);	
											currentDoorState.updateValue(2);	
											break;	
										} 
								case(currentDoorState.config.closingValue === newHSValue)	:	// Closing
										{	
											// globals.log(yellow("Executing Closing"));
											targetDoorState.updateValue(1);	
											currentDoorState.updateValue(3);	
											break;	
										} 
								case(currentDoorState.config.stoppedValue === newHSValue)	:	// Stopped
										{	
											// globals.log(yellow("Executing Stopped"));

											currentDoorState.updateValue(4);	
											break;	
										} 
								default:
								{
									globals.log(red("*Debug* - Received unexpected GarageDoorOpener value of: " + newHSValue ));
									// throw new RangeError(red("Error in GarageDoorOpener type - HSvalueChanged value out of range! Value is: " + newHSValue));
								}
							}
						});

			targetDoorState
				.on('set', function(value, callback, context)
					{
						switch(value)
						{
							case 0:  // Command to HomeSeer to Open Door
								{
									HomeSeerData.sendDataValue(that.config.ref, targetDoorState.config.openValue); 
									break;
								}
							case 1:  // Command to HomeSeer to Close Door
								{
									HomeSeerData.sendDataValue(that.config.ref, targetDoorState.config.closedValue); 
									break; 
								}
						}

						callback(null);
					} );					

			if(that.config.obstructionRef)
			{
			thisService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
                .setConfigValues(that.config)
					.on('HSvalueChanged', function(newHSValue, HomeKitObject)
					{
						if (that.config.obstructionClearValues.indexOf(newHSValue) == -1)
						{	// obstruction detected
							thisService.getCharacteristic(Characteristic.ObstructionDetected).updateValue(true);
						}			
						else
						{	// not obstructed
							thisService.getCharacteristic(Characteristic.ObstructionDetected).updateValue(false);
						}
					});
			}
            //globals.log("   thisService: " + JSON.stringify(thisService));
			services.push(thisService);
			break;
		}

		case "BinaryWindowCovering": 
		case "BinaryWindow": 
		{
			switch(that.config.type)
			{
				case "BinaryWindowCovering":
				{
					var thisService = new Service.WindowCovering()
					break;
				}
				case "BinaryWindow":
				{
					var thisService = new Service.Window()
					break;
				}
			}
            // globals.log(yellow("DEBUG - Case Binary Window or Window Covering"));
			// globals.log(yellow("DEBUG - configuration is: " + JSON.stringify(that.config)));

			thisService
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				.setAsPrimary();
				
			var currentPosition = thisService.getCharacteristic(Characteristic.CurrentPosition);
			
				currentPosition.setConfigValues(that.config).setProps({maxValue:1});
				
			var targetPosition = thisService.getCharacteristic(Characteristic.TargetPosition)
			
				targetPosition.setConfigValues(that.config).setProps({maxValue:1})	
				
				
			if (that.config.openValue === undefined)
			{
				
				let openWindowValue = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.DoorUnlock)
				let onValue = HomeSeerData.findCommandValue(that.config.ref,  HomeSeerData.controlUses.On)
				
				switch(true)
				{
					case (openWindowValue !== undefined):
					{
						that.config.openValue = openWindowValue
						break;
					}
					case (onValue !== undefined):
					{
						that.config.openValue = onValue;
						break;
					}
					default:
					{
						that.config.openValue = 0;
						break;
					}
				}
				// globals.log(yellow("*Debug* - openWindowValue: %s, onValue: %s, openValue: %s") , openWindowValue, onValue, that.config.openValue);

			}
				// globals.log(yellow("*Debug* - initial that.config.closedValue is: " + that.config.closedValue));

			if (that.config.closedValue === undefined)
			{
				let closeWindowValue = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.Doorlock)
				let offValue = HomeSeerData.findCommandValue(that.config.ref,  HomeSeerData.controlUses.Off)

				switch(true)
				{
					case (closeWindowValue !== undefined):
					{
						that.config.closedValue = closeWindowValue;
						break;
					}
					case (offValue !== undefined):
					{
						that.config.closedValue = offValue;
						break;
					}
					default:
					{
						that.config.closedValue = 255;
						break;
					}
				}
			// globals.log(yellow("*Debug* - closeWindowValue: %s, offValue: %s, closedValue: %s") , closeWindowValue, offValue, that.config.closedValue);

			}
		
				// Handle a change received from HomeSeer!
				thisService.on('HSvalueChanged', function(newHSValue, HomeKitObject)
				{
					// globals.log(cyan("*Debug* - Received HomeSeer data of: " + newHSValue));
					switch(true)
					{
						case (newHSValue === that.config.openValue):
						{
							// globals.log(yellow("*Debug* Processing HomeSeer data - case openValue"));
							HomeKitObject.getCharacteristic(Characteristic.CurrentPosition).updateValue(1);
							HomeKitObject.getCharacteristic(Characteristic.TargetPosition).updateValue(1);
							break;
						}
						case (newHSValue === that.config.closedValue):
						{
							// globals.log(yellow("*Debug* Processing HomeSeer data - case closedValue"));
							HomeKitObject.getCharacteristic(Characteristic.CurrentPosition).updateValue(0);
							HomeKitObject.getCharacteristic(Characteristic.TargetPosition).updateValue(0);
							break;
						}
						default:
						{
							// globals.log(yellow("*Debug* Processing HomeSeer data - case default"));
							HomeKitObject.getCharacteristic(Characteristic.CurrentPosition).updateValue(newHSValue);
							HomeKitObject.getCharacteristic(Characteristic.TargetPosition).updateValue(newHSValue);

							break;
						}
					}
				})	
				
				
			thisService.getCharacteristic(Characteristic.TargetPosition)
					.on('set', function(value, callback, context)
					{
						// globals.log(yellow("*Debug* - TargetPosition value is : " + value));
							switch( value)
							{
								case 0: // For HomeKit "Window", value of 0 means fully closed. For Windows / Shades, value of 0 means "least light" allowed.
								{
									HomeSeerData.sendDataValue(that.config.ref, that.config.closedValue )
									callback(null);
									break;
								}
								case 1:
								{
									HomeSeerData.sendDataValue(that.config.ref, that.config.openValue)
									callback(null);
									break;
								}
								default:
								{
									globals.log(red("*Alert* - received invalid value for binary window covering. Sending an open as default. Received value was: " + value));

									HomeSeerData.sendDataValue(that.config.ref, that.config.openValue)
									callback(null);
									break;
								}
							}
					} );		


			if(that.config.obstructionRef)
			{
			thisService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
                .setConfigValues(that.config)
					.on('HSvalueChanged', function(newHSValue, HomeKitObject)
					{
						if (that.config.obstructionClearValues.indexOf(newHSValue) == -1)
						{	// obstruction detected
							thisService.getCharacteristic(Characteristic.ObstructionDetected).updateValue(true);
						}			
						else
						{	// not obstructed
							thisService.getCharacteristic(Characteristic.ObstructionDetected).updateValue(false);
						}
					});
			}			
			
            //globals.log("   Window or Winow Covering Service: " + JSON.stringify(thisService));
			services.push(thisService);
			break;
		}	
		
		case "VariableWindowCovering": 
		case "VariableWindow": 
		{
			switch(that.config.type)
			{
				case "VariableWindowCovering":
				{
					var thisService = new Service.WindowCovering()
					break;
				}
				case "VariableWindow":
				{
					var thisService = new Service.Window()
					break;
				}
			}
            // globals.log(yellow("DEBUG - Case Variable Window or Window Covering"));
			// globals.log(yellow("DEBUG - configuration is: " + JSON.stringify(that.config)));

			thisService
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				.setAsPrimary();
				
			var currentPosition = thisService.getCharacteristic(Characteristic.CurrentPosition);
			var targetPosition = thisService.getCharacteristic(Characteristic.TargetPosition)
			
			// globals.log(yellow("*Debug* - Variable windows interface name is: " + that.config.interface_name));
			switch(that.config.interface_name)
			{
				case("Z-Wave"):
				{
				currentPosition.setConfigValues(that.config).setProps({maxValue:99});			
				targetPosition.setConfigValues(that.config).setProps({maxValue:99})	;
				break;
				}
			}
				
			// Handle a change received from HomeSeer!
			thisService.on('HSvalueChanged', function(newHSValue, HomeKitObject)
			{
				// globals.log(cyan("*Debug* - Received HomeSeer data of: " + newHSValue));
				currentPosition.updateValue(newHSValue);
				targetPosition.updateValue(newHSValue);
			})	
				
				
			thisService.getCharacteristic(Characteristic.TargetPosition)
					.on('set', function(value, callback, context)
					{
						HomeSeerData.sendDataValue(that.config.ref, value)
						callback(null);
					} );		


			if(that.config.obstructionRef)
			{
			let obstruction = thisService.getCharacteristic(Characteristic.ObstructionDetected);
			obstruction
				.updateUsingHSReference(that.config.obstructionRef)
                .setConfigValues(that.config)
					.on('HSvalueChanged', function(newHSValue, HomeKitObject)
					{
						if (that.config.obstructionClearValues.indexOf(newHSValue) == -1)
						{	// obstruction detected
							obstruction.updateValue(true);
						}			
						else
						{	// not obstructed
							obstruction.updateValue(false);
						}
					});
			}			
			
            //globals.log("   Window or Winow Covering Service: " + JSON.stringify(thisService));
			services.push(thisService);
			break;
		}	
		
		

		case "Switch": 
		case "Outlet":
		case "LightSwitch":
		case "BinaryLight":
		case "BinaryFan":
		{
			switch((that.config.type).toLowerCase() )
			{
				case "switch":
				{
					var thisService = new Service.Switch()
					var onControl	= thisService.getCharacteristic(Characteristic.On);
					break;
				}
				case "outlet":
				{
					var thisService = new Service.Outlet()
					var onControl	= thisService.getCharacteristic(Characteristic.On);
					break;
				}
				case "binarylight":
				case "lightswitch": // A simple non-dimming lightbulb
				{
					var thisService = new Service.Lightbulb()
					var onControl	= thisService.getCharacteristic(Characteristic.On);
					break;
				}
				case "binaryfan":
				{
					var thisService = new Service.Fanv2()
					var onControl	= thisService.getCharacteristic(Characteristic.Active);
					break;
				}
				default:
				{
					throw new SyntaxError("Error in setting up Binary device. Type not processed: " + that.config.type);
				}
			}
			

			thisService
				.setAsPrimary()
				.setConfigValues(that.config);

				onControl
					.setConfigValues(that.config)
					.updateUsingHSReference(that.config.ref)
				
				// Select from a hierarchy of possible 'on' values. Usually this is retrieved from HomeSeer control Pairs using findCommandValue.				

						var thisAlternate = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.OnAlternate);
						var thisOn = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.On);
						switch(true)
						{
							case (onControl.config.onValue !== undefined): // If a user has specified a value, that overrides all else!
							{
								onControl.onValue = (onControl.config.onValue)
								break;
							}
							case (thisAlternate !== undefined):  // Else use the HomeSeer On-Alternate value
							{
								onControl.onValue = thisAlternate
								break;
							}
							case (thisOn !== undefined):  // Else use the HomeSeer On value
							{
								onControl.onValue = thisOn
								break;
							}							
							default:  // Else just try 255 which is the Z-Wave Default!
							{
								globals.log(red("*Warning* - Unable to find an 'On' value for the device: " + onControl.config.ref + " defaulting to 255"));
								onControl.onValue =   255;
							}
						}

						var thisOff = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.Off);
						switch(true)
						{
							case (onControl.config.offValue !== undefined): // If a user has specified a value, that overrides all else!
							{
								onControl.offValue = (onControl.config.offValue)
								break;
							}
							case (thisOff !== undefined):  // Else use the HomeSeer Off value
							{
								onControl.offValue = thisOff;
								break;
							}							
							default:  // Else just try 255 which is the Z-Wave Default!
							{
								globals.log(red("*Warning* - Unable to find an 'Off' value for the device: " + onControl.config.ref + " defaulting to 0"));
								onControl.offValue =   0;
							}
						}
						
						
				// globals.log(yellow("* Debug * - Switch/Outlet On value is: " + onControl.onValue + " and Off value is: " + onControl.offValue));
					

			onControl
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
				{
					switch(parseFloat(newHSValue))
					{
						case 0:  // assumes 0 is always off; any other value is On.
							{
								HomeKitObject.updateValue(0); 
								break ;
							}
						default: 
							{
								HomeKitObject.updateValue(1); 
								break;
							}
					}
				})
				.on('set', function(newHSValue, callback, context)
							{
								switch(newHSValue == true)
								{
									case (true):
									{
										HomeSeerData.sendDataValue(onControl.config.ref, onControl.onValue)
										break;
									}
									case (false):
									{
										HomeSeerData.sendDataValue(onControl.config.ref, onControl.offValue)
										break;
									}
									default:
									{
										globals.log(cyan("Error in 'Switch' device type processing on 'set'"));
									}
								}
								
								callback(null);
							} );
			services.push(thisService);

			break;
		}



		case "SecuritySystem":
		{
            //globals.log("DEBUG - Case SecuritySystem");
			var securitySystemService = new Service.SecuritySystem()
				.setAsPrimary()
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref);

			securitySystemService
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
				{
				switch (true)
					{
					case ( HomeKitObject.config.armedStayValues.includes(parseFloat(newHSValue)) ): 
						{ 	HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(0);
							HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(0);
							break; } // 0 = HomeKit Stay Arm
						
					case ( HomeKitObject.config.armedAwayValues.includes(parseFloat(newHSValue)) ):
						{ 	HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(1); 
							HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(1); 
							break; } // 1 = HomeKit Away Arm
						
					case ( HomeKitObject.config.armedNightValues.includes(parseFloat(newHSValue)) ):
						{ 	HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(2); 
							HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(2); 
						
							break; } // 2 = HomeKit Night Arm
						
					case ( HomeKitObject.config.disarmedValues.includes(parseFloat(newHSValue)) ):
						{ 	HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(3);
							HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(3);
							break; } // 3 = HomeKit Disarmed
						
					case ( HomeKitObject.config.alarmValues.includes(parseFloat(newHSValue)) ): 
						{ 
							HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(4); // 4 = HomeKit Alarm Triggered
							break; 
						} 
					};

				})

			securitySystemService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
				.setConfigValues(that.config)
				// .updateUsingHSReference(that.config.ref);
				

			securitySystemService.getCharacteristic(Characteristic.SecuritySystemTargetState)
				.setConfigValues(that.config)
				// .updateUsingHSReference(that.config.ref)
				.on('set', function(newHSValue, callback, context)
				{
						switch (newHSValue)
						{
						case 0: { HomeSeerData.sendDataValue( that.config.ref, that.config.armStayValue); break; }// 0 = HomeKit Stay Arm
						case 1: { HomeSeerData.sendDataValue( that.config.ref, that.config.armAwayValue); break; } // 1 = HomeKit Away Arm
						case 2: { HomeSeerData.sendDataValue( that.config.ref, that.config.armNightValue); break; } // 2 = HomeKit Night Arm
						case 3: { HomeSeerData.sendDataValue( that.config.ref, that.config.disarmValue); break; } // 3 = HomeKit Disarmed

						};
					callback(null);
				} )
			services.push(securitySystemService);

			break;			
		}
					
		
		

		case "Lock": {
			
			// Apple's HAP says that Service.LockManagement is mandatory for a lock, but it seems to do nothing! Include it anyway.
			var lockMgmtService = new Service.LockManagement();
				lockMgmtService.getCharacteristic(Characteristic.LockControlPoint);
				lockMgmtService.getCharacteristic(Characteristic.Version).updateValue("1.0");
				lockMgmtService.addCharacteristic(Characteristic.CurrentDoorState).updateValue(1);
				
			var currentDoorState = lockMgmtService.getCharacteristic(Characteristic.CurrentDoorState);
				
			//This is for a simple door open/closed sensor. Though supported by lockManagement, it seems to do nothing!
			if(that.config.doorSensorRef)
			{
					if( that.config.doorSensorClosedValues === undefined) {that.config.doorSensorClosedValues = [0]};
				
					currentDoorState
						.updateUsingHSReference(that.config.doorSensorRef)
						.setConfigValues(that.config)
						.on('HSvalueChanged', (newHSValue, homekitObject) => 
						{ 
							if (currentDoorState.config.doorSensorClosedValues.includes(newHSValue))
									{ currentDoorState.updateValue(1); }
								else
									{ 	currentDoorState.updateValue(0); }		
						});		
			}

			services.push(lockMgmtService);
			
            // globals.log("DEBUG - Case Lock" + JSON.stringify(that.config));
			that.config.lockRef = that.ref;
			var lockService = new Service.LockMechanism()
				.setAsPrimary();
			lockService.HSRef = that.config.ref;
			
			if (HomeSeerData.isRootDevice(that.config.ref))
			{
			throw SyntaxError(red(`*Config.json Setup Error* - You have tried to configure a Lock device for device ${cyan(that.config.ref)} specifying the reference number of its Root. For Locks, you need to specify the reference device of the lock mechanism, not the root device. See wiki entry: ${cyan("https://github.com/jvmahon/Homebridge-HomeSeer4/wiki/Setting-Up-Your-Config.json-file")}.`));
			
			}
			
			if (that.config.unlockValue === undefined)
			{
				let unlockIt = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.DoorUnLock)

				switch(true)
				{
					case (unlockIt !== undefined):
					{
						that.config.unlockValue = unlockIt
						break;
					}
					case (that.config.interface_name == "Z-Wave"):
					default:
					{
						globals.log(red("*Warning* - You have not specified an unlockValue for device '%s' and the 'Control Use' setting on the HomeSeer 'Status Graphics' page for this device is not set to 'Door Unlock' so taking a wild guess that the unlockValue is 0."), that.config.ref);
						that.config.unlockValue = 0;
						break;
					}
				}
			}

			if (that.config.lockValue === undefined)
			{
				let lockIt = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.DoorLock)

				switch(true)
				{
					case (lockIt !== undefined):
					{
						that.config.lockValue = lockIt;
						break;
					}
					case (that.config.interface_name == "Z-Wave"):
					default:
					{
						globals.log(red("*Warning* - You have not specified a lockValue for device '%s' and the 'Control Use' setting on the HomeSeer 'Status Graphics' page for this device is not set to 'Door lock' so taking a wild guess that the lockValue is 255."), that.config.ref);
						that.config.lockValue = 255;
						break;
					}
				}
			}
			
			if (isZwaveLock(that.config.ref))
			{
					that.config.lockedStatusValues = [65, 129, 255];
					that.config.unlockedStatusValues = [0, 1, 16, 17, 32, 33, 64, 128];
			}
			else
			{		if (that.config.lockedStatusValues === undefined)
							{
									that.config.lockedStatusValues = [that.config.lockValue];
							};
					if (that.config.unlockedStatusValues === undefined)
							{
								that.config.unlockedStatusValues = [that.config.unlockValue];
							}
			}
			
			if (	that.config.lockValue == that.config.unlockValue )
					{
						throw new SyntaxError(red("*ERROR* - Error setting up lock. The lockValue and unlockValue can't be the same. Check your configuration values. Configuration settings are: " + JSON.stringify(that.config)));
					}
			
			if (	that.config.lockedStatusValues.includes(that.config.unlockValue) 
					|| that.config.unlockedStatusValues.includes(that.config.lockValue))
					{
						throw new SyntaxError(red("*ERROR* - Error setting up lock. The unlockedStatusValues includes your locking value, or else the lockedStatusValues includes your unlocking value. Please report this on github if you can't resolve it!"));
					};
					
			if (	(that.config.lockedStatusValues.includes(that.config.lockValue) === false)
					|| (that.config.unlockedStatusValues.includes(that.config.unlockValue) === false))
					{
						throw new SyntaxError(red("*ERROR* - Error setting up lock. The unlockedStatusValues is missing your unlocking value, or else the lockedStatusValues is missing your locking value. Please report this on github if you can't resolve it!"));
					}
			

		// globals.log(yellow("*Debug* - Lock Configuration Values are: " + JSON.stringify(that.config )));
			
			lockService.getCharacteristic(Characteristic.LockCurrentState)
				.setConfigValues(that.config)
				
				lockService
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
				{

					
					switch(true)
					{
						case(that.config.lockedStatusValues.includes(parseFloat(newHSValue)) ): // Zwave Locked
						{
							// globals.log(chalk.blue("Setting to Locked"));

							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(1) // secured
							HomeKitObject.getCharacteristic(Characteristic.LockTargetState).updateValue(1)
							break;
						}
						case(that.config.unlockedStatusValues.includes(parseFloat(newHSValue))): // Zwave Unlocked
						{
							// globals.log(chalk.blue("Setting to Unlocked"));
							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(0) //unsecured
							HomeKitObject.getCharacteristic(Characteristic.LockTargetState).updateValue(0)
							break;
						}
						default:
						{
							// globals.log(chalk.blue("Setting to Jammed"));
							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(3) //jammed

							break;
						}
					}
					
				});					
				

			lockService.getCharacteristic(Characteristic.LockTargetState)
				// .updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', function(value, callback, context)
							{

								switch (value)
								{	
									case 0: // unlock the door
										{
											HomeSeerData.sendDataValue(that.config.ref, this.config.unlockValue);
											break
										}								
									case 1: // lock the door
										{
											if(currentDoorState.value === 0)
											{
												globals.log(yellow(`Warning - The Door with HomeSeer Reference ${lockService.config.ref} is open and you're attempting to extend the lock cylinder. To prevent damage to door frame, this command will be ignored!`));
												
												setTimeout(function() // Wait a few seconds then restore the lock to an unlocked state
													{
															lockService.getCharacteristic(Characteristic.LockCurrentState).updateValue(0);
															lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(0)
													}, 3000)
											}
											else
											{
												HomeSeerData.sendDataValue(that.config.ref , this.config.lockValue);
											}
											break;
										}
									default:
										{
											globals.log(red(`Error - incorrect value for a Lock Target State.`));

										}

								}
								callback(null);
							} );
		
			lockService.isPrimaryService = true;
			


			services.push(lockService);
			break;
		}
			case "Lightbulb":
			case "MultilevelFan":
			case "DimmingLight":
			{
				switch(that.config.type)
				{
					case "DimmingLight":
					case "Lightbulb":
					{
						var thisService = new Service.Lightbulb();
						thisService.onControl	= thisService.getCharacteristic(Characteristic.On)
						thisService.multilevelControl = thisService.addCharacteristic(new Characteristic.Brightness())
						if (that.config.colorTemperatureRef !== undefined)
						{
						thisService.colorTemperatureControl = thisService.addCharacteristic(new Characteristic.ColorTemperature())
						}
						break;
					}
					case "MultilevelFan":
					{
						var thisService = new Service.Fanv2();
						 thisService.onControl	= thisService.getCharacteristic(Characteristic.Active)
						 thisService.multilevelControl = thisService.addCharacteristic(new Characteristic.RotationSpeed())
						break;
					}
					default:
					{
						throw new SyntaxError("Not a light or fan");
					}
				}

				thisService
					.setConfigValues(that.config)
					.updateUsingHSReference(that.config.ref)
					.setAsPrimary();
				thisService.name = that.config.name;
				thisService.HSRef = that.config.ref;

				thisService.onControl.setConfigValues(that.config);
					
			
			// Determine the HomeSeer values that turn the device On and Off.
			// Use a user-defined value first, then try to determine the value from HomeSeer's 'Control Use' settings.

				var thisAlternate = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.OnAlternate);				
				var thisOn = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.On);
				switch(true)
				{
					case (thisService.onControl.config.onValue !== undefined): // If a user has specified a value, that overrides all else!
					{
						thisService.onControl.onValue = (thisService.onControl.config.onValue)
						break;
					}
					case (thisAlternate !== undefined):  // Else use the HomeSeer On-Alternate value
					{
						thisService.onControl.onValue = thisAlternate
						break;
					}
					case (thisOn !== undefined):  // Else use the HomeSeer On value
					{
						thisService.onControl.onValue = thisOn
						break;
					}							
					default:  // Else just try 255 which is the Z-Wave Default!
					{
						globals.log(red("*Warning* - Unable to find a 'Control Use' 'On' value set on the 'Status Graphics' page of the HomeSeer device: " + thisService.onControl.config.ref + " defaulting to 255"));
						thisService.onControl.onValue =   255;
					}
				}				
								
								
				var thisOff = HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.Off);
				switch(true)
				{
					case (thisService.onControl.config.offValue !== undefined): // If a user has specified a value, that overrides all else!
					{
						thisService.onControl.offValue = (thisService.onControl.config.offValue)
						break;
					}
					case (thisOff !== undefined):  // Else use the HomeSeer On value
					{
						thisService.onControl.offValue = thisOff;
						break;
					}							
					default:  // Else just try 255 which is the Z-Wave Default!
					{
						globals.log(red("*Warning* - Unable to find a 'Control Use' 'Off' value set on the 'Status Graphics' page of the HomeSeer device: " + thisService.onControl.config.ref + " defaulting to 0"));
						thisService.onControl.offValue =   0;
					}
				}
				
				thisService.onControl
					.on('change', function(data)
								{
									
									// globals.log(cyan("* Debug * - Dimming Bulb / Multilevel Fan 'set' On value is: " + thisService.onControl.onValue + " and Off value is: " + thisService.onControl.offValue));
									// globals.log(chalk.yellow(`Received a new On Value of: ${data.newValue} when On was set to: ${data.oldValue} and while Multilevel Value was ${thisService.multilevelControl.value}` ));

									switch(data.newValue) // Compare it to true because you might also get a 0 or 1 due to Active characteristic!
									{
										case (1):
										case(true): // turn on.  Active Characteristic for Fan = 1, which evaluates to truthy
										{
											// globals.log("Debug - Turning On!");
											if (thisService.multilevelControl.value == thisService.onControl.offValue)
											{	// if for some reason the multilevel control has a value equal to its offValue (which shouldn't happen), then turn it on by sending the onValue
												HomeSeerData.sendDataValue(that.config.ref, thisService.onControl.onValue )
											}
											else
											{ 	// Else, turn it on by sending its last value
												HomeSeerData.sendDataValue(that.config.ref, thisService.multilevelControl.value )
											}
											break;
										}
										case 0:
										case(false): // turn off. Active Characteristic for Fan = 0, which evaluates to falsy
										{
											// globals.log("Debug - Turning Off!");
											HomeSeerData.sendDataValue(that.config.ref, thisService.onControl.offValue);
											break; 
										}
									}
								}
							);								

					
					thisService.multilevelControl.HSRef = that.config.ref;
					thisService.multilevelControl
						.setConfigValues(that.config)
						.setProps({maxValue:that.config.levels})
						.on('set', function(value, callback, context)
								{
									
									// globals.log(chalk.yellow(`Received a new Multilevel Value of: ${value} when On was set to: ${thisService.onControl.value} and while Multilevel Value was ${thisService.multilevelControl.value}` ));
									
									// Only send if value isn't currently set at 255. If value is at 255, it means device just received a Z-Wave 'last value' command to turn on and that still hasn't finished, so don't do anything to the brightness yet!
									
									if(HomeSeerData.getValue(thisService.multilevelControl.HSRef) != 255) 
									{
										HomeSeerData.sendDataValue(that.config.ref, value)
									}
									callback(null); //must always finish with the callback(null);
								} );
				if(that.config.colorTemperatureRef !== undefined)
				{	
					thisService.colorTemperatureControl.HSRef = that.config.colorTemperatureRef;
					thisService.colorTemperatureControl
						.updateUsingHSReference(that.config.colorTemperatureRef)
						.setConfigValues(that.config)
						.on('set', function(value, callback, context)
								{
									globals.log(chalk.yellow(`Received a new ColorTemperature Value of: ${value} when On was set to: ${thisService.onControl.value} and while Multilevel Value was ${thisService.multilevelControl.value}` ));
									HomeSeerData.sendDataValue(that.config.colorTemperatureRef, value)
									callback(null); //must always finish with the callback(null);
								} );	
								
					thisService.colorTemperatureControl.on('HSvalueChanged', function(newValue, HomeKitObject)
					{
						globals.log(chalk.yellow(`Received a new ColorTemperature Value of: ${newValue} from HomeSeer` ));
						
						var newColorTemp = Math.min(Math.max(newValue, thisService.colorTemperatureControl.props.minValue), thisService.colorTemperatureControl.props.maxValue )		

						thisService.colorTemperatureControl.updateValue(newColorTemp);
					})
				}
				// Now is the tricky part - handle updates coming from HomeSeer but don't turn On if already On!
				
					thisService.on('HSvalueChanged', function(newValue, HomeKitObject)
						{
							
							switch(true)
							{
								case(newValue == 0):// Zero is universal for turning off, so just turn device off
								{
									// globals.log(chalk.cyan("Turning off! " ));

									HomeKitObject.onControl.updateValue(0); 
									break;
								}
								case(newValue == 255): // 255 is the Z-Wave value for "last value" - just turn on
								{
									// globals.log(chalk.cyan("Setting to Last value"));
									HomeKitObject.onControl.updateValue(1); 
									break;
								}
								default: // any other value, figure if it is just to adjust brightness, or to turn on!
								{
									switch( HomeKitObject.onControl.value == true)
									{
										case(true): // already on, so just adjust brightness
										{
											// globals.log(chalk.cyan("Already on, Setting Brightness"));
											HomeKitObject.multilevelControl.updateValue(newValue); 
											break;
										}
										case(false): // was off, so turn on and adjust brightness.
										{
											// globals.log(chalk.cyan("Was off, so turn on and set brightness"));
											HomeKitObject.multilevelControl.updateValue(newValue); 
											HomeKitObject.onControl.updateValue(true); 

											break;
										}
										default:
										{
											globals.log(red("*Debug* - Invalid control value for HomeKitObject.onControl.value of: " + HomeKitObject.onControl.value));
										}
									}
								}
							}
						});

				services.push(thisService);
				break;
			}
			case "Speaker": // As of iOS 13, not supported in the Home App so this is pretty much useless!
			{
				var thisService = new Service.Speaker();

				thisService.setAsPrimary();
				thisService.name = that.config.name;
				thisService.HSRef = that.config.ref;

			
				var muteControl = thisService.getCharacteristic(Characteristic.Mute);		
				muteControl
					.setConfigValues(that.config)
					// .updateUsingHSReference(that.config.muteRef)
					
				var volumeControl = thisService.addCharacteristic(new Characteristic.Volume() );
				volumeControl.setConfigValues(that.config)
					.updateUsingHSReference(that.config.ref)
				
						
					
				volumeControl
					.on('set', function(value, callback, context)
							{
								HomeSeerData.sendDataValue(volumeControl.config.ref, value)
								callback(null); //must always finish with the callback(null);
							} );
								

				volumeControl.on('HSvalueChanged', function(newValue, HomeKitObject)
						{
							volumeControl.updateValue(newValue); 
						});

				services.push(thisService);
				break;
			}
			
		default:
		{
			throw new SyntaxError(red("Type not handle!" + JSON.stringify(that.config)));
		}


	}	
			services.push(informationService);
			
			 // If batteryRef has been defined, then add a battery service.
		if (that.config.batteryRef && (that.config.batteryRef !== 0) ) 
		{
			// globals.log(chalk.blue("Adding a battery service for type: " + that.config.type + ", named: " + that.config.name));
			var batteryService = new Service.BatteryService();
				batteryService.setAsPrimary(false);

			
			batteryService.getCharacteristic(Characteristic.BatteryLevel)
				.updateUsingHSReference(that.config.batteryRef)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						homekitObject.updateValue( newHSValue > 100 ? 0 : newHSValue )
						})	

						
			batteryService
				.getCharacteristic(Characteristic.StatusLowBattery)
				.updateUsingHSReference(that.config.batteryRef)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
					var lowBattery = false;
						lowBattery =  ((newHSValue < globals.platformConfig.batteryThreshold) || (newHSValue > 100 ) ) ? true : false
						homekitObject.updateValue(lowBattery)
					})	;						
			
			services.push(batteryService);
		}
}
