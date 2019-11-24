'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
//var Characteristic = require("hap-nodejs").Characteristic;
// var Service = require("hap-nodejs").Service;
var promiseHTTP = require("request-promise-native");
var globals = require("../index").globals;

// Function to process data received from HomeSeer
exports.processDataFromHomeSeer = function (characteristicObject, HSReference)
{
	let Characteristic = globals.api.hap.Characteristic;
	let Service = globals.api.hap.Service

/*		
		globals.log("DEBUG - Executing processDataFromHomeSeer(obj, obj, obj, obj, obj, obj)");
		globals.log("   characteristicObject: " + JSON.stringify(characteristicObject));
		globals.log("   HSReference: " + JSON.stringify(HSReference));
		globals.log("   platformConfig: " + platformConfig);
		globals.log("   globals.getHSValue: " + globals.getHSValue);
		globals.log(cyan("*Debug - function processDataFromHomeSeer processing for reference: " + HSReference));
*/
		var newValue = 0;

		switch(true)
		{
			// For the Lock Management service, but this seems to do nothing in ios 11.2.6!

			case(characteristicObject.UUID == Service.Thermostat.UUID):
			{
				//globals.log("DEBUG - Case Service.Thermostat");
				var HSheatingTemp = globals.getHSValue(characteristicObject.config.heatingSetpointRef)
				var HScoolingTemp = globals.getHSValue(characteristicObject.config.coolingSetpointRef)
				var heatingTemp = HSheatingTemp;
				var coolingTemp = HScoolingTemp;
				// If HomeSeer users Fahrenheit, convert back to Celsius
				if (characteristicObject.config.temperatureUnit == "F")
					{ 
						heatingTemp = (HSheatingTemp - 32 )* (5/9);
						coolingTemp = (HScoolingTemp - 32 )* (5/9);
					}

				var mode = characteristicObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).value;
				// globals.log(magenta("Updating Service.Thermostat, Current target Heating / cooling Mode is: " + mode + ", with new heating Temp: " + HSheatingTemp.toFixed(1) +	", new cooling Temp: " + HScoolingTemp.toFixed(1)));

				switch(mode)
				{
					case 0: //Off
					{
						// globals.log(magenta("Thermostat Target mode: off"));

						break;
					}
					case 1: //Heating
					{
						// globals.log(magenta("Thermostat Target mode: Heating"));
						characteristicObject.getCharacteristic(Characteristic.TargetTemperature)
							.updateValue(heatingTemp)						
						break;
					}
					case 2: // Cooling
					{
						// globals.log(magenta("Thermostat Target mode: Cooling"));
					characteristicObject.getCharacteristic(Characteristic.TargetTemperature)
							.updateValue(coolingTemp)	
						break;
					}
					case 3: // Auto
					{
						// globals.log(magenta("Thermostat Target mode: Auto"));
						
						characteristicObject.getCharacteristic(Characteristic.HeatingThresholdTemperature)
							.updateValue(heatingTemp)
						characteristicObject.getCharacteristic(Characteristic.CoolingThresholdTemperature)
							.updateValue(coolingTemp)
						break;
					}
				}
					
				break;
				
			}
			case(characteristicObject.UUID == Characteristic.Active.UUID):
                //globals.log("DEBUG - Case Characteristic.Active");
			case(characteristicObject.UUID == Characteristic.InUse.UUID): // Used for Valves!
			{
                //globals.log("DEBUG - Case Characteristic.InUse");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				if(	characteristicObject.config.closeValve)// if its a valve	
				{
					switch (newValue)
					{
					case characteristicObject.config.closeValve: { characteristicObject.updateValue(0); break; }// 0 = HomeKit Valve Closed
					case characteristicObject.config.openValve: { characteristicObject.updateValue(1); break; } // 1 = HomeKit Valve Open
					};
				} else // its a fan!
				{
						switch (newValue)
					{
					case characteristicObject.config.offValue: { characteristicObject.updateValue(0); break; }// 0 = HomeKit Valve Closed
					case characteristicObject.config.onValue: { characteristicObject.updateValue(1); break; } // 1 = HomeKit Valve Open
					};
				}					
				break;
			}
			case(characteristicObject.UUID == Characteristic.SecuritySystemTargetState.UUID):
                //globals.log("DEBUG - Case Characteristic.SecuritySystemTargetState");
			case(characteristicObject.UUID == Characteristic.SecuritySystemCurrentState.UUID):
			{
                //globals.log("DEBUG - Case Characteristic.SecuritySystemCurrentState");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				// For now, this assumes HomeSeer users same indicator values as HomeKit
				// This may not be a valid assumption and may need to use configuration parameters to vary this.
				switch (true)
				{
				case (characteristicObject.config.armedStayValues.indexOf(newValue) != (-1)): 
					{ characteristicObject.updateValue(0); break; } // 0 = HomeKit Stay Arm
					
				case (characteristicObject.config.armedAwayValues.indexOf(newValue) != (-1)):
					{ characteristicObject.updateValue(1); break; } // 1 = HomeKit Away Arm
					
				case (characteristicObject.config.armedNightValues.indexOf(newValue) != (-1)):
					{ characteristicObject.updateValue(2); break; } // 2 = HomeKit Night Arm
					
				case (characteristicObject.config.disarmedValues.indexOf(newValue) != (-1)):
					{ characteristicObject.updateValue(3); break; } // 3 = HomeKit Disarmed
					
				case (characteristicObject.config.alarmValues.indexOf(newValue) != (-1)): 
					{ 
						// Don't update the 'target' state if its an Alarm!
						if(characteristicObject.UUID != Characteristic.SecuritySystemTargetState.UUID)
							characteristicObject.updateValue(4); // 4 = HomeKit Alarm Triggered
						break; 
					} 
				};
				break;
			}
			
			case(characteristicObject.UUID == Characteristic.StatusTampered.UUID):
			{
                //globals.log("DEBUG - Case Characteristic.StatusTampered");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				characteristicObject.updateValue( (newValue !=0) ? true : false);
				break;
			}			
			case(characteristicObject.UUID == Characteristic.StatusLowBattery.UUID):
			{
                //globals.log("DEBUG - Case Characteristic.StatusLowBattery");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				// that.log("Battery Threshold status of battery level %s with threshold %s", newValue, characteristicObject.batteryThreshold);
				characteristicObject.updateValue((newValue < characteristicObject.config.batteryThreshold) ? true : false);
				break;
			}
			
			// Window Coverings are only partially tested!  Needs more testing with "real" devices.
			case(characteristicObject.UUID == Characteristic.TargetPosition.UUID):
                //globals.log("DEBUG - Case Characteristic.TargetPosition");
			case(characteristicObject.UUID == Characteristic.CurrentPosition.UUID): // For a Window Covering!
			{
                //globals.log("DEBUG - Case Characteristic.CurrentPosition");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				if (	((newValue > 100) && (newValue < 255)) && 
						((newValue != characteristicObject.config.openValue) && (newValue != characteristicObject.config.closedValue))
					)
				{	
					globals.log(red("** Warning - Possible Illegal value for window covering setting: " + newValue));
				}
				
				// If you get a value of 255, then its probably from a binary switch, so set as fully open.
				// Else, its from a percentage-adjustable shade, so set to the percentage.
				if(characteristicObject.config.binarySwitch)
				{
					switch(newValue)
					{
						case (characteristicObject.config.openValue):
							{ characteristicObject.updateValue(100); break;}
						case (characteristicObject.config.closedValue):
							{characteristicObject.updateValue(0); break;}
						default:
						{
							globals.log(magenta(
							"** Warning - Possible Illegal value for window covering setting. " + 
							"Window covering is set as a binary (open/closed) covering but HomeSeer returned value: " + newValue +
							" which is not the openValue or closedValue.  Treating the value as 'closed'"
							));
							characteristicObject.updateValue(0)
							break;
						}
					}
				}
				else
				{
					characteristicObject.updateValue( ( (newValue == 99) ? 100 : newValue) );
				}				
				break;
			}
			
			case(characteristicObject.UUID == Characteristic.CurrentDoorState.UUID): // For a Garage Door Opener
			{
                //globals.log("DEBUG - Case Characteristic.CurrentDoorState");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				// globals.log(magenta("Debug - Setting CurrentDoorState to: " + newValue));
				switch(newValue)
				{
					case(characteristicObject.config.openValue)		:	{	characteristicObject.updateValue(0);	break;	} // Open
					case(characteristicObject.config.closedValue)	:	{	characteristicObject.updateValue(1);	break;	} // Closed
					case(characteristicObject.config.openingValue)	:	{	characteristicObject.updateValue(2);	break;	} // Opening
					case(characteristicObject.config.closingValue)	:	{	characteristicObject.updateValue(3);	break;	} // Closing
					case(characteristicObject.config.stoppedValue)	:	{	characteristicObject.updateValue(4);	break;	} // Stopped
				}
				break;
			}
			case(characteristicObject.UUID == Characteristic.LockCurrentState.UUID): // For a Lock.
			{
                // globals.log("DEBUG - Case Characteristic.LockCurrentState");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				// Set to 0 = UnSecured, 1 - Secured, 2 = Jammed.
				// globals.log("** Debug ** - Attempting LockCurrentState update with received HS value %s", newValue);
				
				switch(true)
				{
					case(newValue == characteristicObject.config.unlockValue):
					case(characteristicObject.config.unlockedStatusValues.includes(newValue) ):	
						{ 
						characteristicObject.updateValue(0);
						// globals.log("Setting HomeKit LockCurrentState to 0 = UnLocked Value");			
						break;	
						} // UnLocked
						
					case(newValue == characteristicObject.config.lockValue):
					case(characteristicObject.config.lockedStatusValues.includes(newValue)):
						{	
						characteristicObject.updateValue(1);	
						// globals.log("Setting HomeKit LockCurrentState to 1 = Locked Value");			
						break;
						} // Locked
					default:	{	characteristicObject.updateValue(2);	break;	} // unknown
				}
				break;
			}
			case (characteristicObject.UUID == Characteristic.TargetDoorState.UUID): // For garage door openers
			{
                //globals.log("DEBUG - Case Characteristic.TargetDoorState");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				// globals.log(magenta("Deug - Setting TargetDoorState to: " + newValue));
				switch(newValue)
				{
					case(characteristicObject.config.closedValue)	:	{	characteristicObject.updateValue(1);	break;	} // Door Closed
					case(characteristicObject.config.openValue)		:	{	characteristicObject.updateValue(0);	break;	} // Door Opened
					default:	{ 	globals.log("ERROR - Unexpected Lock Target State Value of %s for device %s", cyan(newValue), cyan(characteristicObject.HSRef)); break;}
				}
				break;
			}			
			
			case (characteristicObject.UUID == Characteristic.LockTargetState.UUID): // For door locks
			{
                // globals.log(magenta("DEBUG - Case Characteristic.LockTargetState"));
				newValue = globals.getHSValue(characteristicObject.HSRef);
				// globals.log(magenta("Deug - Setting TargetDoorState to: " + newValue));
				switch(newValue)
				{
					case(characteristicObject.config.unlockValue):	
					{	characteristicObject.updateValue(0);	break;	} // Unlocked
					
					
					case(characteristicObject.config.lockValue):	
					{	characteristicObject.updateValue(1);	break;	} // Locked
					
					default:	{ 	globals.log("ERROR - Unexpected Lock Target State Value of %s for device %s", cyan(newValue), cyan(characteristicObject.HSRef)); break;}
				}
				break;
			}
			// The following is for garage door openers and is an attempt to map the Z-Wave "Barrier" class
			// to an obstruction value. For some bizarre reason, some Z-Wave garage door openers use the value
			// of 74 to indicate a low battery in the sensor so if we get that value, ignore it.
			case( characteristicObject.UUID == Characteristic.ObstructionDetected.UUID ):
			{
                //globals.log("DEBUG - Case Characteristic.ObstructionDetected");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				
				if (characteristicObject.config.obstructionClearValues.includes(newValue))
				{
					characteristicObject.updateValue(0);// No Event Value
				}
				else
				{
					characteristicObject.updateValue(1);  // Anything else, consider it obstructed.
				}
				break;
			}
			
			case( characteristicObject.UUID == Characteristic.CarbonDioxideDetected.UUID ):
			case( characteristicObject.UUID == Characteristic.CarbonMonoxideDetected.UUID):
			case( characteristicObject.UUID == Characteristic.ContactSensorState.UUID 	):
			case( characteristicObject.UUID == Characteristic.MotionDetected.UUID 	):
			case( characteristicObject.UUID == Characteristic.LeakDetected.UUID 		):
			case( characteristicObject.UUID == Characteristic.OccupancyDetected.UUID 	):
			case( characteristicObject.UUID == Characteristic.SmokeDetected.UUID 	):
			{
				newValue = globals.getHSValue(characteristicObject.HSRef);

				if (characteristicObject.config.offValues.includes(newValue))
					{ characteristicObject.updateValue(false); }
				else
					{ 	characteristicObject.updateValue(true); }

				break;
			}
			case( characteristicObject.UUID == Characteristic.On.UUID):
			{

                //globals.log("DEBUG - Case Characteristic.On");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				
				// Anything that isn't an 'off' value is treated as being "on".
				// This is important for dimmers where there can be multiple 'on' values.
				// the "onValue" parameter in config.json is used only for the send side to establish
				// an initial level, but can't be relied on as the in-fact 'on' value!
				if(characteristicObject.config.offValue == newValue)
				{
					characteristicObject.updateValue(false)
				}
				else
				{
				characteristicObject.updateValue( true );
				}
				
				break;
			}
			
			// For the following characteristics, no special handling is needed.
			// Simply provide HomeKit with whatever you got from HomeSeer				
			case(characteristicObject.UUID == Characteristic.CurrentAmbientLightLevel.UUID):
			case(characteristicObject.UUID == Characteristic.CurrentRelativeHumidity.UUID):
			case(characteristicObject.UUID == Characteristic.TargetRelativeHumidity.UUID):
			case(characteristicObject.UUID == Characteristic.BatteryLevel.UUID):
			{
				newValue = globals.getHSValue(characteristicObject.HSRef);
				characteristicObject.updateValue(parseFloat(newValue));
				break;
			}
			
			// Handling Percentage values
			// The following characteristics are all exprssed in percentages.
			// Homekit uses 0 - 100 values. However, Z-Wave generally uses 0 - 99.
			// Simply passing the Z-wave value to HomeKit would result in HomeKit never showing 100%
			// even when device is fully on. So force a Z-Wave "99" to appear as 100%.
			case (characteristicObject.UUID == Characteristic.RotationSpeed.UUID):
                //globals.log("DEBUG - Case Characteristic.RotationSpeed");
			case (characteristicObject.UUID == Characteristic.Brightness.UUID):
			{
                //globals.log("DEBUG - Case Characteristic.Brightness");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				// Zwave uses 99 as its maximum, so if its a Z-Wave Device and you get 99 from HomeSeer, make it appear as 100% in Homekit
				if ((characteristicObject.config.model.indexOf("Z-Wave") != (-1)) && (newValue == 99))
				{
				// Maximum ZWave value is 99 so covert 100% to 99!
				newValue = 100;
				}

				characteristicObject.updateValue(newValue);
				break;
			}
			case (characteristicObject.UUID == Characteristic.TargetTemperature.UUID):
                //globals.log("DEBUG - Case Characteristic.TargetTemperature");
			case (characteristicObject.UUID == Characteristic.CurrentTemperature.UUID):
			{
                //globals.log("DEBUG - Case Characteristic.CurrentTemperature");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				// globals.log(cyan("* Debug * - Received temperature value of: " + newValue + " temperatureUnit is: " + characteristicObject.config.temperatureUnit));
	
				// HomeKit uses Celsius, so if HS is using Fahrenheit, convert to Celsius.
				if ((characteristicObject.config.temperatureUnit != null) && (characteristicObject.config.temperatureUnit == "F")) 
					{ 
						newValue = (newValue - 32 )* (5/9);
					}
		// globals.log(cyan("* Debug * - Converted temperature value to: " + newValue));
								
				characteristicObject.updateValue(newValue);
				break;
			}
			case (characteristicObject.UUID == Characteristic.TargetHeatingCoolingState.UUID):
                //globals.log("DEBUG - Case Characteristic.TargetHeatingCoolingState");
			case (characteristicObject.UUID == Characteristic.CurrentHeatingCoolingState.UUID):
			{
                //globals.log("DEBUG - Case Characteristic.CurrentHeatingCoolingstate");
				newValue = globals.getHSValue(characteristicObject.HSRef);
				// By Default, Z-Wave and HomeKit use the same numeric values 0 = Off, 1= Heat, 2=Cooling, 3 = Auto
				// So no conversion of the value should be needed.
				characteristicObject.updateValue(parseInt(newValue));
				break;
			}

			default:
			{
                //globals.log("DEBUG - Case default");
				// newValue = globals.getHSValue(characteristicObject.HSRef);
				globals.log("** WARNING ** -- characteristic %s not handled", characteristicObject.displayName);
				// characteristicObject.updateValue( newValue);
			}
		}; //end switch
		
			globals.log(chalk.blue("Emitting for object named: " + characteristicObject.config.name + " with new value: " + newValue));
			characteristicObject.emit('HSvalueChanged',newValue, characteristicObject);
		
		// Uncomment for debugging
		// globals.log("** Debug ** -   %s value after update is: %s", characteristicObject.displayName, characteristicObject.value);
}


