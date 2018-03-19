var exports = module.exports;
var chalk = require("chalk");
// var Characteristic = require("hap-nodejs").Characteristic;
// var Service = require("hap-nodejs").Service;


exports.setupServices = function (that, services, _statusObjects, Characteristic, Service)
{
Characteristic.prototype.updateUsingHSReference = function(value) 
{
  this.HSRef = value;
  _statusObjects[value].push(this);
  return this;
}
Characteristic.prototype.setConfigValues = function(value) 
{
  this.config = value;
  return this;
}		
			
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
			switchService.displayName = "Service.Switch";
			
			switchService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(switchService.getCharacteristic(Characteristic.On)));

			services.push(switchService);
			break;
		}
		
		case "Outlet": {
			var outletService = new Service.Outlet();
			outletService.isPrimaryService = true;
			outletService.displayName = "Service.Outlet";
			
			outletService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(outletService.getCharacteristic(Characteristic.On)));

			services.push(outletService);
			break;
		}
		
		case "Z-Wave Temperature":
		case "TemperatureSensor": 
		{
			var temperatureSensorService = new Service.TemperatureSensor();
			temperatureSensorService.isPrimaryService = true;
			temperatureSensorService.displayName = "Service.TemperatureSensor";
			
			if (that.config.temperatureUnit === undefined) that.config.temperatureUnit = "F";	
			
			temperatureSensorService.getCharacteristic(Characteristic.CurrentTemperature)
				.setProps({ minValue: -100 })
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			services.push(temperatureSensorService);
			break;
		}
		
		case "Thermostat": {
			var thermostatService = new Service.Thermostat();
			thermostatService.displayName = "Service.Thermostat";
			
			thermostatService.getCharacteristic(Characteristic.CurrentTemperature)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			thermostatService.getCharacteristic(Characteristic.TargetTemperature)
				.updateUsingHSReference(that.config.setPointRef)
				.setConfigValues(that.config)	
				.on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.TargetTemperature)));

			thermostatService
				.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
				.updateUsingHSReference(that.config.stateRef)
				.setConfigValues(that.config);
				
			thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
				.updateUsingHSReference(that.config.controlRef) 
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)));
				
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
			
			thermostatService
				.getCharacteristic(Characteristic.TemperatureDisplayUnits)
					.on('change', (data)=>
					{
						console.log(chalk.magenta.bold("*Debug * - Temperature Display Units set to: " + data.newValue + ", from: " + data.oldValue));
					});

			services.push(thermostatService);
			break;
		}
		
		case "CarbonMonoxideSensor": {
			var carbonMonoxideSensorService = new Service.CarbonMonoxideSensor();
			carbonMonoxideSensorService.isPrimaryService = true;
			carbonMonoxideSensorService.displayName = "Service.CarbonMonoxideSensor";
			
			carbonMonoxideSensorService.getCharacteristic(Characteristic.CarbonMonoxideDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);					

			services.push(carbonMonoxideSensorService);
			break;
		}
		
		case "CarbonDioxideSensor": {
			var carbonDioxideSensorService = new Service.CarbonDioxideSensor();
			carbonDioxideSensorService.isPrimaryService = true;
			carbonDioxideSensorService.displayName = "Service.CarbonDioxideSensor";
			
			carbonDioxideSensorService
				.getCharacteristic(Characteristic.CarbonDioxideDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			services.push(carbonDioxideSensorService);
			break;
		}
		
		case "ContactSensor": {
			var contactSensorService = new Service.ContactSensor();
			contactSensorService.isPrimaryService = true;
			contactSensorService.displayName = "Service.ContactSensor";
			
			contactSensorService
				.getCharacteristic(Characteristic.ContactSensorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);	

			services.push(contactSensorService);
			break;
		}
		
		case "MotionSensor": {
			var motionSensorService = new Service.MotionSensor();
			motionSensorService.isPrimaryService = true;
			motionSensorService.displayName = "Service.MotionSensor";
			
			motionSensorService
				.getCharacteristic(Characteristic.MotionDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);

			services.push(motionSensorService);
			break;
		}
		
		case "Z-Wave Water Leak Alarm":
		case "LeakSensor": 
		{
			var leakSensorService = new Service.LeakSensor();
			leakSensorService.displayName = "Service.LeakSensor";
			
			leakSensorService.getCharacteristic(Characteristic.LeakDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);	

			services.push(leakSensorService);
			break;
		}
		
		case "OccupancySensor": {
			var occupancySensorService = new Service.OccupancySensor();
			occupancySensorService.displayName = "Service.OccupancySensor";
			
			occupancySensorService.getCharacteristic(Characteristic.OccupancyDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);					

			services.push(occupancySensorService);
			break;
		}
		
		case "SmokeSensor": {
			var smokeSensorService = new Service.SmokeSensor();
			smokeSensorService.displayName = "Service.SmokeSensor";
			
			smokeSensorService.getCharacteristic(Characteristic.SmokeDetected)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);	

			services.push(smokeSensorService);
			break;
		}
		
		case "LightSensor": 
		{
			var lightSensorService = new Service.LightSensor();
			lightSensorService.displayName = "Service.LightSensor";
			
			lightSensorService.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);					

			services.push(lightSensorService);
			break;
		}
		
		case "HumiditySensor": 
		{
			var humiditySensorService = new Service.HumiditySensor();
			humiditySensorService.displayName = "Service.HumiditySensor";
			
			humiditySensorService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			services.push(humiditySensorService);
			break;
		}
		
		case "SecuritySystem":
		{
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
				
			services.push(securitySystemService);

			break;			
		}
	
		case "Z-Wave Door Lock":
		case "Lock": {
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
		
			// Next two values are not currently used.
			if (that.config.unlockValue)
				 lockService.getCharacteristic(Characteristic.LockTargetState).HSunlockValue = that.config.unlockValue;
			if (that.config.lockValue)
				lockService.getCharacteristic(Characteristic.LockTargetState).HSlockValue = that.config.lockValue;
		
			lockService.isPrimaryService = true;
		
			services.push(lockService);
			break;
		}
		
		case "GarageDoorOpener": 
		{
			var garageDoorOpenerService = new Service.GarageDoorOpener();
			garageDoorOpenerService.displayName = "Service.GarageDoorOpener";
			
			garageDoorOpenerService.getCharacteristic(Characteristic.CurrentDoorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			garageDoorOpenerService.getCharacteristic(Characteristic.TargetDoorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(garageDoorOpenerService.getCharacteristic(Characteristic.TargetDoorState)));		

			if(that.config.obstructionRef != null)
			{
			garageDoorOpenerService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef);
			}
				
			services.push(garageDoorOpenerService);
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
				
			services.push(windowService);
			break;
		}		
		
		case "Fan": {
			var fanService = new Service.Fan
			fanService.isPrimaryService = true;
			fanService.displayName = "Service.Fan";
			
			fanService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(fanService.getCharacteristic(Characteristic.On)));

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
				fanService.addCharacteristic(new Characteristic.RotationSpeed())
					.setConfigValues(that.config)
					.updateUsingHSReference(that.config.ref)
					.on('set', that.setHSValue.bind(fanService.getCharacteristic(Characteristic.RotationSpeed)));
						
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
			
			lightbulbService.getCharacteristic(Characteristic.On)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', that.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.On)));

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
				
				lightbulbService.addCharacteristic(new Characteristic.Brightness())
					.updateUsingHSReference(that.config.ref)
					.setConfigValues(that.config)
					.on('set', that.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.Brightness)));
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
		
		batteryService.getCharacteristic(Characteristic.BatteryLevel)
			.updateUsingHSReference(that.config.batteryRef)
			.setConfigValues(that.config);
			
		batteryService
			.getCharacteristic(Characteristic.StatusLowBattery)
			.updateUsingHSReference(that.config.batteryRef)
			.setConfigValues(that.config);						
		
		services.push(batteryService);
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
