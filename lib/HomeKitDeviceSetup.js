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

exports.setupServices = function (that, services)
{
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
    //globals.log("DEBUG - Executing setupServices(obj, obj, obj, obj, obj, obj, obj)");
	
Characteristic.prototype.updateUsingHSReference = function(value) 
{
	if (value === undefined) return this;
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
		case "Valve":
		{
		    //globals.log("DEBUG - Case Valve");
			var valveService = new Service.Valve();
			valveService.isPrimaryService = true;
			valveService.displayName = "Service.Valve";
			valveService.timer = null;
			
			valveService.getCharacteristic(Characteristic.Active)
				.on('set', function(value, callback, context)
					{
						switch (value)
						{
						case 0: { this.sendHS( that.config.closeValve); break; }// 0 = HomeKit Valve Closed
						case 1: { this.sendHS( that.config.openValve) ; break; } // 1 = HomeKit Valve Open
						}

						callback(null);
					} )
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref);
					
			valveService.getCharacteristic(Characteristic.InUse)
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref);
					
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
		
		case "Switch": 
		{
            //globals.log("DEBUG - Case Switch");
			var switchService = new Service.Switch();
			switchService.isPrimaryService = true;
			switchService.displayName = "Service.Switch";
			
			switchService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', function(value, callback, context)
							{
								if (this.config.interface_name == "Z-Wave")
								{
									(value) ? this.sendHS(255) : this.sendHS(0)
								}
								else {
									(value) ? this.sendHS(this.config.onValue) : this.sendHS(0)
								}

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
				.on('set', function(value, callback, context)
					{
						globals.log(magenta(value));
						if (this.config.interface_name == "Z-Wave")
						{
							(value) ? this.sendHS(255) : this.sendHS(0)
						}
						else {
							(value) ? this.sendHS(this.config.onValue) : this.sendHS(0)
						}

						callback(null);
					} )
				.on('get', function(callback, context)
					{
						// Zero means Off / False; everything else means On / True.
						global.log(red("Executing a get for Outlet."));
						var newValue = (globals.HSValues[this.HSRef]) != 0 ? true : false
						callback(null, newValue);
						
					});

			services.push(thisService);
			break;
		}
		
		case "TemperatureSensor": 
		{
            //globals.log("DEBUG - Case TemperatureSensor");
			var temperatureSensorService = new Service.TemperatureSensor();
			temperatureSensorService.isPrimaryService = true;
			temperatureSensorService.displayName = "Service.TemperatureSensor";
			
			temperatureSensorService.getCharacteristic(Characteristic.CurrentTemperature)
				.setProps({ minValue: -100 })
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			if (that.config.tamperRef)
			{
				temperatureSensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateUsingHSReference(that.config.tamperRef)
					.setConfigValues(that.config);	
			}
            //globals.log("   temperatureSensorService: " + JSON.stringify(temperatureSensorService));
			services.push(temperatureSensorService);
			break;
		}

		case "CarbonMonoxideSensor": {
            //globals.log("DEBUG - Case CarbonMonoxideSensor");
			var carbonMonoxideSensorService = new Service.CarbonMonoxideSensor();
			carbonMonoxideSensorService.isPrimaryService = true;
			carbonMonoxideSensorService.displayName = "Service.CarbonMonoxideSensor";
			
			carbonMonoxideSensorService.getCharacteristic(Characteristic.CarbonMonoxideDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);	
				
			if (that.config.tamperRef)
			{
				carbonMonoxideSensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateUsingHSReference(that.config.tamperRef)
					.setConfigValues(that.config);	
			}
            //globals.log("   carbonMonoxideSensorService: " + JSON.stringify(carbonMonoxideSensorService));
			services.push(carbonMonoxideSensorService);
			break;
		}
		
		case "CarbonDioxideSensor": {
            //globals.log("DEBUG - Case CarbonDioxideSensor");
			var carbonDioxideSensorService = new Service.CarbonDioxideSensor();
			carbonDioxideSensorService.isPrimaryService = true;
			carbonDioxideSensorService.displayName = "Service.CarbonDioxideSensor";
			
			carbonDioxideSensorService
				.getCharacteristic(Characteristic.CarbonDioxideDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			if (that.config.tamperRef)
			{
				carbonDioxideSensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateUsingHSReference(that.config.tamperRef)
					.setConfigValues(that.config);	
			}
            //globals.log("   carbonDioxideSensorService: " + JSON.stringify(carbonDioxideSensorService));
			services.push(carbonDioxideSensorService);
			break;
		}
		
		case "ContactSensor": {
            //globals.log("DEBUG - Case ContactSensor");
			var contactSensorService = new Service.ContactSensor();
			contactSensorService.isPrimaryService = true;
			contactSensorService.displayName = "Service.ContactSensor";
			
			contactSensorService
				.getCharacteristic(Characteristic.ContactSensorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);	
				
			if (that.config.tamperRef)
			{
				contactSensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateUsingHSReference(that.config.tamperRef)
					.setConfigValues(that.config);	
			}
            //globals.log("   contactSensorService: " + JSON.stringify(contactSensorService));
			services.push(contactSensorService);
			break;
		}
		
		case "MotionSensor": {
            //globals.log("DEBUG - Case Motion Sensor");
			var motionSensorService = new Service.MotionSensor();
			motionSensorService.isPrimaryService = true;
			motionSensorService.displayName = "Service.MotionSensor";
			
			motionSensorService
				.getCharacteristic(Characteristic.MotionDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			if (that.config.tamperRef)
			{
				motionSensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateUsingHSReference(that.config.tamperRef)
					.setConfigValues(that.config);	
			}
            //globals.log("   motionSensorService: " + JSON.stringify(motionSensorService));
			services.push(motionSensorService);
			break;
		}
		
		case "LeakSensor": 
		{
            //globals.log("DEBUG - Case LeakSensor");
			var leakSensorService = new Service.LeakSensor();
			leakSensorService.displayName = "Service.LeakSensor";
			
			leakSensorService.getCharacteristic(Characteristic.LeakDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);	

			if (that.config.tamperRef)
			{
				leakSensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateUsingHSReference(that.config.tamperRef)
					.setConfigValues(that.config);	
			}
            //globals.log("   leakSensorService: " + JSON.stringify(leakSensorService));
			services.push(leakSensorService);
			break;
		}
		
		case "OccupancySensor": {
            //globals.log("DEBUG - Case OccupancySensor");
			var occupancySensorService = new Service.OccupancySensor();
			occupancySensorService.displayName = "Service.OccupancySensor";
			
			occupancySensorService.getCharacteristic(Characteristic.OccupancyDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);	
				
			if (that.config.tamperRef)
			{
				occupancySensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateUsingHSReference(that.config.tamperRef)
					.setConfigValues(that.config);	
			}
            //globals.log("   occupancySensorService: " + JSON.stringify(occupancySensorService));
			services.push(occupancySensorService);
			break;
		}
		
		case "SmokeSensor": {
            //globals.log("DEBUG - Case SmokeSensor");
			var smokeSensorService = new Service.SmokeSensor();
			smokeSensorService.displayName = "Service.SmokeSensor";
			
			smokeSensorService.getCharacteristic(Characteristic.SmokeDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);	
				
			if (that.config.tamperRef)
			{
				smokeSensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateUsingHSReference(that.config.tamperRef)
					.setConfigValues(that.config);	
			}
            //globals.log("   smokeSensorService: " + JSON.stringify(smokeSensorService));
			services.push(smokeSensorService);
			break;
		}
		
		case "LightSensor": 
		{
            //globals.log("DEBUG - Case LightSensor");
			var lightSensorService = new Service.LightSensor();
			lightSensorService.displayName = "Service.LightSensor";
			
			lightSensorService.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);	
				
			if (that.config.tamperRef)
			{
				lightSensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateUsingHSReference(that.config.tamperRef)
					.setConfigValues(that.config);	
			}
            //globals.log("   lightSensorService: " + JSON.stringify(lightSensorService));
			services.push(lightSensorService);
			break;
		}
		
		case "HumiditySensor": 
		{
            //globals.log("DEBUG - Case HumiditySensor");
			var humiditySensorService = new Service.HumiditySensor();
			humiditySensorService.displayName = "Service.HumiditySensor";
			
			humiditySensorService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			if (that.config.tamperRef)
			{
				humiditySensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateUsingHSReference(that.config.tamperRef)
					.setConfigValues(that.config);	
			}
            //globals.log("   humiditySensorService: " + JSON.stringify(humiditySensorService));
			services.push(humiditySensorService);
			break;
		}
		
		case "SecuritySystem":
		{
            //globals.log("DEBUG - Case SecuritySystem");
			var securitySystemService = new Service.SecuritySystem();
			securitySystemService.isPrimaryService = true;
			securitySystemService.displayName = "Service.SecuritySystem";

			securitySystemService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref);

			securitySystemService.getCharacteristic(Characteristic.SecuritySystemTargetState)
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				//.on('set', that.setHSValue.bind(securitySystemService.getCharacteristic(Characteristic.SecuritySystemTargetState)))
				.on('set', function(value, callback, context)
				{
						switch (value)
						{
						case 0: { this.sendHS( that.config.armStayValue); break; }// 0 = HomeKit Stay Arm
						case 1: { this.sendHS( that.config.armAwayValue); break; } // 1 = HomeKit Away Arm
						case 2: { this.sendHS( that.config.armNightValue); break; } // 2 = HomeKit Night Arm
						case 3: { this.sendHS( that.config.disarmValue); break; } // 3 = HomeKit Disarmed

						};
					callback(null);
				} )
            //globals.log("   securitySystemService: " + JSON.stringify(securitySystemService));
			services.push(securitySystemService);

			break;			
		}
	
		case "Lock": {
            //globals.log("DEBUG - Case Lock");
			that.config.lockRef = that.ref;
			var lockService = new Service.LockMechanism();
			lockService.isPrimaryService = true;
			lockService.displayName = "Service.LockMechanism";
			
			lockService.getCharacteristic(Characteristic.LockCurrentState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);					
				
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
            //globals.log("   lockMgmtService: " + JSON.stringify(lockMgmtService));
			services.push(lockMgmtService);
            //globals.log("   lockService: " + JSON.stringify(lockService));
			services.push(lockService);
			break;
		}
		
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

		case "WindowCovering": 
		{
            //globals.log("DEBUG - Case WindowCovering");
			var windowService = new Service.WindowCovering();
			windowService.displayName = "Service.WindowCovering";
			
			windowService.getCharacteristic(Characteristic.CurrentPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.setProps({maxValue:1});
				
			windowService.getCharacteristic(Characteristic.TargetPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.setProps({maxValue:1})
				// .on('set', that.setHSValue.bind(windowService.getCharacteristic(Characteristic.TargetPosition)));	
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
		
		case "Fan": {
            //globals.log("DEBUG - Case Fan");
			var thisService = new Service.Fanv2;
			thisService.isPrimaryService = true;
			thisService.displayName = "Service.Fanv2"
			
			thisService.getCharacteristic(Characteristic.Active)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('change', function(value)
							{
								if (value.newValue == true)
								{
									if (this.config.interface_name == "Z-Wave") 
									{
											this.sendHS(255) 
											globals.forceHSValue(this.HSRef, 255)
									}
									else
									{
										this.sendHS(this.config.onValue)
									}
								}
								else // turn off	
									{this.sendHS(0);}							
							} )	;


			if (HSutilities.findControlPairByCommand(that.config.ref, "Dim"))
			{
				thisService.addCharacteristic(new Characteristic.RotationSpeed())
					.setConfigValues(that.config)
					.updateUsingHSReference(that.config.ref)
					.on('set', function(value, callback, context)
							{
								// Only send if value isn't 255. If value is at 255, it means device just received a Z-Wave 'last value' command to turn on and that still hasn't finished, so don't do anything to the brightness yet!
								if(globals.getHSValue(this.HSRef) != 255) 
								{
									this.sendHS(value)
								}
								callback(null); //must always finish with the callback(null);
							} )
					.setProps({maxValue:that.config.levels});		
			}
            //globals.log("   thisService: " + JSON.stringify(thisService));
			services.push(thisService);
			break;
		}	
		
		case "Lightbulb": 
		{
            //globals.log("DEBUG - Case Lightbulb");
			// that.log("** Debug ** - Setting up bulb %s with can_dim: %s", that.config.name, that.config.can_dim);
			var thisService = new Service.Lightbulb();
			thisService.isPrimaryService = true;
			thisService.displayName = "Service.Lightbulb"
		
			thisService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('change', function(value)
							{

								if (value.newValue == true)
								{
									if (this.config.interface_name == "Z-Wave") 
									{
											this.sendHS(255) 
											globals.forceHSValue(this.HSRef, 255)
									}
									else
									{
										this.sendHS(this.config.onValue)
									}

								}
								else // turn off	
									{this.sendHS(0);}							
							} );
							
			if (HSutilities.findControlPairByCommand(that.config.ref, "Dim") != null)
			{
				thisService.addCharacteristic(new Characteristic.Brightness())
					.updateUsingHSReference(that.config.ref)
					.setConfigValues(that.config)
					.setProps({maxValue:that.config.levels})

					.on('set', function(value, callback, context)
							{
								// Only send if value isn't 255. If value is at 255, it means device just received a Z-Wave 'last value' command to turn on and that still hasn't finished, so don't do anything to the brightness yet!
								if(globals.getHSValue(this.HSRef) != 255) 
								{
									this.sendHS(value)
								}
								callback(null); //must always finish with the callback(null);
							} );

			}
			services.push(thisService);
			break;
		}
	}
	
	 // If batteryRef has been defined, then add a battery service.
	if (that.config.batteryRef) 
	{
		var batteryService = new Service.BatteryService();
		batteryService.displayName = "Service.BatteryService";
		
		batteryService.getCharacteristic(Characteristic.BatteryLevel)
			.updateUsingHSReference(that.config.batteryRef)
			.setConfigValues(that.config);
			
		batteryService
			.getCharacteristic(Characteristic.StatusLowBattery)
			.updateUsingHSReference(that.config.batteryRef)
			.setConfigValues(that.config);						
		
		services.push(batteryService);
	}
			
	services.push(informationService);
	// 
}
