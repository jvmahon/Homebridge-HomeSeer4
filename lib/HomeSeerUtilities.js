'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var Characteristic = require("hap-nodejs").Characteristic;
var Service = require("hap-nodejs").Service;

var checkDefaults = require("../lib/DeviceDefaults");

var globals = require("../index.js").globals;
var HomeSeerData = require("../index.js").HomeSeer;




globals.findControlPairByCommand = function (ref, command)
{
		// globals.log(yellow("Finding Control Pairs for reference: " + ref +", and command: " + command));

	let validCommands = [ 
			{label: "NotSpecified", 	controlValue: 0},
			{label: "On", 				controlValue: 1},
			{label: "Off", 				controlValue: 2},
			{label: "Dim", 				controlValue: 3},
			{label: "OnAlternate", 		controlValue: 4},
			{label: "Play", 			controlValue: 5},
			{label: "Pause", 			controlValue: 6},
			{label: "Stop", 			controlValue: 7},
			{label: "Forward", 			controlValue: 8},
			{label: "Rewind", 			controlValue: 9},
			{label: "Repeat", 			controlValue: 10},
			{label: "Shuffle", 			controlValue: 11},
			{label: "HeatSetPoint", 	controlValue: 12},
			{label: "CoolSetPoint", 	controlValue: 13},
			{label: "ThermModeOff", 	controlValue: 14},
			{label: "ThermModeHeat", 	controlValue: 15},
			{label: "ThermModeCool", 	controlValue: 16},
			{label: "ThermModeAuto", 	controlValue: 17},
			{label: "DoorLock", 		controlValue: 18},
			{label: "DoorUnLock", 		controlValue: 19},
			{label: "ThermFanAuto", 	controlValue: 20},
			{label: "ThermFanOn", 		controlValue: 21},
			{label: "ColorControl", 	controlValue: 22},
			{label: "DimFan", 			controlValue: 23},
			{label: "MotionActive", 	controlValue: 24},
			{label: "MotionInActive", 	controlValue: 25},
			{label: "ContactActive", 	controlValue: 26},
			{label: "ContactInActive", 	controlValue: 27},
			{label: "Mute", 			controlValue: 28},
			{label: "UnMute", 			controlValue: 29},
			{label: "MuteToggle", 		controlValue: 30},
			{label: "Next", 			controlValue: 31},
			{label: "Previous", 		controlValue: 32},
			{label: "Volume", 			controlValue: 33}
		]
		

		

		if (isNaN(command))
		{
			let item = validCommands.find( (element) => { return ( element.label.toLowerCase() == command.toLowerCase() )});
			command = item.controlValue;
			// globals.log(green("Command Number: " + command));
		}
		
		
		try {		
				// Next line searches for the HomeSeer Device by its reference.					
				let thisCommandControl = HomeSeerData.getControlPairByUseType(ref, command);
				// globals.log(yellow("Control pairs are: " + JSON.stringify(allThisDevicesControls)));
		
				if (thisCommandControl === undefined) 
					{
						// globals.log(red("Line 85: Device: " + ref + " does not support command: " + command +", returning undefined"));
						return undefined;
					};
					
					return thisCommandControl;
		}
		catch(err)
		{
			globals.log(red(err));
			globals.log(red("*Error line 94* - Unable to find control pair in routine findControlPairByCommand for reference: " + ref + ", and command: " + command ));
			return(undefined)
		}
}

globals.findCommandValue = function(ref, command)
{
	var controls = globals.findControlPairByCommand(ref, command);
	if (controls === undefined) 
	{
		// globals.log(yellow("*Error line 104* - Unable to find control pair in routine findControlPairByCommand for reference: " + ref + ", and command: " + command +", returning undefined"));
		return undefined
	}
	
	// globals.log(chalk.yellow("For device reference: " + ref + ", command: " + command + " has control value: " + controls.ControlValue));
	return (controls.ControlValue);
	
}

module.exports.deviceInHomeSeer = function(ref)
{
	// This check has not yet been implemented!
	// globals.log(red("Warning: Using non-implemented function deviceInHomeSeer with reference: " + ref));
	return true;
}

var parseBoolean = function(value)
{
	if (typeof value == "boolean") return value;
	
	if (value === 0) return false;
	if (value === 1) return true;
	
	if (typeof value == "string")
	{
		switch(value.toLowerCase())
		{
			case("1"):
			case("true"):
			{
				return true;
				break;
			}
			case("0"):
			case("false"):
			{
				return false;
				break;
			}
			default:
			{
				var error = red("Boolean true/false expected but value: ") + cyan(value) + red(" Is not a Valid boolean")
				throw new TypeError(error);
			}
		} 
	}
}

var alreadyUsedUUIDbase;
var usedUUIDs = [];

var alreadyUsedUUIDbase = function(uuid_base)
{
	if( usedUUIDs.indexOf(uuid_base) == -1 )
	{
		usedUUIDs.push(uuid_base);
	}
	else return true;
}
exports.alreadyUsedUUIDbase = alreadyUsedUUIDbase;

var config;
var checkConfig = function(config)
{
	var error = [];
	
	try 
	{ 
		globals.log(green("Checking Configuration Data"));
		// globals.log(cyan(JSON.stringify(config)));
		// globals.log(yellow(JSON.stringify(globals.platformConfig)));
		
		
		for (let thisAccessoryConfigData of config.accessories)
		{
			// This is used for reporting changes at the close of the for loop.
			const initialData = JSON.stringify(thisAccessoryConfigData) ;

			//	Make sure the specified HomeSeer device references are all numbers
			// globals.log(yellow("*Debug* - thisAccessoryConfigData is: " + JSON.stringify(thisAccessoryConfigData)));
			
			if (thisAccessoryConfigData.ref === undefined)
			{
				error =  red("config.json error for device of type: ")
					+ cyan(thisAccessoryConfigData.type)
					+ red(" missing mandatory ")
					+ cyan("'ref'")
					+ red(" property. Specified properties are: "
					+ cyan( JSON.stringify(thisAccessoryConfigData ))) 
				throw new SyntaxError(error);
			}
			if( isNaN(thisAccessoryConfigData.ref))
			{
				error =  red("config.json error for device name: ")
					+ cyan(thisAccessoryConfigData.name)
					+ red(" ref value is not a number for ref: ") 
					+ cyan(thisAccessoryConfigData.ref);
				throw new TypeError(error);
			}
			
			if (thisAccessoryConfigData.type == "Lightbulb")
			{
				let isDimmer = HomeSeerData.supportsDimming(thisAccessoryConfigData.ref) 
				if (isDimmer)
				{
					// globals.log(magenta("Changing LightBulb type to DimmingLight for reference: " + thisAccessoryConfigData.ref));
					thisAccessoryConfigData.type = "DimmingLight"
				}
				else
				{
					// globals.log(magenta("Changing LightBulb type to BinaryLight for reference: " + thisAccessoryConfigData.ref));
					thisAccessoryConfigData.type = "BinaryLight"
				}
			}
			if (thisAccessoryConfigData.type == "Window")
			{
				let isVariable = HomeSeerData.supportsDimming(thisAccessoryConfigData.ref) 
				if (isVariable)
				{
					// globals.log(green("Changing Window type to VariableWindow for reference: " + thisAccessoryConfigData.ref));
					thisAccessoryConfigData.type = "VariableWindow"
				}
				else
				{
					// globals.log(green("Changing Window type to BinaryWindow for reference: " + thisAccessoryConfigData.ref));
					thisAccessoryConfigData.type = "BinaryWindow"
				}
			}
			
			if (thisAccessoryConfigData.type == "WindowCovering")
			{
				let isVariable = HomeSeerData.supportsDimming(thisAccessoryConfigData.ref) 
				if (isVariable)
				{
					// globals.log(magenta("Changing WindowCovering type to VariableWindowCovering for reference: " + thisAccessoryConfigData.ref));
					thisAccessoryConfigData.type = "VariableWindowCovering"
				}
				else
				{
					// globals.log(magenta("Changing WindowCovering type to BinaryWindowCovering for reference: " + thisAccessoryConfigData.ref));
					thisAccessoryConfigData.type = "BinaryWindowCovering"
				}
			}
			
			if (thisAccessoryConfigData.type == "Fan")
			{
				let isDimmer =  HomeSeerData.supportsDimming(thisAccessoryConfigData.ref) 
				if (isDimmer)
				{
					// globals.log(magenta("Changing Fan type to MultilevelFan for reference: " + thisAccessoryConfigData.ref));
					thisAccessoryConfigData.type = "MultilevelFan"
				}
				else
				{
					// globals.log(magenta("Changing Fan type to BinaryFan for reference: " + thisAccessoryConfigData.ref));
					thisAccessoryConfigData.type = "BinaryFan"
				}
			}
			// Find the HomeSeer device corresponding to the current thisAccessoryConfigData item.
			let findRef = thisAccessoryConfigData.ref || 0;

				
			
			// Name the unnamed!
			if (thisAccessoryConfigData.name === undefined)
			{
				thisAccessoryConfigData.name = HomeSeerData.getLocation(findRef) + " " + HomeSeerData.getName(findRef)
				if( thisAccessoryConfigData.name.length > 64) 
					{ 
						globals.log(red("Warning - Excess name length, trimming default name to 64 characters for device: " + thisAccessoryConfigData.name));
						thisAccessoryConfigData.name = thisAccessoryConfigData.name.slice(0,64); 
					} // Maximum HomeKit name length
			}
						
			thisAccessoryConfigData.interface_name = HomeSeerData.getInterfaceName(findRef) || "Unknown";
						
			// If the user has not specified a .uuid_base, create one.
			if(!thisAccessoryConfigData.uuid_base) 
				{
					thisAccessoryConfigData.uuid_base = "Ref" + thisAccessoryConfigData.ref;
				}
			
			// Make sure that each uuid_base is used only once!
			if(alreadyUsedUUIDbase(thisAccessoryConfigData.uuid_base))
			{
				error =  red("ERROR: config.json error for device name: ") 	+ cyan(thisAccessoryConfigData.name) 
						+ red(", of type: ")  + cyan(thisAccessoryConfigData.type)
						+ red(" Device base_uuid already used for base_uuid: ") + cyan(thisAccessoryConfigData.uuid_base)
						+ red(". If you have intentionally used the same HomeSeer reference for more than one device, you need to manually set the 'uuid_base' values in config.json for these devices. Don't use the label 'Ref' followed by a number, but any other non-duplicate value should work!");

				throw new SyntaxError(error);
			}			
			
			//////////////////   Battery Checking ////////////
			
			// globals.log(magenta("*Debug* - Found Batteries: " + findBattery(thisAccessoryConfigData.ref) ));
			
			var deviceBattery = HomeSeerData.findBattery(thisAccessoryConfigData.ref);
			if (deviceBattery)
			{
				if (thisAccessoryConfigData.batteryRef === undefined ||  thisAccessoryConfigData.batteryRef == null) 
				{
					globals.log(yellow("Added a battery to device#: " + thisAccessoryConfigData.ref ));
					thisAccessoryConfigData.batteryRef = deviceBattery;
				}
				else
				{
					if (thisAccessoryConfigData.batteryRef != deviceBattery) 
					{
						globals.log(
								red("Wrong battery Specified for device Reference #: ") 
								+ cyan(thisAccessoryConfigData.ref)
								+ red(" You specified reference: ") 
								+ cyan(thisAccessoryConfigData.batteryRef) 
								+ red(" but correct device reference appears to be: ") 
								+ cyan(deviceBattery)
								+ red(". Fixing error."));
								
						thisAccessoryConfigData.batteryRef = deviceBattery;
					}	
				}

				if ((deviceBattery == false) && (thisAccessoryConfigData.batteryRef)  )
				{
					globals.log(yellow("You specified battery reference: "+ thisAccessoryConfigData.batteryRef + " for device Reference #: " + thisAccessoryConfigData.ref 
					+ " but device does not seem to be battery operated. Check config.json file and fix if this is an error."));
				}	
			}
			
			//////////////////////////////////////////
			

			// If type is undefined, default based on Z-Wave type or if all else fails, to a lightbulb!
			if (thisAccessoryConfigData.type === undefined) 
			{

				throw new SyntaxError( red("*Error* - Device specified in config.json with undefined 'type' property. Correct error and retry HomeBridge"))
				
			}


			// Has a valid type been specified?		
			if (checkDefaults.hasValidType(thisAccessoryConfigData) == false)
			{
				error = 	red("config.json settings error for device name: ") 
						+ 	cyan(thisAccessoryConfigData.name) 
						+ 	red(", Incorrect device type: ") + cyan(thisAccessoryConfigData.type);
				throw new SyntaxError(error);
			}
				
			// Check that the config.json entry only specifies valid properties - no typos!
			checkDefaults.hasValidProperties(thisAccessoryConfigData); // This will throw an error if properties are incorrect!
			
			// Make sure it has its mandatory properties
			if( checkDefaults.hasMandatoryProperties(thisAccessoryConfigData) == false)
			{ 
				error = red("config.json settings error for device name: ") + cyan(thisAccessoryConfigData.name) 
								+ red(": is missing a mandatory property.")
				throw new SyntaxError(error)
			};

			// check the remaining properties and fill in default values for any
			// that need to be there but haven't been specified.
			checkDefaults.setMissingDefaults(thisAccessoryConfigData)
			
			
			// Any Additional type-specific checking is performed here!
			switch(thisAccessoryConfigData.type)
			{
				
				case ("Window"):
				case ("WindowCovering"):
				{
					
					if(CurrentHomeSeerDevice.device_type_string == "Z-Wave Switch Binary")
						{ thisAccessoryConfigData.binarySwitch = true; }

					
					if(thisAccessoryConfigData.binarySwitch != null)
					{
						thisAccessoryConfigData.binarySwitch = parseBoolean(thisAccessoryConfigData.binarySwitch) 	
					} 
					break
				}	
				
				case ("Valve"):
				{
					if (thisAccessoryConfigData.useTimer)
					{
						checkDefaults.setMissingDefaults(thisAccessoryConfigData, "minTime");
					}
					break;
				}
				
			} // end switch.
			
			

					//	Make sure the specified HomeSeer device references are all numbers
			if((thisAccessoryConfigData.batteryRef != null) && (isNaN(thisAccessoryConfigData.batteryRef)))
			{
				error =  red( "config.json error for device name: ") 
						+ cyan(thisAccessoryConfigData.name)
						+ red(" batteryRef value is not a number for associated HomeSeer ref: " )
						+ cyan(thisAccessoryConfigData.ref);
				throw new TypeError(error);
			}

			var finalData = JSON.stringify(thisAccessoryConfigData)
			initialData
			// globals.log("Config.json property information updated from: " + cyan(initialData) + " to: " + cyan( finalData));	
		}	

		return true;
	}
	catch(err)
	{
		throw err;
		return false;
	} 
}
exports.checkConfig = checkConfig;


var isValidUUID = function(uuid)
{
	switch(uuid)
	{
		// UUIDs for Services
		case( Service.AccessoryInformation.UUID ):  
		case( Service.AirPurifier.UUID ):  
		case( Service.AirQualitySensor.UUID ):  
		case( Service.BatterycaseService.UUID ):  
		case( Service.CameraRTPStreamManagement.UUID ):  
		case( Service.CarbonDioxideSensor.UUID ):  
		case( Service.CarbonMonoxideSensor.UUID ):  
		case( Service.ContactSensor.UUID ):  
		case( Service.Door.UUID ):  
		case( Service.Doorbell.UUID ):  
		case( Service.Fan.UUID ):  
		case( Service.Fanv2.UUID ):  
		case( Service.FilterMaintenance.UUID ):  
		case( Service.Faucet.UUID ):  
		case( Service.GarageDoorOpener.UUID ):  
		case( Service.HeaterCooler.UUID ):  
		case( Service.HumidifierDehumidifier.UUID ):  
		case( Service.HumiditySensor.UUID ):  
		case( Service.IrrigationSystem.UUID ):  
		case( Service.LeakSensor.UUID ):  
		case( Service.LightSensor.UUID ):  
		case( Service.Lightbulb.UUID ):  
		case( Service.LockManagement.UUID ):  
		case( Service.LockMechanism.UUID ):  
		case( Service.Microphone.UUID ):  
		case( Service.MotionSensor.UUID ):  
		case( Service.OccupancySensor.UUID ):  
		case( Service.Outlet.UUID ):  
		case( Service.SecuritySystem.UUID ):  
		case( Service.ServiceLabel.UUID ):  
		case( Service.Slat.UUID ):  
		case( Service.SmokeSensor.UUID ):  
		case( Service.Speaker.UUID ):  
		case( Service.StatelessProgrammableSwitch.UUID ):  
		case( Service.Switch.UUID ):  
		case( Service.TemperatureSensor.UUID ):  
		case( Service.Thermostat.UUID ):  
		case( Service.Valve.UUID ):  
		case( Service.Window.UUID ):  
		case( Service.WindowCovering.UUID ):  

		// UUIDs for Characteristics
		case( Characteristic.Active.UUID ):  
		case( Characteristic.AdministratorOnlyAccess.UUID ):  
		case( Characteristic.AirParticulateDensity.UUID ):  
		case( Characteristic.AirParticulateSize.UUID ):  
		case( Characteristic.AirQuality.UUID ):  
		case( Characteristic.AudioFeedback.UUID ):  
		case( Characteristic.BatteryLevel.UUID ):  
		case( Characteristic.Brightness.UUID ):  
		case( Characteristic.CarbonDioxideDetected.UUID ):  
		case( Characteristic.CarbonDioxideLevel.UUID ):  
		case( Characteristic.CarbonDioxidePeakLevel.UUID ):  
		case( Characteristic.CarbonMonoxideDetected.UUID ):  
		case( Characteristic.CarbonMonoxideLevel.UUID ):  
		case( Characteristic.CarbonMonoxidePeakLevel.UUID ):  
		case( Characteristic.ChargingState.UUID ):  
		case( Characteristic.ColorTemperature.UUID ):  
		case( Characteristic.ContactSensorState.UUID ):  
		case( Characteristic.CoolingThresholdTemperature.UUID ):  
		case( Characteristic.CurrentAirPurifierState.UUID ):  
		case( Characteristic.CurrentAmbientLightLevel.UUID ):  
		case( Characteristic.CurrentDoorState.UUID ):  
		case( Characteristic.CurrentFanState.UUID ):  
		case( Characteristic.CurrentHeaterCoolerState.UUID ):  
		case( Characteristic.CurrentHeatingCoolingState.UUID ):  
		case( Characteristic.CurrentHorizontalTiltAngle.UUID ):  
		case( Characteristic.CurrentHumidifierDehumidifierState.UUID ):  
		case( Characteristic.CurrentPosition.UUID ):  
		case( Characteristic.CurrentRelativeHumidity.UUID ):  
		case( Characteristic.CurrentSlatState.UUID ):  
		case( Characteristic.CurrentTemperature.UUID ):  
		case( Characteristic.CurrentTiltAngle.UUID ):  
		case( Characteristic.CurrentVerticalTiltAngle.UUID ):  
		case( Characteristic.DigitalZoom.UUID ):  
		case( Characteristic.FilterChangeIndication.UUID ):  
		case( Characteristic.FilterLifeLevel.UUID ):  
		case( Characteristic.FirmwareRevision.UUID ):  
		case( Characteristic.HardwareRevision.UUID ):  
		case( Characteristic.HeatingThresholdTemperature.UUID ):  
		case( Characteristic.HoldPosition.UUID ):  
		case( Characteristic.Hue.UUID ):  
		case( Characteristic.Identify.UUID ):  
		case( Characteristic.ImageMirroring.UUID ):  
		case( Characteristic.ImageRotation.UUID ):  
		case( Characteristic.InUse.UUID ):  
		case( Characteristic.IsConfigured.UUID ):  
		case( Characteristic.LeakDetected.UUID ):  
		case( Characteristic.LockControlPoint.UUID ):  
		case( Characteristic.LockCurrentState.UUID ):  
		case( Characteristic.LockLastKnownAction.UUID ):  
		case( Characteristic.LockManagementAutoSecurityTimeout.UUID ):  
		case( Characteristic.LockPhysicalControls.UUID ):  
		case( Characteristic.LockTargetState.UUID ):  
		case( Characteristic.Logs.UUID ):  
		case( Characteristic.Manufacturer.UUID ):  
		case( Characteristic.Model.UUID ):  
		case( Characteristic.MotionDetected.UUID ):  
		case( Characteristic.Mute.UUID ):  
		case( Characteristic.Name.UUID ):  
		case( Characteristic.NightVision.UUID ):  
		case( Characteristic.NitrogenDioxideDensity.UUID ):  
		case( Characteristic.ObstructionDetected.UUID ):  
		case( Characteristic.OccupancyDetected.UUID ):  
		case( Characteristic.On.UUID ):  
		case( Characteristic.OpticalZoom.UUID ):  
		case( Characteristic.OutletInUse.UUID ):  
		case( Characteristic.OzoneDensity.UUID ):  
		case( Characteristic.PairSetup.UUID ):  
		case( Characteristic.PairVerify.UUID ):  
		case( Characteristic.PairingFeatures.UUID ):  
		case( Characteristic.PairingPairings.UUID ):  
		case( Characteristic.PM10Density.UUID ):  
		case( Characteristic.PM2_5Density.UUID ):  
		case( Characteristic.PositionState.UUID ):  
		case( Characteristic.ProgramMode.UUID ):  
		case( Characteristic.ProgrammableSwitchEvent.UUID ):  
		case( Characteristic.RelativeHumidityDehumidifierThreshold.UUID ):  
		case( Characteristic.RelativeHumidityHumidifierThreshold.UUID ):  
		case( Characteristic.RemainingDuration.UUID ):  
		case( Characteristic.ResetFilterIndication.UUID ):  
		case( Characteristic.RotationDirection.UUID ):  
		case( Characteristic.RotationSpeed.UUID ):  
		case( Characteristic.Saturation.UUID ):  
		case( Characteristic.SecuritySystemAlarmType.UUID ):  
		case( Characteristic.SecuritySystemCurrentState.UUID ):  
		case( Characteristic.SecuritySystemTargetState.UUID ):  
		case( Characteristic.SelectedRTPStreamConfiguration.UUID ):  
		case( Characteristic.SerialNumber.UUID ):  
		case( Characteristic.ServiceLabelIndex.UUID ):  
		case( Characteristic.ServiceLabelNamespace.UUID ):  
		case( Characteristic.SetDuration.UUID ):  
		case( Characteristic.SetupEndpoints.UUID ):  
		case( Characteristic.SlatType.UUID ):  
		case( Characteristic.SmokeDetected.UUID ):  
		case( Characteristic.StatusActive.UUID ):  
		case( Characteristic.StatusFault.UUID ):  
		case( Characteristic.StatusJammed.UUID ):  
		case( Characteristic.StatusLowBattery.UUID ):  
		case( Characteristic.StatusTampered.UUID ):  
		case( Characteristic.StreamingStatus.UUID ):  
		case( Characteristic.SulphurDioxideDensity.UUID ):  
		case( Characteristic.SupportedAudioStreamConfiguration.UUID ):  
		case( Characteristic.SupportedRTPConfiguration.UUID ):  
		case( Characteristic.SupportedVideoStreamConfiguration.UUID ):  
		case( Characteristic.SwingMode.UUID ):  
		case( Characteristic.TargetAirPurifierState.UUID ):  
		case( Characteristic.TargetAirQuality.UUID ):  
		case( Characteristic.TargetDoorState.UUID ):  
		case( Characteristic.TargetFanState.UUID ):  
		case( Characteristic.TargetHeaterCoolerState.UUID ):  
		case( Characteristic.TargetHeatingCoolingState.UUID ):  
		case( Characteristic.TargetHorizontalTiltAngle.UUID ):  
		case( Characteristic.TargetHumidifierDehumidifierState.UUID ):  
		case( Characteristic.TargetPosition.UUID ):  
		case( Characteristic.TargetRelativeHumidity.UUID ):  
		case( Characteristic.TargetSlatState.UUID ):  
		case( Characteristic.TargetTemperature.UUID ):  
		case( Characteristic.TargetTiltAngle.UUID ):  
		case( Characteristic.TargetVerticalTiltAngle.UUID ):  
		case( Characteristic.TemperatureDisplayUnits.UUID ):  
		case( Characteristic.ValveType.UUID ):  
		case( Characteristic.Version.UUID ):  
		case( Characteristic.VOCDensity.UUID ):  
		case( Characteristic.Volume.UUID ):  
		case( Characteristic.WaterLevel.UUID ):  
		{
			return true;
		}
		default:
		{
			return false;
		}

	} // endswitch
} // end isValidUUID
exports.isValidUUID = isValidUUID;


