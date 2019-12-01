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
var globals = require("../index").globals;
// var Characteristic = require("hap-nodejs").Characteristic;
// var Service = require("hap-nodejs").Service;
let getHSValue = globals.getHSValue;
var Listen = require("../lib/Setup Listener");
var Thermostats = require("../lib/ThermostatSetup");
var Sensors = require("../lib/Sensor Setup")
var assert = require('assert');


exports.setupServices = function (that, services)
{
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
    //globals.log("DEBUG - Executing setupServices(obj, obj, obj, obj, obj, obj, obj)");

Characteristic.prototype.updateUsingHSReference = function(reference) 
{
	if (reference === undefined) return this;
	if(globals.statusObjects[reference] === undefined) globals.statusObjects[reference] = [];

	this.HSRef = reference;
	globals.statusObjects[reference].push(this);
	return this;
}
Characteristic.prototype.setConfigValues = function(configuration) 
{
	if (configuration === undefined) return this;
	if (this.HSRef === undefined) this.HSRef = configuration.ref;
	this.config = configuration;
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
	if (reference == null) return null;
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
		throw new SyntaxError(chalk.red("Trying to set supported levels for a characteristic, but can't find this.config.HSRef. Need to call 'updateUsingHSReference' or set .HSRef before calling this function. : " + JSON.stringify(this.config) ));
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


/////////////////////////////////////////////////////////////

globals.sendHS = function(ref, value) 
{
	// Telnet interface should be faster, so use that if it was successfully logged in.
	// Else use the JSON interface which seems to be more permissive about login issues!
	// globals.log(yellow("Called sendHS with telnetAuthorized of: " + globals.telnetAuthorized));
	if( ref == null || value === undefined ) throw new SyntaxError(red("Called globals.sendHS with incorrect parameters. Need to specify both a reference and a value. Reference was: " + ref + ", Value was: " + value));
	
	if(globals.telnetAuthorized)
	{
		let commandstring = "cv," + ref + "," + value + "\r";
		
		globals.log(yellow("Sending command to HomeSeer on ASCII Port: " + commandstring));
		globals.telnetClient.write(commandstring);
		globals.setHSValue(ref, value);
		
	}
	else
	{
		globals.log(red("*Alert* - Sending Command to HomeSeer using backup HTTP interface. Telnet / ASCII interface is preferred for better performance. This may be a result of missing or wrong user name and password in your config.json file. Reference: " + ref ));
		
		var url = globals.platformConfig["host"] + "/JSON?request=controldevicebyvalue&ref=" + ref + "&value=" + value;
		globals.setHSValue(ref, value);

		if (value === undefined) return;
		promiseHTTP(url)
		.then( function() {
				// globals.log(green("Successfully updated HomeSeer device"));

						
		})
		.catch(function(err)
			{ 	
			globals.log( red("Error attempting to update object for device with reference: " + ref));
			});
	}
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
			Thermostats.setupThermostat(that, services)
			break;
		}
		case "ThermostatRoot":
		{
			Thermostats.identifyThermostatData(that, services)
			break;
		}
		case "TemperatureSensor": 
		case "CarbonMonoxideSensor": 
		case "CarbonDioxideSensor":
		case "ContactSensor": 
		case "MotionSensor": 
		case "LeakSensor": 
		case "OccupancySensor": 
		case "SmokeSensor": 
		case "LightSensor": 
		case "HumiditySensor": 
		{
			Sensors.setupSensor(that, services)
			break;
		}	
		case "Valve":
		{
		    //globals.log("DEBUG - Case Valve");
			var valveService = new Service.Valve()
				.setConfigValues(that.config).updateUsingHSReference(that.config.ref)
				.setDisplayName("Service.Valve")
				.setAsPrimary()
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
					{
						if (newHSValue == 0) 
						{
							// Order of next two operations is essential. Active must be changed before InUse
							HomeKitObject.getCharacteristic(Characteristic.Active).updateValue(0);
							HomeKitObject.getCharacteristic(Characteristic.InUse).updateValue(0);
						} 
						else {
							// Order of next two operations is essential. Active must be changed before InUse
							HomeKitObject.getCharacteristic(Characteristic.Active).updateValue(1);
							HomeKitObject.getCharacteristic(Characteristic.InUse).updateValue(1);
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
						case 0: { this.sendHS( that.config.closeValve); break; }// 0 = HomeKit Valve Closed
						case 1: { this.sendHS( that.config.openValve) ; break; } // 1 = HomeKit Valve Open
						}

						callback(null);
					} );

			valveService.getCharacteristic(Characteristic.InUse)
			.setConfigValues(that.config)
				.on('set', function(value, callback, context)
					{
						switch (value)
						{
						case 0: { this.sendHS( that.config.closeValve); break; }// 0 = HomeKit Valve Closed
						case 1: { this.sendHS( that.config.openValve) ; break; } // 1 = HomeKit Valve Open
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
			var garageDoorOpenerService = new Service.GarageDoorOpener();
			garageDoorOpenerService.displayName = "Service.GarageDoorOpener";
			garageDoorOpenerService.getCharacteristic(Characteristic.CurrentDoorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
					{
							switch(newHSValue)
							{
								case(HomeKitObject.config.openValue)	:	{	HomeKitObject.updateValue(0);	break;	} // Open
								case(HomeKitObject.config.closedValue)	:	{	HomeKitObject.updateValue(1);	break;	} // Closed
								case(HomeKitObject.config.openingValue)	:	{	HomeKitObject.updateValue(2);	break;	} // Opening
								case(HomeKitObject.config.closingValue)	:	{	HomeKitObject.updateValue(3);	break;	} // Closing
								case(HomeKitObject.config.stoppedValue)	:	{	HomeKitObject.updateValue(4);	break;	} // Stopped
							}

					});
			
			const openDoorValue = garageDoorOpenerService.getCharacteristic(Characteristic.CurrentDoorState).findControlValue("DoorUnLock")		
			const closeDoorValue = garageDoorOpenerService.getCharacteristic(Characteristic.CurrentDoorState).findControlValue("DoorLock")		
			
			garageDoorOpenerService.getCharacteristic(Characteristic.TargetDoorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', function(value, callback, context)
					{
						switch(value)
						{
							case 0: {this.sendHS(that.config.openDoorValue); break;} // Door Open
							case 1: {this.sendHS(that.config.closeDoorValue); break; } // Door Closed
						}

						callback(null);
					} );					

			if(that.config.obstructionRef)
			{
			garageDoorOpenerService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
                .setConfigValues(that.config)
			}
            //globals.log("   garageDoorOpenerService: " + JSON.stringify(garageDoorOpenerService));
			services.push(garageDoorOpenerService);
			break;
		}

		
		
		case "WindowCovering": 
		case "Window": 
		{
			switch(that.config.type)
			{
				case "WindowCovering":
				{
					var thisService = new Service.WindowCovering()
						.setDisplayName("Service.WindowCovering");
					break;
				}
				case"Window":
				{
					var thisService = new Service.Window()
						.setDisplayName("Service.WindowCovering");
					break;
				}
			}
            //globals.log("DEBUG - Case Window");

			thisService
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				.setAsPrimary();
				
			thisService.getCharacteristic(Characteristic.CurrentPosition)
				.setConfigValues(that.config)
				.setSupportedLevels(thisService)
			thisService.getCharacteristic(Characteristic.TargetPosition)
				.setConfigValues(that.config)
				.setSupportedLevels(thisService)	
				
				

		
				// Handle a change received from HomeSeer!
				thisService.on('HSvalueChanged', function(newHSValue, HomeKitObject)
				{
					if (newHSValue == 0) // Treat 0 as universally meaning open
					{
						// Order of next two operations is essential. 
						HomeKitObject.getCharacteristic(Characteristic.CurrentPosition).updateValue(0);
						HomeKitObject.getCharacteristic(Characteristic.TargetPosition).updateValue(0);
					} 
					else {
						// Order of next two operations is essential.

							if (thisService.getCharacteristic(Characteristic.CurrentPosition).isBinary) // Else its binary!
							{
								HomeKitObject.getCharacteristic(Characteristic.CurrentPosition).updateValue(1);
								HomeKitObject.getCharacteristic(Characteristic.TargetPosition).updateValue(1);
							}
							else
							{			
								HomeKitObject.getCharacteristic(Characteristic.CurrentPosition).updateValue(newHSValue);
								HomeKitObject.getCharacteristic(Characteristic.TargetPosition).updateValue(newHSValue);
							}	
						}
				})
				
				
				
			thisService.getCharacteristic(Characteristic.TargetPosition)
					.on('set', function(value, callback, context)
					{
						globals.log(yellow("*Debug* - TargetPosition value is : " + value));
						globals.log(yellow("isBinary is set to: " + thisService.getCharacteristic(Characteristic.TargetPosition).isBinary));
						if (value == 0)
							{
								thisService.sendHS(0)
								callback(null);
								return;
							}
						
						if (thisService.getCharacteristic(Characteristic.TargetPosition).isBinary)
							{ // Else its a binary open/closed
								
								switch(this.config.interface_name)
								{
									case("Z-Wave"):
									{
										this.sendHS(255);
										break;
									}
									default:
									{
										this.sendHS(100);
										break;
									}
								}						
							}
						else
							{
								this.sendHS(value);
							}
						
						callback(null);

					} );		


			if(that.config.obstructionRef != null)
			{
			thisService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
							globals.log(red("*Alert* - Obstruction Detection Not Currently Supported"));
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
						.setDisplayName("Service.Outlet");
					var onControl	= thisService.getCharacteristic(Characteristic.On);
					break;
				}
				case "outlet":
				{
					var thisService = new Service.Outlet()
						.setDisplayName("Service.Outlet");
					var onControl	= thisService.getCharacteristic(Characteristic.On);
					break;
				}
				case "binarylight":
				case "lightswitch": // A simple non-dimming lightbulb
				{
					var thisService = new Service.Lightbulb()
						.setDisplayName("Service.Lightbulb");
					var onControl	= thisService.getCharacteristic(Characteristic.On);
					break;
				}
				case "binaryfan":
				{
					var thisService = new Service.Fanv2()
						.setDisplayName("Service.Outlet");
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
				
				// This should actually be done by a switch statement testing for null just in case a valid value is zero. For valid values of zero, the or statement would move onto the next choice event though it shouldn't do that!				

						var thisAlternate = onControl.findCommandValue("OnAlternate");
						var thisOn = onControl.findCommandValue("On");
						
						// user defined value overrides automatically detected value!
						if (onControl.config.onValue !== undefined)	
							{onControl.onValue = (onControl.config.onValue)}
								else
									{if ( thisAlternate !== null) 
										{onControl.onValue =  (thisAlternate)}
											else
												{if (thisOn !== null) 
													{onControl.onValue =   thisOn;	}
														else 
															{ onControl.onValue =   255;}
												}
									}

						var thisOff = onControl.findCommandValue("Off")
						
						// user defined value overrides automatically detected value!
						if (onControl.config.offValue !== undefined)	
							{onControl.offValue = (onControl.config.offValue)}
								else
									{if ( thisOff !== null) 
										{onControl.offValue =  (thisOff)}
											else
												{ onControl.offValue =   0;}
									}
				
				globals.log(yellow("* Debug * - Switch/Outlet On value is: " + onControl.onValue + " and Off value is: " + onControl.offValue));
					

			onControl
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
				{
					switch(newHSValue)
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
										onControl.sendHS(onControl.onValue)
										break;
									}
									case (false):
									{
										onControl.sendHS(onControl.offValue)
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
				.setDisplayName("Service.SecuritySystem")
				.setAsPrimary()
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref);
			securitySystemService.HSRef = that.config.ref;
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
				.updateUsingHSReference(that.config.ref);
				

			securitySystemService.getCharacteristic(Characteristic.SecuritySystemTargetState)
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				.on('set', function(newHSValue, callback, context)
				{
						switch (newHSValue)
						{
						case 0: { this.sendHS( that.config.armStayValue); break; }// 0 = HomeKit Stay Arm
						case 1: { this.sendHS( that.config.armAwayValue); break; } // 1 = HomeKit Away Arm
						case 2: { this.sendHS( that.config.armNightValue); break; } // 2 = HomeKit Night Arm
						case 3: { this.sendHS( that.config.disarmValue); break; } // 3 = HomeKit Disarmed

						};
					callback(null);
				} )
			services.push(securitySystemService);

			break;			
		}
					
		
		

		case "Lock": {
            //globals.log("DEBUG - Case Lock");
			that.config.lockRef = that.ref;
			var lockService = new Service.LockMechanism()
				.setDisplayName("Service.LockMechanism")
				.setAsPrimary();
			lockService.HSRef = that.config.ref;
			
			
			lockService.getCharacteristic(Characteristic.LockCurrentState)
				.setConfigValues(that.config)
				
				lockService
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
				{
					var lockedvalues = [65, 129, 255];
					var unlockedvalues = [0, 1, 16, 17, 32, 33, 64, 128];
					
					switch(true)
					{
						case(lockedvalues.includes(parseFloat(newHSValue)) ): // Zwave Locked
						{
							// globals.log(chalk.blue("Setting to Locked"));

							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(1) // secured
							HomeKitObject.getCharacteristic(Characteristic.LockTargetState).updateValue(1)
							break;
						}
						case(unlockedvalues.includes(parseFloat(newHSValue))): // Zwave Unlocked
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
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', function(value, callback, context)
							{
								globals.log(magenta(value));
								if (this.config.interface_name == "Z-Wave")
								{
									(value == true) ? this.sendHS(255) : this.sendHS(0)
								}
								else {
									(value == true) ? this.sendHS(this.config.lockValue) : this.sendHS(this.config.unlockValue)
								}

								callback(null);
							} );
		
			lockService.isPrimaryService = true;
			
			// Apple's HAP says that Service.LockManagement is mandatory for a lock, but it seems to do nothing! Include it anyway.
			var lockMgmtService = new Service.LockManagement();
				lockMgmtService.getCharacteristic(Characteristic.LockControlPoint);
				lockMgmtService.getCharacteristic(Characteristic.Version).updateValue("1.0");
				
			//This is for a simple door open/closed sensor. Though supported by lockManagement, it seems to do nothing!
			if(that.config.doorSensorRef)
			{
					lockMgmtService.addCharacteristic(Characteristic.CurrentDoorState)
					.updateUsingHSReference(that.config.doorSensorRef)
					.setConfigValues(that.config)
					.on('change', (data) => {globals.log(magenta("Lock Management update to: " + data.newValue));});		
			}

			services.push(lockMgmtService);

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
						var thisService = new Service.Lightbulb().setDisplayName("Service.Lightbulb");
						thisService.onControl	= thisService.getCharacteristic(Characteristic.On)
						thisService.multilevelControl = thisService.addCharacteristic(new Characteristic.Brightness())
						break;
					}
					case "MultilevelFan":
					{
						var thisService = new Service.Fanv2().setDisplayName("Service.Fanv2");
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
					
				thisService.onControl.onValue = thisService.onControl.findCommandValue("OnAlternate") || thisService.onControl.findCommandValue("On");
				thisService.onControl.offValue = thisService.onControl.findCommandValue("Off");
				
				globals.log(yellow("* Debug * - Dimming Bulb / Multilevel Fan On value is: " + thisService.onControl.onValue + " and Off value is: " + thisService.onControl.offValue));
				
				thisService.onControl
					.on('set', function(newValue, callback)
								{
									globals.log(cyan("* Debug * - Dimming Bulb / Multilevel Fan 'set' On value is: " + thisService.onControl.onValue + " and Off value is: " + thisService.onControl.offValue));

									switch(newValue == true) // Compare it to true because you might also get a 0 or 1 due to Active characteristic!
									{
										case(true): // turn on.  Active Characteristic for Fan = 1, which evaluates to truthy
										{
											globals.log("Debug - Turning On!");
											if (thisService.onControl.value) // This is the prior value of the 'On' / 'Active' characteristic.
												{
													break; // send nothing if already on
												}
											// else send an update	
											thisService.onControl.sendHS(thisService.onControl.onValue )
											break;
										}
										case(false): // turn off. Active Characteristic for Fan = 0, which evaluates to falsy
										{
											globals.log("Debug - Turning Off!");
											thisService.onControl.sendHS(thisService.onControl.offValue);
											break;
										}
									}
									callback(null);
								}
							);
								

					
					thisService.multilevelControl.HSRef = that.config.ref;
					thisService.multilevelControl
						.setConfigValues(that.config)
						.setProps({maxValue:that.config.levels})
						.on('set', function(value, callback, context)
								{
									
									// globals.log(chalk.magenta("Received a new Multilevel Value of: " + value + " when On was set to: " + thisService.onControl.value + " and while Multilevel Value was " + thisService.multilevelControl.value));
									
									// Only send if value isn't currently set at 255. If value is at 255, it means device just received a Z-Wave 'last value' command to turn on and that still hasn't finished, so don't do anything to the brightness yet!
									
									if((globals.getHSValue(thisService.multilevelControl.HSRef) != 255) && (globals.getHSValue(thisService.multilevelControl.HSRef) != value))
									{
										thisService.multilevelControl.sendHS(value)
										globals.forceHSValue(thisService.multilevelControl.HSRef, value)
									}
									callback(null); //must always finish with the callback(null);
								} );
								

				// Now is the tricky part - handle updates coming from HomeSeer but don't turn On if already On!
				
					thisService.on('HSvalueChanged', function(newValue, HomeKitObject)
						{
							
							switch(true)
							{
								case(newValue == 0):// Zero is universal for turning off, so just turn device off
								{
									globals.log(chalk.cyan("Turning off! " ));

									HomeKitObject.onControl.updateValue(0); 
									break;
								}
								case(newValue == 255): // 255 is the Z-Wave value for "last value" - just turn on
								{
									globals.log(chalk.cyan("Setting to Last value"));
									HomeKitObject.onControl.updateValue(1); 
									break;
								}
								default: // any other value, figure if it is just to adjust brightness, or to turn on!
								{
									switch( HomeKitObject.onControl.value == true)
									{
										case(true): // already on, so just adjust brightness
										{
											globals.log(chalk.cyan("Already on, Setting Brightness"));
											HomeKitObject.multilevelControl.updateValue(newValue); 
											break;
										}
										case(false): // was off, so turn on and adjust brightness.
										{
											// globals.log(chalk.cyan("Was off, so turn on and set brightness"));
											HomeKitObject.onControl.updateValue(true); 
											HomeKitObject.multilevelControl.updateValue(newValue); 
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

		default:
		{
			throw new SyntaxError(red("Type not handle!" + JSON.stringify(that.config)));
		}


	}	
			services.push(informationService);
			
			 // If batteryRef has been defined, then add a battery service.
		if (that.config.batteryRef) 
		{
			globals.log(chalk.blue("Adding a battery service for type: " + that.config.type + ", named: " + that.config.name));
			var batteryService = new Service.BatteryService()
				.setDisplayName("Service.BatteryService")
				.setAsPrimary(false);

			
			batteryService.getCharacteristic(Characteristic.BatteryLevel)
				.updateUsingHSReference(that.config.batteryRef)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
						homekitObject.updateValue(newHSValue)
						})	

						
			batteryService
				.getCharacteristic(Characteristic.StatusLowBattery)
				.updateUsingHSReference(that.config.batteryRef)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, homekitObject) => { 
					var lowBattery = false;
						lowBattery =  (newHSValue < globals.platformConfig.batteryThreshold) ? true : false
						homekitObject.updateValue(lowBattery)
					})	;						
			
			services.push(batteryService);
		}
}
