var exports = module.exports;
var chalk = require("chalk");
// var Characteristic = require("hap-nodejs").Characteristic;
// var Service = require("hap-nodejs").Service;


exports.setupServices = function (that, services, _statusObjects, Characteristic, Service)
{
			
	// Use the Z-Wave Model Info. from HomeSeer if the type is undefined!
	if(that.config.type == undefined) that.config.type = that.model;
	if(that.config.model == undefined) that.config.model = that.model;
	
	that.log("Configuring Device with user selected type " + that.config.type + " and HomeSeer Device Type: " + that.model);

	switch (that.config.type) 
	{
		
		case "Appliance Module":
		case "Lamp Module":
		case "Z-Wave Switch Binary":
		case "Switch": 
		{
			var switchService = new Service.Switch();
			switchService.isPrimaryService = true;
			
			switchService
				.getCharacteristic(Characteristic.On)
				.HSRef = that.config.ref;
				
			switchService
				.getCharacteristic(Characteristic.On)
				.config = that.config;					
				
			switchService
				.getCharacteristic(Characteristic.On)
				.on('set', that.setHSValue.bind(switchService.getCharacteristic(Characteristic.On)));
			_statusObjects[that.config.ref].push(switchService.getCharacteristic(Characteristic.On));

			services.push(switchService);
			break;
		}

		
		case "Outlet": {
			var outletService = new Service.Outlet();
			outletService.isPrimaryService = true;
			
			outletService
				.getCharacteristic(Characteristic.On)
				.HSRef = that.config.ref;

			outletService
				.getCharacteristic(Characteristic.On)
				.config = that.config;			
				
			outletService
				.getCharacteristic(Characteristic.On)
				.on('set', that.setHSValue.bind(outletService.getCharacteristic(Characteristic.On)));

			_statusObjects[that.config.ref].push(outletService.getCharacteristic(Characteristic.On));
			services.push(outletService);
			break;
		}
		
		case "Z-Wave Temperature":
		case "TemperatureSensor": 
		{
			var temperatureSensorService = new Service.TemperatureSensor();
			temperatureSensorService.isPrimaryService = true;
			temperatureSensorService.displayName = "Service.TemperatureSensor";
			
			temperatureSensorService
				.getCharacteristic(Characteristic.CurrentTemperature).setProps({ minValue: -100 });				

			temperatureSensorService
				.getCharacteristic(Characteristic.CurrentTemperature)
				.HSRef = that.config.ref;
				
			if (that.config.temperatureUnit === undefined) that.config.temperatureUnit = "F"	

			temperatureSensorService
				.getCharacteristic(Characteristic.CurrentTemperature)
				.config = that.config;
				
			/* temperatureSensorService
				.getCharacteristic(Characteristic.CurrentTemperature)
				.HStemperatureUnit = ((that.config.temperatureUnit) ? that.config.temperatureUnit : "F" );
				*/

			services.push(temperatureSensorService);
			
			_statusObjects[that.config.ref].push(temperatureSensorService.getCharacteristic(Characteristic.CurrentTemperature));	

			break;
		}
		
		case "Thermostat": {
			var thermostatService = new Service.Thermostat();
			
			thermostatService
				.getCharacteristic(Characteristic.CurrentTemperature)
				.HSRef = that.config.ref;
			thermostatService
				.getCharacteristic(Characteristic.CurrentTemperature)
				.config = that.config;
			
				
			thermostatService
				.getCharacteristic(Characteristic.TargetTemperature)
				.HSRef = that.config.setPointRef;
			thermostatService
				.getCharacteristic(Characteristic.TargetTemperature)
				.config = that.config;

			thermostatService
				.getCharacteristic(Characteristic.TargetTemperature)	
				.on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.TargetTemperature)));


			thermostatService
				.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
				.HSRef = that.config.stateRef;
			thermostatService
				.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
				.config = that.config;
				
			thermostatService
				.getCharacteristic(Characteristic.TargetHeatingCoolingState)
				.HSRef = that.config.controlRef;					
			thermostatService
				.getCharacteristic(Characteristic.TargetHeatingCoolingState)
				.config = that.config;
			thermostatService
				.getCharacteristic(Characteristic.TargetHeatingCoolingState)
				.on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)));
				
			if (that.config.humidityRef)
			{
			thermostatService
				.addCharacteristic(Characteristic.CurrentRelativeHumidity)
				.HSRef = that.config.humidityRef
			thermostatService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.config = that.config;	
				
			_statusObjects[that.config.humidityRef].push(thermostatService.getCharacteristic(Characteristic.CurrentRelativeHumidity));	
			
			}
			if (that.config.humidityTargetRef)
			{
			thermostatService
				.addCharacteristic(Characteristic.TargetRelativeHumidity)
				.HSRef = that.config.humidityTargetRef
			thermostatService.getCharacteristic(Characteristic.TargetRelativeHumidity)
				.config = that.config;	
			thermostatService.getCharacteristic(Characteristic.TargetRelativeHumidity)	
				.on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.TargetRelativeHumidity)));	
				
			_statusObjects[that.config.humidityTargetRef].push(thermostatService.getCharacteristic(Characteristic.TargetRelativeHumidity));	
			
			}			
			
			thermostatService
				.getCharacteristic(Characteristic.TemperatureDisplayUnits)
					.on('change', (data)=>
					{
						console.log(chalk.magenta.bold("*Debug * - Temperature Display Units set to: " + data.newValue + ", from: " + data.oldValue));
					});

			services.push(thermostatService);
			_statusObjects[that.config.ref].push(thermostatService.getCharacteristic(Characteristic.CurrentTemperature));
			_statusObjects[that.config.setPointRef].push(thermostatService.getCharacteristic(Characteristic.TargetTemperature));
			_statusObjects[that.config.controlRef].push(thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState));
			_statusObjects[that.config.stateRef].push(thermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState));

			break;
		}
		
		case "CarbonMonoxideSensor": {
			var carbonMonoxideSensorService = new Service.CarbonMonoxideSensor();
			carbonMonoxideSensorService.isPrimaryService = true;
			
			carbonMonoxideSensorService
				.getCharacteristic(Characteristic.CarbonMonoxideDetected)
				.HSRef = that.config.ref;
				
			carbonMonoxideSensorService
				.getCharacteristic(Characteristic.CarbonMonoxideDetected)
				.config = that.config;					

			services.push(carbonMonoxideSensorService);
			
			_statusObjects[that.config.ref].push(carbonMonoxideSensorService.getCharacteristic(Characteristic.CarbonMonoxideDetected));	
			
			break;
		}
		case "CarbonDioxideSensor": {
			var carbonDioxideSensorService = new Service.CarbonDioxideSensor();
			carbonDioxideSensorService.isPrimaryService = true;
			
			carbonDioxideSensorService
				.getCharacteristic(Characteristic.CarbonDioxideDetected)
				.HSRef = that.config.ref;

			carbonDioxideSensorService
				.getCharacteristic(Characteristic.CarbonDioxideDetected)
				.config = that.config;
				
			services.push(carbonDioxideSensorService);
			
			_statusObjects[that.config.ref].push(carbonDioxideSensorService.getCharacteristic(Characteristic.CarbonDioxideDetected));	

			break;
		}
		case "ContactSensor": {
			var contactSensorService = new Service.ContactSensor();
			contactSensorService.isPrimaryService = true;
			
			contactSensorService
				.getCharacteristic(Characteristic.ContactSensorState)
				.HSRef = that.config.ref;
				
			contactSensorService
				.getCharacteristic(Characteristic.ContactSensorState)
				.config = that.config;	

			services.push(contactSensorService);

			_statusObjects[that.config.ref].push(contactSensorService.getCharacteristic(Characteristic.ContactSensorState));	

			break;
		}
		case "MotionSensor": {
			var motionSensorService = new Service.MotionSensor();
			motionSensorService.isPrimaryService = true;
			motionSensorService.HSRef = that.config.ref;
			
			motionSensorService
				.getCharacteristic(Characteristic.MotionDetected)
				.HSRef = that.config.ref;
				
			motionSensorService
				.getCharacteristic(Characteristic.MotionDetected)
				.config = that.config;

			services.push(motionSensorService);
			
			_statusObjects[that.config.ref].push(motionSensorService.getCharacteristic(Characteristic.MotionDetected));	
			
			break;
		}
		case "Z-Wave Water Leak Alarm":
		case "LeakSensor": 
		{
			var leakSensorService = new Service.LeakSensor();
			leakSensorService
				.getCharacteristic(Characteristic.LeakDetected)
				.HSRef = that.config.ref;
			
			leakSensorService
				.getCharacteristic(Characteristic.LeakDetected)
				.config = that.config;	

			services.push(leakSensorService);

			_statusObjects[that.config.ref].push(leakSensorService.getCharacteristic(Characteristic.LeakDetected));	
			
			break;
		}
		case "OccupancySensor": {
			var occupancySensorService = new Service.OccupancySensor();
			occupancySensorService
				.getCharacteristic(Characteristic.OccupancyDetected)
				.HSRef = that.config.ref;
				
			occupancySensorService
				.getCharacteristic(Characteristic.OccupancyDetected)
				.config = that.config;					

			services.push(occupancySensorService);
			
			_statusObjects[that.config.ref].push(occupancySensorService.getCharacteristic(Characteristic.OccupancyDetected));	
			
			break;
		}
		case "SmokeSensor": {
			var smokeSensorService = new Service.SmokeSensor();
			smokeSensorService
				.getCharacteristic(Characteristic.SmokeDetected)
				.HSRef = that.config.ref;
				
			smokeSensorService
				.getCharacteristic(Characteristic.SmokeDetected)
				.config = that.config;	

			services.push(smokeSensorService);
			
			_statusObjects[that.config.ref].push(smokeSensorService.getCharacteristic(Characteristic.SmokeDetected));	

			break;
		}
		
		
		case "LightSensor": 
		{
			var lightSensorService = new Service.LightSensor();
			lightSensorService
				.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
				.HSRef = that.config.ref;
				
			lightSensorService
				.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
				.config = that.config;					

			services.push(lightSensorService);
			
			_statusObjects[that.config.ref].push(lightSensorService.getCharacteristic(Characteristic.CurrentAmbientLightLevel));	

			break;
		}
		

		case "HumiditySensor": 
		{
			var humiditySensorService = new Service.HumiditySensor();
			humiditySensorService
				.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.HSRef = that.config.ref;
				
			humiditySensorService
				.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.config = that.config;
				
			services.push(humiditySensorService);
			
			_statusObjects[that.config.ref].push(humiditySensorService.getCharacteristic(Characteristic.CurrentRelativeHumidity));	

			break;
		}
	
		case "Z-Wave Door Lock":
		case "Lock": {
			that.config.lockRef = that.ref;
			var lockService = new Service.LockMechanism();
			lockService.isPrimaryService = true;
			lockService.displayName = "Service.LockMechanism";
			
			lockService
				.getCharacteristic(Characteristic.LockCurrentState)
				.HSRef = that.config.ref;
				
			lockService
				.getCharacteristic(Characteristic.LockCurrentState)
				.config = that.config;					
				
			lockService
				.getCharacteristic(Characteristic.LockTargetState)
				.HSRef = that.config.ref;
					
			lockService
				.getCharacteristic(Characteristic.LockTargetState)
				.config = that.config;		
					
			lockService
				.getCharacteristic(Characteristic.LockTargetState)
				.on('set', that.setHSValue.bind(lockService.getCharacteristic(Characteristic.LockTargetState)));
				// .on('set', that.setLockTargetState.bind(this));
			
			// Next two values are not currently used.
			if (that.config.unlockValue)
				 lockService.getCharacteristic(Characteristic.LockTargetState).HSunlockValue = that.config.unlockValue;
			if (that.config.lockValue)
				lockService.getCharacteristic(Characteristic.LockTargetState).HSlockValue = that.config.lockValue;
		
			lockService.isPrimaryService = true;
		
			services.push(lockService);
			
			_statusObjects[that.config.ref].push(lockService.getCharacteristic(Characteristic.LockCurrentState));
			
			// If an manual lock / unlock occurs, then you need to change the TargetState so that HomeKit
			// presents correct informration about the states. I.e., you need the target state to be updated to be
			// set to the actual state.
			_statusObjects[that.config.ref].push(lockService.getCharacteristic(Characteristic.LockTargetState));
							
			break;
		}
		case "GarageDoorOpener": 
		{
			var garageDoorOpenerService = new Service.GarageDoorOpener();
			garageDoorOpenerService
				.getCharacteristic(Characteristic.CurrentDoorState)
				.HSRef = that.config.ref;
			garageDoorOpenerService
				.getCharacteristic(Characteristic.CurrentDoorState)
				.config = that.config;
				
			garageDoorOpenerService
				.getCharacteristic(Characteristic.TargetDoorState)
				.HSRef = that.config.ref;
			garageDoorOpenerService
				.getCharacteristic(Characteristic.TargetDoorState)
				.config = that.config;
				
			garageDoorOpenerService
				.getCharacteristic(Characteristic.TargetDoorState)
				.on('set', that.setHSValue.bind(garageDoorOpenerService.getCharacteristic(Characteristic.TargetDoorState)));		

			if(that.config.obstructionRef != null)
			{
			garageDoorOpenerService
				.getCharacteristic(Characteristic.ObstructionDetected)
				.HSRef = that.config.obstructionRef;
				_statusObjects[that.config.obstructionRef].push(garageDoorOpenerService.getCharacteristic(Characteristic.ObstructionDetected));
			}
				
			services.push(garageDoorOpenerService);
			_statusObjects[that.config.ref].push(garageDoorOpenerService.getCharacteristic(Characteristic.CurrentDoorState));
			_statusObjects[that.config.ref].push(garageDoorOpenerService.getCharacteristic(Characteristic.TargetDoorState));

			break;
		}

		case "WindowCovering": 
		{
			if (that.config.binarySwitch === undefined)
			{
				if(that.model == "Z-Wave Switch Binary")
				{
					that.config.binarySwitch = true;
				}
				else 
				{ 
					that.config.binarySwitch = false; 
				};
			}
			
			var windowService = new Service.WindowCovering();
			windowService
				.getCharacteristic(Characteristic.CurrentPosition)
				.HSRef = that.config.ref;
			windowService
				.getCharacteristic(Characteristic.CurrentPosition)
				.config = that.config;
				
			windowService
				.getCharacteristic(Characteristic.TargetPosition)
				.HSRef = that.config.ref;
			windowService
				.getCharacteristic(Characteristic.TargetPosition)
				.config = that.config;					
				
			// Is this a simple binary on / off switch (fully opened / fully closed)?
			// Then identify it as such if the user hasn't already done so!

			
			// console.log(chalk.cyan.bold("Window Binary Setting is: " + that.config.binarySwitch));
		/*	windowService
				.getCharacteristic(Characteristic.TargetPosition)
				.binarySwitch = that.config.binarySwitch;	
		*/
			
			windowService
				.getCharacteristic(Characteristic.TargetPosition)
				.on('set', that.setHSValue.bind(windowService.getCharacteristic(Characteristic.TargetPosition)));		

			if(that.config.obstructionRef != null)
			{
			windowService
				.getCharacteristic(Characteristic.ObstructionDetected)
				.HSRef = that.config.obstructionRef;
				
			windowService
				.getCharacteristic(Characteristic.ObstructionDetected)
				.config = that.config;					
				_statusObjects[that.config.obstructionRef].push(windowService.getCharacteristic(Characteristic.ObstructionDetected));
			}
				
			services.push(windowService);
			_statusObjects[that.config.ref].push(windowService.getCharacteristic(Characteristic.CurrentPosition));
			_statusObjects[that.config.ref].push(windowService.getCharacteristic(Characteristic.TargetPosition));


			break;
		}		
		
		case "Fan": {
			var fanService = new Service.Fan
			fanService.isPrimaryService = true;
			fanService.displayName = "Service.Fan";
			
			fanService
				.getCharacteristic(Characteristic.On)
				.HSRef = that.config.ref;	
			fanService
				.getCharacteristic(Characteristic.On)
				.config = that.config;	
				
			fanService
				.getCharacteristic(Characteristic.On)
				.on('set', that.setHSValue.bind(fanService.getCharacteristic(Characteristic.On)));
				
			_statusObjects[that.config.ref].push(fanService.getCharacteristic(Characteristic.On));	

			if (that.config.can_dim === undefined) // if can_dim is undefined, set it to 'true' unless its a Z-Wave Binary Switch.
			{
				that.config.can_dim = true; // default to true
				
				if ( (that.model.indexOf("Z-Wave") != -1) && (that.model == "Z-Wave Switch Binary"))
				{
					that.config.can_dim = false;
				}
			}
			
			if (typeof(that.config.can_dim) == "string")
			{	// This error should have been checked and fixe by the checkConfig() function, but this is a debugging check.
				var error = chalk.red.bold("Program Error. can_dim setting has a type of 'string'. Should be 'boolean' for device with reference " + that.ref)
				throw new SyntaxError(error);
			}
					

			if (that.config.can_dim == true) {
				
				if ( (that.model.indexOf("Z-Wave") != -1) && (that.model != "Z-Wave Switch Multilevel"))
				{
					that.log(chalk.magenta.bold("* Warning * - Check can_dim setting for Fan named: " + that.name + ", and HomeSeer reference: " + that.config.ref ));
					that.log(chalk.magenta.bold("HomeSeer reports model type: " + that.model + ", which typically does not provide rotation speed adjustment."));
				}
				//Z-Wave uses a scale of 1-99 percent, so set a flag to indicate its Z-Wave
				//and use it in later code to adjust percentages.
				if(that.config.uses99Percent === undefined)
				{	
					if (that.model.indexOf("Z-Wave") != -1) 
					{
						that.config.uses99Percent = true;
					}	
					else that.config.uses99Percent = false;
				}

				
				that.log("          Adding RotationSpeed to Fan");
				fanService
					.addCharacteristic(new Characteristic.RotationSpeed())
					.config = that.config;
				fanService
					.getCharacteristic(Characteristic.RotationSpeed)
					.HSRef = that.config.ref;						
					
				fanService
					.getCharacteristic(Characteristic.RotationSpeed)
					.on('set', that.setHSValue.bind(fanService.getCharacteristic(Characteristic.RotationSpeed)));
			_statusObjects[that.config.ref].push(fanService.getCharacteristic(Characteristic.RotationSpeed));						
			}
			else
			{
				if ( (that.model.indexOf("Z-Wave") != -1) && (that.model == "Z-Wave Switch Multilevel"))
				{
					that.log(chalk.magenta.bold("* Warning * - Check can_dim setting for Fan named: " + that.name + ", and HomeSeer reference: " + that.config.ref ));
					that.log(chalk.magenta.bold("Setting without rotation speed adjustment, but HomeSeer reports model type: " + that.model + ", which typically does provide rotation speed adjustment."));
				}					
			}

			services.push(fanService);
			break;
		}	
		
		case "Z-Wave Switch Multilevel":
		case "Lightbulb": 
		default: 
		{
			if(!that.config || !that.config.type || (that.config.type == null))
			{
				that.log(chalk.bold.yellow("WARNING: adding unspecified device type with HomeSeer reference " + that.config.ref + ". Defaulting to type Lightbulb. "));
				that.log(chalk.bold.yellow("Future versions of this plugin may require specification of the type of each device."));
				that.log(chalk.bold.yellow("Please update your config.json file to specify the device type."));
			}
			
			// that.log("** Debug ** - Setting up bulb %s with can_dim: %s", that.config.name, that.config.can_dim);
			var lightbulbService = new Service.Lightbulb();
			lightbulbService.isPrimaryService = true;
			lightbulbService.displayName = "Service.Lightbulb"
			
			lightbulbService
				.getCharacteristic(Characteristic.On)
				.HSRef = that.config.ref;
				
			lightbulbService
				.getCharacteristic(Characteristic.On)
				.config = that.config;					
			
			lightbulbService
				.getCharacteristic(Characteristic.On)
				.on('set', that.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.On)));
				// .on('get', that.getPowerState.bind(this));
				
			_statusObjects[that.config.ref].push(lightbulbService.getCharacteristic(Characteristic.On));
			

			if (that.config.can_dim === undefined) // if can_dim is undefined, set it to 'true' unless its a Z-Wave Binary Switch.
			{
				that.config.can_dim = true; // default to true
				
				if ( (that.model.indexOf("Z-Wave") != -1) && (that.model == "Z-Wave Switch Binary"))
				{
					that.config.can_dim = false;
				}
			}
	
			if (typeof(that.config.can_dim) == "string")
			{	// This error should have been checked and fixe by the checkConfig() function, but this is a debugging check.
				var error = chalk.red.bold("Program Error. can_dim setting has a type of 'string'. Should be 'boolean' for device with reference " + that.ref)
				throw new SyntaxError(error);
			}

			if (that.config.can_dim == true) 
			{
				// that.log(chalk.magenta.bold("*Debug* Making lightbulb dimmable"));
				
				if ( (that.model.indexOf("Z-Wave") != -1) && (that.model != "Z-Wave Switch Multilevel"))
				{
					that.log(chalk.magenta.bold("* Warning * - Check can_dim setting. Setting Lightbulb named " + that.name + " and HomeSeer reference " + that.config.ref + " as dimmable, but"));
					that.log(chalk.magenta.bold("HomeSeer reports model type: " + that.model + " which is typically a non-dimmable type"));

				}
				//Z-Wave uses a scale of 1-99 percent, so set a flag to indicate its Z-Wave
				//and use it in later code to adjust percentages.
				if(that.config.uses99Percent === undefined)
				{	
					if (that.model.indexOf("Z-Wave") != -1) 
					{
						that.config.uses99Percent = true;
					}	
					else that.config.uses99Percent = false;
				}
				
				lightbulbService
					.addCharacteristic(new Characteristic.Brightness())
					.HSRef = that.config.ref;
					
				lightbulbService
					.getCharacteristic(Characteristic.Brightness)
					.config = that.config;							
				
				lightbulbService
					.getCharacteristic(Characteristic.Brightness)
					.on('set', that.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.Brightness)));
					
				_statusObjects[that.config.ref].push(lightbulbService.getCharacteristic(Characteristic.Brightness));
			}
			else
			{
				if ( (that.model.indexOf("Z-Wave") != -1) && (that.model == "Z-Wave Switch Multilevel"))
				{
					that.log(chalk.magenta.bold("* Warning * - Check can_dim setting. Setting Lightbulb named " + that.name + " and HomeSeer reference " + that.config.ref + " as non-dimmable, but"));
					that.log(chalk.magenta.bold("HomeSeer reports model type: " + that.model + " which is typically a dimmable type"));
				}
			}

			services.push(lightbulbService);

			break;
		}
	}
	 // If batteryRef has been defined, then add a battery service.
	if (that.config.batteryRef) 
	{
	
	if (that.config.batteryThreshold === undefined) that.config.batteryThreshold = 25;
	
	var batteryService = new Service.BatteryService();
	batteryService.displayName = "Service.BatteryService";
	
	batteryService
		.getCharacteristic(Characteristic.BatteryLevel)
		.HSRef = that.config.batteryRef;
		
	batteryService
		.getCharacteristic(Characteristic.BatteryLevel)
		.config = that.config;
		
	batteryService
		.getCharacteristic(Characteristic.StatusLowBattery)
		.HSRef = that.config.batteryRef;
		
	batteryService
		.getCharacteristic(Characteristic.StatusLowBattery)
		.config = that.config;						
	
	services.push(batteryService);
	
	_statusObjects[that.config.batteryRef].push(batteryService.getCharacteristic(Characteristic.BatteryLevel));
	_statusObjects[that.config.batteryRef].push(batteryService.getCharacteristic(Characteristic.StatusLowBattery));					
	}
			
	// And add a basic Accessory Information service		
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, that.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + that.config.type + " ref " + that.ref);
	services.push(informationService);
	// 
}
