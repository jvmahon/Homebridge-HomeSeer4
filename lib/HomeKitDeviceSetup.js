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


exports.setupServices = function (that, services)
{
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
    //globals.log("DEBUG - Executing setupServices(obj, obj, obj, obj, obj, obj, obj)");
	
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
	this.config = value;
	return this;
}

/////////////////////////////////////////////////////////////

globals.sendHS = function(value, ref) 
{
	// Telnet interface should be faster, so use that if it was successfully logged in.
	// Else use the JSON interface which seems to be more permissive about login issues!
	globals.log(yellow("Called sendHS with telnetAuthorized of: " + globals.telnetAuthorized));
	
	if(globals.telnetAuthorized)
	{
		let commandstring = "cv," + ref + "," + value + "\r";
		
		globals.log(yellow("Sending command to HomeSeer on ASCII Port: " + commandstring));
		globals.telnetClient.write(commandstring);
		
	}
	else
	{
		globals.log(red("*Alert* - Sending Command to HomeSeer using backup HTTP interface. Telnet / ASCII interface is preferred for better performance. This may be a result of missing or wrong user name and password in your config.json file. Reference: " + ref ));
		
		var url = globals.platformConfig["host"] + "/JSON?request=controldevicebyvalue&ref=" + ref + "&value=" + value;

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
	globals.sendHS(value, this.HSRef);
	return this;
}
/////////////////////////////////////////////////////////////


Service.prototype.setConfigValues = function(value) 
{
	if (value === undefined) return this;
	this.config = value;
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
		

/*		
		case "GarageDoorOpener": 
		{
            //globals.log("DEBUG - Case GarageDoorOpener");
			var garageDoorOpenerService = new Service.GarageDoorOpener();
			garageDoorOpenerService.displayName = "Service.GarageDoorOpener";
			garageDoorOpenerService.getCharacteristic(Characteristic.CurrentDoorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			garageDoorOpenerService.getCharacteristic(Characteristic.TargetDoorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', function(value, callback, context)
					{
						switch(value)
						{
							case 0: {this.sendHS(that.config.openValue); break;} // Door Open
							case 1: {this.sendHS(that.config.closedValue); break; } // Door Closed
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
*/
/*		
		case "Window": 
		{
            //globals.log("DEBUG - Case Window");
			var windowService = new Service.Window();
			windowService.displayName = "Service.Window";
			
			windowService.getCharacteristic(Characteristic.CurrentPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.setProps({maxValue:that.config.levels});
				
			windowService.getCharacteristic(Characteristic.TargetPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.setProps({maxValue:1})
					.on('set', function(value, callback, context)
					{
						(value > 0) ? this.sendHS(this.config.openValue) : this.sendHS(this.config.closedValue);
						callback(null);
					} );		

			if(that.config.obstructionRef != null)
			{
			windowService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
				.setConfigValues(that.config);					
			}
            //globals.log("   windowService: " + JSON.stringify(windowService));
			services.push(windowService);
			break;
		}	
*/		
/*
		case "WindowCovering": 
		{
            //globals.log("DEBUG - Case WindowCovering");
			var windowService = new Service.WindowCovering();
			windowService.displayName = "Service.WindowCovering";
			
			windowService.getCharacteristic(Characteristic.CurrentPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, HomeKitObject) => { globals.log(magenta("HSvalueChanged called to update :" + HomeKitObject.displayName)) })
				.setProps({maxValue:1});
				
			windowService.getCharacteristic(Characteristic.TargetPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.setProps({maxValue:1})
				.on('HSvalueChanged', (data) => { globals.log(magenta("HSvalueChanged called to update TargetPosition with new value :" + data)) })
				.on('set', function(value, callback, context)
							{
								globals.log(green("value is: " + value));
								(value > 0) ? this.sendHS(this.config.openValue) : this.sendHS(this.config.closedValue);

								callback(null);
							} );				

			if(that.config.obstructionRef != null)
			{
			windowService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
				.setConfigValues(that.config);					
			}
            //globals.log("   windowService: " + JSON.stringify(windowService));
			services.push(windowService);
			break;
		}	

*/	
		case "Switch": 
		{
            //globals.log("DEBUG - Case Switch");
			var switchService = new Service.Switch();
			switchService.isPrimaryService = true;
			switchService.displayName = "Service.Switch";
			
			switchService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
				{
					if (newHSValue == 0) {HomeKitObject.updateValue(false);} else {HomeKitObject.updateValue(true)}

				})
				.on('set', function(newHSValue, callback, context)
							{
								if (this.config.interface_name == "Z-Wave")
										{	(newHSValue) ? this.sendHS(255) : this.sendHS(0)  	}
								else	{  	(newHSValue) ? this.sendHS(this.config.onValue) : this.sendHS(0)  }
								
								callback(null);
							} );
			services.push(switchService);

			break;
		}

		case "Outlet": {
            //globals.log("DEBUG - Case Outlet");
			var thisService = new Service.Outlet();
			thisService.isPrimaryService = true;
			thisService.displayName = "Service.Outlet";
			
			thisService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
				{
					if (newHSValue == 0) {HomeKitObject.updateValue(false);} else {HomeKitObject.updateValue(true)}

				})
				.on('set', function(newHSValue, callback, context)
							{
								if (this.config.interface_name == "Z-Wave")
										{	(newHSValue) ? this.sendHS(255) : this.sendHS(0)  	}
								else	{  	(newHSValue) ? this.sendHS(this.config.onValue) : this.sendHS(0)  }
								
								callback(null);
							} );


			services.push(thisService);
			break;
		}
		
		case "SecuritySystem":
		{
            //globals.log("DEBUG - Case SecuritySystem");
			var securitySystemService = new Service.SecuritySystem();
			securitySystemService.isPrimaryService = true;
			securitySystemService.displayName = "Service.SecuritySystem";
			securitySystemService.HSRef = that.config.ref;
			securitySystemService.config = that.config;
			securitySystemService.updateUsingHSReference(that.config.ref)
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
			var lockService = new Service.LockMechanism();
			lockService.isPrimaryService = true;
			lockService.displayName = "Service.LockMechanism";
			lockService.HSRef = that.config.ref;
			
			
			lockService.getCharacteristic(Characteristic.LockCurrentState)
				.setConfigValues(that.config)
				
				lockService
				.updateUsingHSReference(that.config.ref)
				.on('HSvalueChanged', function(newHSValue, HomeKitObject)
				{
					var lockedvalues = [65, 129, 255];
					var unlockedvalues = [0, 1, 16, 17, 32, 33, 64, 128];
					
					globals.log(chalk.blue("Received Emitted Value at lock: " + newHSValue));
					globals.log(chalk.blue("Locked: " + lockedvalues.includes(parseFloat(newHSValue)) ));
					globals.log(chalk.blue("UnLocked: " + unlockedvalues.includes(parseFloat(newHSValue)) ));
					switch(true)
					{
						case(lockedvalues.includes(parseFloat(newHSValue)) ): // Zwave Locked
						{
							globals.log(chalk.blue("Setting to Locked"));

							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(1) // secured
							HomeKitObject.getCharacteristic(Characteristic.LockTargetState).updateValue(1)
							break;
						}
						case(unlockedvalues.includes(parseFloat(newHSValue))): // Zwave Unlocked
						{
							globals.log(chalk.blue("Setting to Unlocked"));
							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(0) //unsecured
							HomeKitObject.getCharacteristic(Characteristic.LockTargetState).updateValue(0)
							break;
						}
						default:
						{
							globals.log(chalk.blue("Setting to Jammed"));
							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(3) //jammed

							break;
						}
					}
					
				});					
				

			lockService.getCharacteristic(Characteristic.LockTargetState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				// .on('set', that.setHSValue.bind(lockService.getCharacteristic(Characteristic.LockTargetState)));
				.on('set', function(value, callback, context)
							{
								globals.log(magenta(value));
								if (this.config.interface_name == "Z-Wave")
								{
									(value) ? this.sendHS(255) : this.sendHS(0)
								}
								else {
									(value) ? this.sendHS(this.config.lockValue) : this.sendHS(this.config.unlockValue)
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
			{
				//globals.log("DEBUG - Case Lightbulb");
				// that.log("** Debug ** - Setting up bulb %s with can_dim: %s", that.config.name, that.config.can_dim);
				var thisService = new Service.Lightbulb();
				thisService.isPrimaryService = true;
				thisService.displayName = "Service.Lightbulb";
				thisService.config = that.config;
				thisService.isDimmer = (HSutilities.findControlPairByCommand(that.config.ref, "Dim") != null) ? true: false;
				thisService.updateUsingHSReference(that.config.ref);
				thisService.HSRef = that.config.ref;


				var onControl = thisService.getCharacteristic(Characteristic.On);
				onControl.HSRef = that.config.ref;
				onControl
					.setConfigValues(that.config)
					.on('change', function(value)
								{
									if (value.newValue == true)
									{
											if (this.config.interface_name == "Z-Wave") 
												{ this.sendHS(255) ; 	globals.forceHSValue(this.HSRef, 255) }
											else
												{ this.sendHS(this.config.onValue)}
									}
									else {this.sendHS(0);}	 // turn off	
								} );
								
				if (thisService.isDimmer)
				{
					var brightControl = thisService.addCharacteristic(new Characteristic.Brightness())
					
					brightControl.HSRef = that.config.ref;
					brightControl
						.setConfigValues(that.config)
						.setProps({maxValue:that.config.levels})
						.on('set', function(value, callback, context)
								{
									// Only send if value isn't 255. If value is at 255, it means device just received a Z-Wave 'last value' command to turn on and that still hasn't finished, so don't do anything to the brightness yet!
									if((globals.getHSValue(this.HSRef) != 255) && (globals.getHSValue(this.HSRef) != value))
									{
										this.sendHS(value)
										globals.forceHSValue(this.HSRef, value)
									}
									callback(null); //must always finish with the callback(null);
								} );
								
								
								
				// Now is the tricky part - handle updates coming from HomeSeer!
				
					thisService.on('HSvalueChanged', function(newValue, HomeKitObject)
						{
							globals.log(chalk.blue("Updating a Dimming light"));
							switch(true)
							{
								case(newValue == 0):// Zero is universal for turning off, so just turn light off
								{
									HomeKitObject.getCharacteristic(Characteristic.On).updateValue(false); 
									break;
								}
								case(newValue == 255): // 255 is the Z-Wave value for "last value" - just turn on
								{
									HomeKitObject.getCharacteristic(Characteristic.On).updateValue(true); 
									break;
								}
								default: // any other value, figure if it is just to adjust brightness, or to turn on!
								{
									switch( HomeKitObject.getCharacteristic(Characteristic.On).value)
									{
										case(true): // already on, so just adjust brightness
										{
											HomeKitObject.getCharacteristic(Characteristic.Brightness).updateValue(newValue); 
										}
										case(false): // was off, so turn on and adjust brightness.
										{
											HomeKitObject.getCharacteristic(Characteristic.On).updateValue(true); 
											HomeKitObject.getCharacteristic(Characteristic.Brightness).updateValue(newValue); 
											break;
										}
									}
								}
							}
						});
				}
				else // not a dimmer
					{
					thisService.on('HSvalueChanged', function(newValue, HomeKitObject)
						{
							globals.log(chalk.blue("Updating a non-dimming light"));
							if (newValue == 0) 	
								HomeKitObject.getCharacteristic(Characteristic.On).updateValue(false) 
							else 
								HomeKitObject.getCharacteristic(Characteristic.On).updateValue(true);
						});
				}
				services.push(thisService);
				break;
			}
		case "Fan": 
		{
			var thisService = new Service.Fanv2();
			thisService.isPrimaryService = true;
			thisService.displayName = "Service.Fanv2";
			thisService.config = that.config;
			thisService.isDimmer = (HSutilities.findControlPairByCommand(that.config.ref, "Dim") != null) ? true: false;
			thisService.updateUsingHSReference(that.config.ref);
			thisService.HSRef = that.config.ref;


			var activeControl = thisService.getCharacteristic(Characteristic.Active);
			activeControl.HSRef = that.config.ref;
			activeControl
				.setConfigValues(that.config)
				.on('change', function(value)
							{
								if (value.newValue == true)
								{
										if (this.config.interface_name == "Z-Wave") 
											{ this.sendHS(255) ; 	globals.forceHSValue(this.HSRef, 255) }
										else
											{ this.sendHS(this.config.onValue)}
								}
								else {this.sendHS(0);}	 // turn off	
							} );
							
			if (thisService.isDimmer)
			{
				var speedControl = thisService.addCharacteristic(new Characteristic.RotationSpeed())
				
				speedControl.HSRef = that.config.ref;
				speedControl
					.setConfigValues(that.config)
					.setProps({maxValue:that.config.levels})
					.on('set', function(value, callback, context)
							{
								// Only send if value isn't 255. If value is at 255, it means device just received a Z-Wave 'last value' command to turn on and that still hasn't finished, so don't do anything to the RotationSpeed yet!
								if((globals.getHSValue(this.HSRef) != 255) && (globals.getHSValue(this.HSRef) != value))
								{
									this.sendHS(value)
									globals.forceHSValue(this.HSRef, value)
								}
								callback(null); //must always finish with the callback(null);
							} );
			// Now is the tricky part - handle updates coming from HomeSeer!
			
				thisService.on('HSvalueChanged', function(newValue, HomeKitObject)
					{
						globals.log(chalk.blue("Updating a Dimming light"));
						switch(true)
						{
							case(newValue == 0):// Zero is universal for turning off, so just turn light off
							{
								HomeKitObject.getCharacteristic(Characteristic.Active).updateValue(0); 
								break;
							}
							case(newValue == 255): // 255 is the Z-Wave value for "last value" - just turn on
							{
								HomeKitObject.getCharacteristic(Characteristic.Active).updateValue(1); 
								break;
							}
							default: // any other value, figure if it is just to adjust RotationSpeed, or to turn on!
							{
								switch( HomeKitObject.getCharacteristic(Characteristic.Active).value)
								{
									case(1): // already on, so just adjust RotationSpeed
									{
										HomeKitObject.getCharacteristic(Characteristic.RotationSpeed).updateValue(newValue); 
									}
									case(0): // was off, so turn on and adjust RotationSpeed.
									{
										HomeKitObject.getCharacteristic(Characteristic.Active).updateValue(1); 
										HomeKitObject.getCharacteristic(Characteristic.RotationSpeed).updateValue(newValue); 
										break;
									}
								}
							}
						}
					});
			}
			else // not a dimmer
				{
				thisService.on('HSvalueChanged', function(newValue, HomeKitObject)
					{
						globals.log(chalk.blue("Updating a non-dimming light"));
						if (newValue == 0) 	
							HomeKitObject.getCharacteristic(Characteristic.Active).updateValue(0) 
						else 
							HomeKitObject.getCharacteristic(Characteristic.Active).updateValue(1);
					});
			}
			services.push(thisService);
			break;
		}


	}	
			services.push(informationService);
			
			 // If batteryRef has been defined, then add a battery service.
		if (that.config.batteryRef) 
		{
			globals.log(chalk.blue("Adding a battery service for type: " + that.config.type + ", named: " + that.config.name));
			var batteryService = new Service.BatteryService();
			batteryService.displayName = "Service.BatteryService";
			
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
