'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
// var Characteristic = require("hap-nodejs").Characteristic;
// var Service = require("hap-nodejs").Service;


exports.setupServices = function (that, services, _statusObjects, Characteristic, Service, getHSValue)
{
    //console.debug("DEBUG - Executing setupServices(obj, obj, obj, obj, obj, obj, obj)");
Characteristic.prototype.updateUsingHSReference = function(value) 
{
	if (value === undefined) return this;
	this.HSRef = value;
	_statusObjects[value].push(this);
	return this;
}
Characteristic.prototype.setConfigValues = function(value) 
{
	if (value === undefined) return this;
	this.config = value;
	return this;
}
Service.prototype.setConfigValues = function(value) 
{
	if (value === undefined) return this;
	this.config = value;
	return this;
}
Service.prototype.updateUsingHSReference = function(value) 
{
	if (value === undefined) return this;
	_statusObjects[value].push(this);
	return this;
}			
			
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
		case "Valve":
		{
		    //console.debug("DEBUG - Case Valve");
			var valveService = new Service.Valve();
			valveService.isPrimaryService = true;
			valveService.displayName = "Service.Valve";
			valveService.timer = null;
			
			valveService.getCharacteristic(Characteristic.Active)
				.on('set', that.setHSValue.bind(valveService.getCharacteristic(Characteristic.Active)) )
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
							console.log(yellow("Valve Time Duration Set to: " + data.newValue + " seconds"))
							if(valveService.getCharacteristic(Characteristic.InUse).value)
							{
								valveService.getCharacteristic(Characteristic.RemainingDuration)
									.updateValue(data.newValue);
									
								clearTimeout(valveService.timer); // clear any existing timer
								valveService.timer = setTimeout( ()=> 
										{
											console.log(yellow("Valve Timer Expired. Shutting off Valve"));
											// use 'setvalue' when the timer ends so it triggers the .on('set'...) event
											valveService.getCharacteristic(Characteristic.Active).setValue(0); 
										}, (data.newValue *1000));	
							}
						}); // end .on('change' ...

				valveService.addCharacteristic(Characteristic.RemainingDuration)
					.on('change', (data) => { console.log("Valve Remaining Duration changed to: " + data.newValue) });

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
											console.log(magenta("Selected Valve On Duration of: ") + cyan(timer) 
													+ 	magenta(" seconds is less than the minimum permitted time, setting On time to: ") 
													+ 	cyan(that.config.minTime) + " seconds");
													timer = that.config.minTime
										}
									valveService.getCharacteristic(Characteristic.RemainingDuration)
										.updateValue(timer);
									
									console.log(yellow("Turning Valve ") + cyan(that.config.name) + yellow(" on with Timer set to: ")+ cyan(timer) + yellow(" seconds"));									
									valveService.timer = setTimeout( ()=> {
														console.log(yellow("Valve Timer Expired. Shutting off Valve"));
														// use 'setvalue' when the timer ends so it triggers the .on('set'...) event
														valveService.getCharacteristic(Characteristic.Active).setValue(0); 
												}, (timer *1000));
									break;
								}
							}
						}); // end .on('change' ...
			} // end if(that.config.useTimer)
			//console.debug("   valveService: " + JSON.stringify(valveService))
			services.push(valveService);
			break;
		}
		
		case "Switch": 
		{
            //console.debug("DEBUG - Case Switch");
			var switchService = new Service.Switch();
			switchService.isPrimaryService = true;
			switchService.displayName = "Service.Switch";
			
			switchService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(switchService.getCharacteristic(Characteristic.On)));
            //console.debug("   switchService: " + JSON.stringify(switchService))
			services.push(switchService);

			break;
		}
		
		case "Outlet": {
            //console.debug("DEBUG - Case Outlet");
			var outletService = new Service.Outlet();
			outletService.isPrimaryService = true;
			outletService.displayName = "Service.Outlet";
			
			outletService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(outletService.getCharacteristic(Characteristic.On)));
            //console.debug("   outletService: " + JSON.stringify(outletService))
			services.push(outletService);
			break;
		}
		
		case "TemperatureSensor": 
		{
            //console.debug("DEBUG - Case TemperatureSensor");
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
            //console.debug("   temperatureSensorService: " + JSON.stringify(temperatureSensorService));
			services.push(temperatureSensorService);
			break;
		}
		
		case "Thermostat": {
            //console.debug("DEBUG - Thermostat");
			var thermostatService = new Service.Thermostat();
			thermostatService.displayName = "Service.Thermostat";
			
			// If either cooling or heating setpoint changes, send entire service block for analysis and update!
			thermostatService
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.coolingSetpointRef)
				.updateUsingHSReference(that.config.heatingSetpointRef)
				.mode = getHSValue( that.config.controlRef  ); // At startup, store HomeSeer's current control mode here.
				
				thermostatService.getCharacteristic(Characteristic.CurrentTemperature)
					.setProps({minValue:-50, maxValue: 75})
					.displayName = "Characteristic.CurrentTemperature";
					
				thermostatService.getCharacteristic(Characteristic.TargetTemperature)
					.setProps({minValue:0, maxValue: 35})
					.displayName = "Characteristic.TargetTemperature";
				
				//	If HomeSeer is operating in Fahrenheit, use a more granular stepsize to avoid rounding errors!			
				if(that.config.temperatureUnit == "F") 	thermostatService.getCharacteristic(Characteristic.TargetTemperature)
					.setProps({ minStep:.01})
					
				thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
					.setConfigValues(that.config)
					.updateUsingHSReference(that.config.controlRef)
					.displayName = "Characteristic.TargetHeatingCoolingState";
					
				thermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
					.setConfigValues(that.config)
					.updateUsingHSReference(that.config.stateRef)
					.displayName = "Characteristic.CurrentHeatingCoolingState";

			// Current Temperature is read-only!
			thermostatService.getCharacteristic(Characteristic.CurrentTemperature)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
			
			if (that.config.coolingSetpointRef)
			{
				thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
					.setConfigValues(that.config)
					.setProps({minValue:0, maxValue: 35})
					// .on('set', ()=> { console.log(cyan("CoolingThresholdTemperature SET event called")) })
					// .on('change', ()=> { console.log(magenta("CoolingThresholdTemperature CHANGE event called")) })
					.on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)))
					.displayName = "Characteristic.CoolingThresholdTemperature";
			}
			if (that.config.heatingSetpointRef)
			{
				thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
					.setConfigValues(that.config)
					.setProps({minValue:0, maxValue: 35})
					// .on('set', ()=> { console.log(cyan("HeatingThresholdTemperature SET event called")) })
					// .on('change', ()=> { console.log(magenta("HeatingThresholdTemperature CHANGE event called")) })
					.on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)))
					.displayName = "Characteristic.HeatingThresholdTemperature";				
			}
		
			thermostatService.getCharacteristic(Characteristic.TargetTemperature)
				// .on('change', (data) => 	{console.log(cyan("TargetTemperature CHANGE Event called with value: " + data.newValue));	}) 
				// the 'set' event is called when the slider on iOS is altered, but not when .updateValue is called.
				.on('set', (value, callback) =>
				{
					// console.log(magenta("TargetTemperature SET Event called with value: " + value));
					var newTemp = value;
					var success = true;
					if(thermostatService.config.temperatureUnit == "F")
						{ newTemp = ((newTemp * (9/5)) +32).toFixed(0);	}
					
					// console.log(magenta("TargetTemperature SET Event called with value: " + value + ", which is transmitted as: " + newTemp));

					switch(thermostatService.mode)
					{
						case 1: // heating
						{
							that.transmitToHS(newTemp, thermostatService.config.heatingSetpointRef);
							break;
						}
						case 2: // cooling
						{
							that.transmitToHS(newTemp, thermostatService.config.coolingSetpointRef);
							break;
						}
					}
					callback(null);
				});

			thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
				.updateValue(thermostatService.mode) // At startup, set control mode to be same as HomeSeer's
				/* .on('set', (level, callback) =>
					{	// For some reason, if 'set' isn't called, then 'change' doesn't seem to trigger!
						// console.log(cyan("* Debug * - Received TargetHeatingCoolingState SET event value: " + level));
						callback(null);
					}) */
				// Use change event rather than 'set' event to activate on every change.
				.on('change', (data) =>
					{
						// console.log(yellow("* Debug * - Received TargetHeatingCoolingState CHANGE event value: " + data.newValue))
						
						thermostatService.mode = data.newValue;
						that.transmitToHS(thermostatService.mode, that.config.controlRef);

						// After changing mode from Auto to Heating or Cooling, make sure to set TargetTemperature
						// To current heating or cooling value of HomeSeer device identified by coolingSetpointRef or heatingSetpointRef

						var heatingTemp = (that.config.heatingSetpointRef === undefined) ? 0 : getHSValue(thermostatService.config.heatingSetpointRef);
						var coolingTemp = (that.config.coolingSetpointRef === undefined) ? 0 : getHSValue(thermostatService.config.coolingSetpointRef);
						if (thermostatService.config.temperatureUnit == "F")
							{ 
								heatingTemp = (heatingTemp - 32 )* (5/9);
								coolingTemp = (coolingTemp - 32 )* (5/9);
							}
						// console.log(yellow("Updating TargetHeatingCoolingState, Current target Heating / cooling Mode is: " + thermostatService.mode +", with new heating Temp: " + HSheatingTemp.toFixed(1) +	", new cooling Temp: " + HScoolingTemp.toFixed(1)));

						switch(thermostatService.mode)
						{
							case(0): // mode Off
								{	
									break; 
								}
							case(1): //mode heating
								{
									thermostatService.getCharacteristic(Characteristic.TargetTemperature)
										.updateValue(heatingTemp); 
									break
								}
							case(2): // mode cooling
								{
									thermostatService.getCharacteristic(Characteristic.TargetTemperature)
										.updateValue(coolingTemp); 
									break;
								}
							case(3): // mode auto
								{
																		
									thermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
										.updateValue(coolingTemp);
									thermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
										.updateValue(heatingTemp); 
									break;
								}
						}
					});

			if (that.config.humidityRef)
			{
				thermostatService.addCharacteristic(Characteristic.CurrentRelativeHumidity)
					.updateUsingHSReference(that.config.humidityRef)
					.setConfigValues(that.config);	
			}
			if (that.config.humidityTargetRef)
			{
				thermostatService
					.addCharacteristic(Characteristic.TargetRelativeHumidity)
					.updateUsingHSReference(that.config.humidityTargetRef)
					.setConfigValues(that.config)	
					.on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.TargetRelativeHumidity)));	
			}			
			
			
			thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits)
				.on('change', ()=> { console.log(magenta("*Warning * -  Changing Hardware Display Units Does Nothing!"));})
            //console.debug("   valveService: " + JSON.stringify(thermostatService));
			services.push(thermostatService);
			
			// At startup, set the control mode to be the same as HomeSeer's!
			// thermostatService.mode = getHSValue(  that.config.controlRef  );
			// thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
				// .updateValue(thermostatService.mode);
			
			break;
		}
		
		case "CarbonMonoxideSensor": {
            //console.debug("DEBUG - Case CarbonMonoxideSensor");
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
            //console.debug("   carbonMonoxideSensorService: " + JSON.stringify(carbonMonoxideSensorService));
			services.push(carbonMonoxideSensorService);
			break;
		}
		
		case "CarbonDioxideSensor": {
            //console.debug("DEBUG - Case CarbonDioxideSensor");
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
            //console.debug("   carbonDioxideSensorService: " + JSON.stringify(carbonDioxideSensorService));
			services.push(carbonDioxideSensorService);
			break;
		}
		
		case "ContactSensor": {
            //console.debug("DEBUG - Case ContactSensor");
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
            //console.debug("   contactSensorService: " + JSON.stringify(contactSensorService));
			services.push(contactSensorService);
			break;
		}
		
		case "MotionSensor": {
            //console.debug("DEBUG - Case Motion Sensor");
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
            //console.debug("   motionSensorService: " + JSON.stringify(motionSensorService));
			services.push(motionSensorService);
			break;
		}
		
		case "LeakSensor": 
		{
            //console.debug("DEBUG - Case LeakSensor");
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
            //console.debug("   leakSensorService: " + JSON.stringify(leakSensorService));
			services.push(leakSensorService);
			break;
		}
		
		case "OccupancySensor": {
            //console.debug("DEBUG - Case OccupancySensor");
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
            //console.debug("   occupancySensorService: " + JSON.stringify(occupancySensorService));
			services.push(occupancySensorService);
			break;
		}
		
		case "SmokeSensor": {
            //console.debug("DEBUG - Case SmokeSensor");
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
            //console.debug("   smokeSensorService: " + JSON.stringify(smokeSensorService));
			services.push(smokeSensorService);
			break;
		}
		
		case "LightSensor": 
		{
            //console.debug("DEBUG - Case LightSensor");
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
            //console.debug("   lightSensorService: " + JSON.stringify(lightSensorService));
			services.push(lightSensorService);
			break;
		}
		
		case "HumiditySensor": 
		{
            //console.debug("DEBUG - Case HumiditySensor");
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
            //console.debug("   humiditySensorService: " + JSON.stringify(humiditySensorService));
			services.push(humiditySensorService);
			break;
		}
		
		case "SecuritySystem":
		{
            //console.debug("DEBUG - Case SecuritySystem");
			var securitySystemService = new Service.SecuritySystem();
			securitySystemService.isPrimaryService = true;
			securitySystemService.displayName = "Service.SecuritySystem";

			securitySystemService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref);

			securitySystemService.getCharacteristic(Characteristic.SecuritySystemTargetState)
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				.on('set', that.setHSValue.bind(securitySystemService.getCharacteristic(Characteristic.SecuritySystemTargetState)));
            //console.debug("   securitySystemService: " + JSON.stringify(securitySystemService));
			services.push(securitySystemService);

			break;			
		}
	
		case "Lock": {
            //console.debug("DEBUG - Case Lock");
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
				.on('set', that.setHSValue.bind(lockService.getCharacteristic(Characteristic.LockTargetState)));
		
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
					.on('change', (data) => {console.log(magenta("Lock Management update to: " + data.newValue));});		
			}
            //console.debug("   lockMgmtService: " + JSON.stringify(lockMgmtService));
			services.push(lockMgmtService);
            //console.debug("   lockService: " + JSON.stringify(lockService));
			services.push(lockService);
			break;
		}
		
		case "GarageDoorOpener": 
		{
            //console.debug("DEBUG - Case GarageDoorOpener");
			var garageDoorOpenerService = new Service.GarageDoorOpener();
			garageDoorOpenerService.displayName = "Service.GarageDoorOpener";
			garageDoorOpenerService.getCharacteristic(Characteristic.CurrentDoorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			garageDoorOpenerService.getCharacteristic(Characteristic.TargetDoorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(garageDoorOpenerService.getCharacteristic(Characteristic.TargetDoorState)));		

			if(that.config.obstructionRef)
			{
			garageDoorOpenerService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
                .setConfigValues(that.config)
			}
            //console.debug("   garageDoorOpenerService: " + JSON.stringify(garageDoorOpenerService));
			services.push(garageDoorOpenerService);
			break;
		}

		case "WindowCovering": 
		{
            //console.debug("DEBUG - Case WindowCovering");
			var windowService = new Service.WindowCovering();
			windowService.displayName = "Service.WindowCovering";
			
			windowService.getCharacteristic(Characteristic.CurrentPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			windowService.getCharacteristic(Characteristic.TargetPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(windowService.getCharacteristic(Characteristic.TargetPosition)));		

			if(that.config.obstructionRef != null)
			{
			windowService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
				.setConfigValues(that.config);					
			}
            //console.debug("   windowService: " + JSON.stringify(windowService));
			services.push(windowService);
			break;
		}		
		
		case "Fan": {
            //console.debug("DEBUG - Case Fan");
			var fanService = new Service.Fan
			fanService.isPrimaryService = true;
			fanService.displayName = "Service.Fan";
			
			fanService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(fanService.getCharacteristic(Characteristic.On)));


			if (that.config.can_dim) 
			{
				fanService.addCharacteristic(new Characteristic.RotationSpeed())
					.setConfigValues(that.config)
					.updateUsingHSReference(that.config.ref)
					.on('set', that.setHSValue.bind(fanService.getCharacteristic(Characteristic.RotationSpeed)));		
			}
            //console.debug("   fanService: " + JSON.stringify(fanService));
			services.push(fanService);
			break;
		}	
		
		case "Lightbulb": 
		{
            //console.debug("DEBUG - Case Lightbulb");
			// that.log("** Debug ** - Setting up bulb %s with can_dim: %s", that.config.name, that.config.can_dim);
			var lightbulbService = new Service.Lightbulb();
			lightbulbService.isPrimaryService = true;
			lightbulbService.displayName = "Service.Lightbulb"
			
			lightbulbService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.On)));

			if (that.config.can_dim) 
			{
				lightbulbService.addCharacteristic(new Characteristic.Brightness())
					.updateUsingHSReference(that.config.ref)
					.setConfigValues(that.config)
					.on('set', that.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.Brightness)));
			}
            //console.debug("   lightBulbService: " + JSON.stringify(lightbulbService));
			services.push(lightbulbService);
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
