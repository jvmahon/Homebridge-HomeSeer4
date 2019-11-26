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
exports.processDataFromHomeSeer = function (homekitObject, HSReference)
{
	return;
	let Characteristic = globals.api.hap.Characteristic;
	let Service = globals.api.hap.Service

/*		
		globals.log("DEBUG - Executing processDataFromHomeSeer(obj, obj, obj, obj, obj, obj)");
		globals.log("   homekitObject: " + JSON.stringify(homekitObject));
		globals.log("   HSReference: " + JSON.stringify(HSReference));
		globals.log("   platformConfig: " + platformConfig);
		globals.log("   globals.getHSValue: " + globals.getHSValue);
		globals.log(cyan("*Debug - function processDataFromHomeSeer processing for reference: " + HSReference));
*/
		var newValue = 0;

		switch(true)
		{
			// For the Lock Management service, but this seems to do nothing in ios 11.2.6!

			case(homekitObject.UUID == Service.Thermostat.UUID):
			{
				//globals.log("DEBUG - Case Service.Thermostat");
				var HSheatingTemp = globals.getHSValue(homekitObject.config.heatingSetpointRef)
				var HScoolingTemp = globals.getHSValue(homekitObject.config.coolingSetpointRef)
				var heatingTemp = HSheatingTemp;
				var coolingTemp = HScoolingTemp;
				// If HomeSeer users Fahrenheit, convert back to Celsius
				if (homekitObject.config.temperatureUnit == "F")
					{ 
						heatingTemp = (HSheatingTemp - 32 )* (5/9);
						coolingTemp = (HScoolingTemp - 32 )* (5/9);
					}

				var mode = homekitObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).value;
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
						homekitObject.getCharacteristic(Characteristic.TargetTemperature)
							.updateValue(heatingTemp)						
						break;
					}
					case 2: // Cooling
					{
						// globals.log(magenta("Thermostat Target mode: Cooling"));
					homekitObject.getCharacteristic(Characteristic.TargetTemperature)
							.updateValue(coolingTemp)	
						break;
					}
					case 3: // Auto
					{
						// globals.log(magenta("Thermostat Target mode: Auto"));
						
						homekitObject.getCharacteristic(Characteristic.HeatingThresholdTemperature)
							.updateValue(heatingTemp)
						homekitObject.getCharacteristic(Characteristic.CoolingThresholdTemperature)
							.updateValue(coolingTemp)
						break;
					}
				}
					
				break;
				
			}
			case(homekitObject.UUID == Characteristic.Active.UUID):
                //globals.log("DEBUG - Case Characteristic.Active");
			case(homekitObject.UUID == Characteristic.InUse.UUID): // Used for Valves!
			{
                //globals.log("DEBUG - Case Characteristic.InUse");
				newValue = globals.getHSValue(homekitObject.HSRef);
				if(	homekitObject.config.closeValve)// if its a valve	
				{
					switch (newValue)
					{
					case homekitObject.config.closeValve: { homekitObject.updateValue(0); break; }// 0 = HomeKit Valve Closed
					case homekitObject.config.openValve: { homekitObject.updateValue(1); break; } // 1 = HomeKit Valve Open
					};
				} else // its a fan!
				{
						switch (newValue)
					{
					case homekitObject.config.offValue: { homekitObject.updateValue(0); break; }// 0 = HomeKit Valve Closed
					case homekitObject.config.onValue: { homekitObject.updateValue(1); break; } // 1 = HomeKit Valve Open
					};
				}					
				break;
			}
			case(homekitObject.UUID == Characteristic.SecuritySystemTargetState.UUID):
                //globals.log("DEBUG - Case Characteristic.SecuritySystemTargetState");
			case(homekitObject.UUID == Characteristic.SecuritySystemCurrentState.UUID):
			{
                //globals.log("DEBUG - Case Characteristic.SecuritySystemCurrentState");
				newValue = globals.getHSValue(homekitObject.HSRef);
				// For now, this assumes HomeSeer users same indicator values as HomeKit
				// This may not be a valid assumption and may need to use configuration parameters to vary this.
				switch (true)
				{
				case (homekitObject.config.armedStayValues.indexOf(newValue) != (-1)): 
					{ homekitObject.updateValue(0); break; } // 0 = HomeKit Stay Arm
					
				case (homekitObject.config.armedAwayValues.indexOf(newValue) != (-1)):
					{ homekitObject.updateValue(1); break; } // 1 = HomeKit Away Arm
					
				case (homekitObject.config.armedNightValues.indexOf(newValue) != (-1)):
					{ homekitObject.updateValue(2); break; } // 2 = HomeKit Night Arm
					
				case (homekitObject.config.disarmedValues.indexOf(newValue) != (-1)):
					{ homekitObject.updateValue(3); break; } // 3 = HomeKit Disarmed
					
				case (homekitObject.config.alarmValues.indexOf(newValue) != (-1)): 
					{ 
						// Don't update the 'target' state if its an Alarm!
						if(homekitObject.UUID != Characteristic.SecuritySystemTargetState.UUID)
							homekitObject.updateValue(4); // 4 = HomeKit Alarm Triggered
						break; 
					} 
				};
				break;
			}
			

			
			// Window Coverings are only partially tested!  Needs more testing with "real" devices.
			case(homekitObject.UUID == Characteristic.TargetPosition.UUID):
                //globals.log("DEBUG - Case Characteristic.TargetPosition");
			case(homekitObject.UUID == Characteristic.CurrentPosition.UUID): // For a Window Covering!
			{
                //globals.log("DEBUG - Case Characteristic.CurrentPosition");
				newValue = globals.getHSValue(homekitObject.HSRef);
				if (	((newValue > 100) && (newValue < 255)) && 
						((newValue != homekitObject.config.openValue) && (newValue != homekitObject.config.closedValue))
					)
				{	
					globals.log(red("** Warning - Possible Illegal value for window covering setting: " + newValue));
				}
				
				// If you get a value of 255, then its probably from a binary switch, so set as fully open.
				// Else, its from a percentage-adjustable shade, so set to the percentage.
				if(homekitObject.config.binarySwitch)
				{
					switch(newValue)
					{
						case (homekitObject.config.openValue):
							{ homekitObject.updateValue(100); break;}
						case (homekitObject.config.closedValue):
							{homekitObject.updateValue(0); break;}
						default:
						{
							globals.log(magenta(
							"** Warning - Possible Illegal value for window covering setting. " + 
							"Window covering is set as a binary (open/closed) covering but HomeSeer returned value: " + newValue +
							" which is not the openValue or closedValue.  Treating the value as 'closed'"
							));
							homekitObject.updateValue(0)
							break;
						}
					}
				}
				else
				{
					homekitObject.updateValue( ( (newValue == 99) ? 100 : newValue) );
				}				
				break;
			}
			
			case(homekitObject.UUID == Characteristic.CurrentDoorState.UUID): // For a Garage Door Opener
			{
                //globals.log("DEBUG - Case Characteristic.CurrentDoorState");
				newValue = globals.getHSValue(homekitObject.HSRef);
				// globals.log(magenta("Debug - Setting CurrentDoorState to: " + newValue));
				switch(newValue)
				{
					case(homekitObject.config.openValue)		:	{	homekitObject.updateValue(0);	break;	} // Open
					case(homekitObject.config.closedValue)	:	{	homekitObject.updateValue(1);	break;	} // Closed
					case(homekitObject.config.openingValue)	:	{	homekitObject.updateValue(2);	break;	} // Opening
					case(homekitObject.config.closingValue)	:	{	homekitObject.updateValue(3);	break;	} // Closing
					case(homekitObject.config.stoppedValue)	:	{	homekitObject.updateValue(4);	break;	} // Stopped
				}
				break;
			}
			case(homekitObject.UUID == Characteristic.LockCurrentState.UUID): // For a Lock.
			{
                // globals.log("DEBUG - Case Characteristic.LockCurrentState");
				newValue = globals.getHSValue(homekitObject.HSRef);
				// Set to 0 = UnSecured, 1 - Secured, 2 = Jammed.
				// globals.log("** Debug ** - Attempting LockCurrentState update with received HS value %s", newValue);
				
				switch(true)
				{
					case(newValue == homekitObject.config.unlockValue):
					case(homekitObject.config.unlockedStatusValues.includes(newValue) ):	
						{ 
						homekitObject.updateValue(0);
						// globals.log("Setting HomeKit LockCurrentState to 0 = UnLocked Value");			
						break;	
						} // UnLocked
						
					case(newValue == homekitObject.config.lockValue):
					case(homekitObject.config.lockedStatusValues.includes(newValue)):
						{	
						homekitObject.updateValue(1);	
						// globals.log("Setting HomeKit LockCurrentState to 1 = Locked Value");			
						break;
						} // Locked
					default:	{	homekitObject.updateValue(2);	break;	} // unknown
				}
				break;
			}
			case (homekitObject.UUID == Characteristic.TargetDoorState.UUID): // For garage door openers
			{
                //globals.log("DEBUG - Case Characteristic.TargetDoorState");
				newValue = globals.getHSValue(homekitObject.HSRef);
				// globals.log(magenta("Deug - Setting TargetDoorState to: " + newValue));
				switch(newValue)
				{
					case(homekitObject.config.closedValue)	:	{	homekitObject.updateValue(1);	break;	} // Door Closed
					case(homekitObject.config.openValue)		:	{	homekitObject.updateValue(0);	break;	} // Door Opened
					default:	{ 	globals.log("ERROR - Unexpected Lock Target State Value of %s for device %s", cyan(newValue), cyan(homekitObject.HSRef)); break;}
				}
				break;
			}			
			
			case (homekitObject.UUID == Characteristic.LockTargetState.UUID): // For door locks
			{
                // globals.log(magenta("DEBUG - Case Characteristic.LockTargetState"));
				newValue = globals.getHSValue(homekitObject.HSRef);
				// globals.log(magenta("Deug - Setting TargetDoorState to: " + newValue));
				switch(newValue)
				{
					case(homekitObject.config.unlockValue):	
					{	homekitObject.updateValue(0);	break;	} // Unlocked
					
					
					case(homekitObject.config.lockValue):	
					{	homekitObject.updateValue(1);	break;	} // Locked
					
					default:	{ 	globals.log("ERROR - Unexpected Lock Target State Value of %s for device %s", cyan(newValue), cyan(homekitObject.HSRef)); break;}
				}
				break;
			}
			// The following is for garage door openers and is an attempt to map the Z-Wave "Barrier" class
			// to an obstruction value. For some bizarre reason, some Z-Wave garage door openers use the value
			// of 74 to indicate a low battery in the sensor so if we get that value, ignore it.
			case( homekitObject.UUID == Characteristic.ObstructionDetected.UUID ):
			{
                //globals.log("DEBUG - Case Characteristic.ObstructionDetected");
				newValue = globals.getHSValue(homekitObject.HSRef);
				
				if (homekitObject.config.obstructionClearValues.includes(newValue))
				{
					homekitObject.updateValue(0);// No Event Value
				}
				else
				{
					homekitObject.updateValue(1);  // Anything else, consider it obstructed.
				}
				break;
			}


			case (homekitObject.UUID == Characteristic.TargetTemperature.UUID):
                //globals.log("DEBUG - Case Characteristic.TargetTemperature");
			// case (homekitObject.UUID == Characteristic.CurrentTemperature.UUID):
			{
                //globals.log("DEBUG - Case Characteristic.CurrentTemperature");
				newValue = globals.getHSValue(homekitObject.HSRef);
				// globals.log(cyan("* Debug * - Received temperature value of: " + newValue + " temperatureUnit is: " + homekitObject.config.temperatureUnit));
	
				// HomeKit uses Celsius, so if HS is using Fahrenheit, convert to Celsius.
				if ((homekitObject.config.temperatureUnit != null) && (homekitObject.config.temperatureUnit == "F")) 
					{ 
						newValue = (newValue - 32 )* (5/9);
					}
		// globals.log(cyan("* Debug * - Converted temperature value to: " + newValue));
								
				homekitObject.updateValue(newValue);
				break;
			}
			case (homekitObject.UUID == Characteristic.TargetHeatingCoolingState.UUID):
                //globals.log("DEBUG - Case Characteristic.TargetHeatingCoolingState");
			case (homekitObject.UUID == Characteristic.CurrentHeatingCoolingState.UUID):
			{
                //globals.log("DEBUG - Case Characteristic.CurrentHeatingCoolingstate");
				newValue = globals.getHSValue(homekitObject.HSRef);
				// By Default, Z-Wave and HomeKit use the same numeric values 0 = Off, 1= Heat, 2=Cooling, 3 = Auto
				// So no conversion of the value should be needed.
				homekitObject.updateValue(parseInt(newValue));
				break;
			}

			default:
			{
                //globals.log("DEBUG - Case default");
				// newValue = globals.getHSValue(homekitObject.HSRef);
				globals.log("** WARNING ** -- HomeKit ObjectType was not handled", JSON.stringify(homekitObject));
				// homekitObject.updateValue( newValue);
			}

		}; //end switch
		
		globals.log(chalk.blue("Emitting for object with new value: " + newValue));
		charaacteristicObject.emit('HSvalueChanged',newValue, homekitObject);
					
		// Uncomment for debugging
		// globals.log("** Debug ** -   %s value after update is: %s", homekitObject.displayName, homekitObject.value);
}


