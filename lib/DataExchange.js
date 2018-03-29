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



exports.sendToHomeSeer = function (level, HomeSeerHost, Characteristic, Service, forceHSValue, getHSValue, instantStatusEnabled, that )
{
		var url;
		var error = null;
		var transmitValue = level;
		var performUpdate = true;
		var transmitRef = that.HSRef;
		
		// Uncomment for Debugging
		// console.log ("** Debug ** - Called sendToHomeSeer with level %s for UUID %s", level, that.displayName);
		
		if (!that.UUID) {
			throw new SyntaxError(red("*ERROR* - sendToHomeSeer called on data that is not a Service or Characteristic"));
		}

			// Add Any Special Handling Based on the UUID
			// Uncomment any UUID's actually used!
				switch( that.UUID)
				{
		
					case(Characteristic.Active.UUID): // Used for Valves!
					{
						switch (level)
						{
						case 0: { transmitValue = that.config.closeValve; break; }// 0 = HomeKit Valve Closed
						case 1: { transmitValue = that.config.openValve; break; } // 1 = HomeKit Valve Open
						};
						// console.log(chalk.cyan.bold("* Debug * Valve open / close values are: " +that.config.openValve + ", " + that.config.closedValue));
						break;
					}
					case(Characteristic.SecuritySystemTargetState.UUID):
					{
						// For now, this assumes HomeSeer users same indicator values as HomeKit
						// This may not be a valid assumption and may need to use configuration parameters to vary this.
						switch (level)
						{
						case 0: { transmitValue = that.config.armStayValue; break; }// 0 = HomeKit Stay Arm
						case 1: { transmitValue = that.config.armAwayValue; break; } // 1 = HomeKit Away Arm
						case 2: { transmitValue = that.config.armNightValue; break; } // 2 = HomeKit Night Arm
						case 3: { transmitValue = that.config.disarmValue; break; } // 3 = HomeKit Disarmed

						};
						break;
					}
					case(Characteristic.TargetRelativeHumidity.UUID):
					{
						transmitValue = level;
						break;
					}
					
					case(Characteristic.RotationSpeed.UUID):
					case(Characteristic.Brightness.UUID ): 
					{
						// If the _HSValues array has a 255 value, it means that this Brightness / Rotation speed change
						// Is being sent as part of an initial dimmable device turn-on pair. 
						// In HomeSeer, it is better not to send this second value until after the last-level feature settles to a new value.
						// So inhibit the transmission but only if you have Instant Status feature enabled. 
						if(instantStatusEnabled && (getHSValue(that.HSRef) == 255))
						{
							performUpdate = false;
						}
						
						if (that.config.uses99Percent) 
						{
						// Maximum ZWave value is 99 so covert 100% to 99!
						transmitValue = (level == 100) ? 99 : level;
						}

						forceHSValue(that.HSRef, transmitValue); 

						// that.updateValue(transmitValue); // Assume success. This gets corrected on next poll if assumption is wrong.
						// console.log ("          ** Debug ** called for Brightness update with level %s then set to transmitValue %s", level, transmitValue); 

						break;
					}

					case(Characteristic.TargetPosition.UUID):
					{
						if (that.config.binarySwitch)
						{
							transmitValue = (level < 50) ? that.config.closedValue : that.config.openValue; // Turn to "on"
							forceHSValue(that.HSRef, transmitValue); 
						} 
						else
						{ 
							transmitValue = ((level == 100) ? 99 : level);
							forceHSValue(that.HSRef, transmitValue); 							
						 } 
							
						// console.log("Set TransmitValue for WindowCovering %s to %s ", that.displayName, transmitValue);
						break;
					}	
					

					case(Characteristic.TargetDoorState.UUID):
					{
						switch(level)
						{
							case 0: {transmitValue =  255; break;} // Door Open
							case 1: {transmitValue =  0; break; } // Door Closed
						}
						// setHSValue(that.HSRef, transmitValue); ** Don't assume success for the lock. Wait for a poll!
						console.log("Set TransmitValue for lock characteristic %s to %s ", that.displayName, transmitValue);
						break;
					}
					case (Service.Thermostat.UUID):
					{
						console.log(chalk.cyan.bold("* Service.Thermostat Update Currently does nothing!"));
						// var state = that.getCharacteristic(Characteristic.CurrentHeatingCoolingState).value;
						switch(that.mode)
						{
							case (0): // Case 0 or 3, don't update based on the Service. Instead, there's a characteristic-based update
							case (3):
								{
									performUpdate = false; 
									break
								} // Off
							case (1): 
								{// heating
									transmitValue = level;
									if (that.config.temperatureUnit == "F")
									{
										transmitValue = Math.round((level * (9/5)) + 32);
									}						
									transmitRef = that.config.heatingSetpointRef;
									break;
								}
							case (2): // cooling
								{
									transmitValue = level;
									if (that.config.temperatureUnit == "F")
									{
										transmitValue = Math.round((level * (9/5)) + 32);
									}						
									transmitRef = that.config.heatingSetpointRef;
									break;
								}
							case (3): // Auto
							default: {performUpdate = false; break}
						}

						break;
					}			
					case(Characteristic.HeatingThresholdTemperature.UUID):
					{
						// console.log(chalk.magenta.bold("**Debug** - case HeatingThresholdTemperature, configuration: " + that.config));

						transmitValue = level;
						if (that.config.temperatureUnit == "F")
						{
							transmitValue = Math.round((level * (9/5)) + 32);
						}
						transmitRef = that.config.heatingSetpointRef;
						

						break;
					}					
					case(Characteristic.CoolingThresholdTemperature.UUID):
					{
						// console.log(chalk.magenta.bold("**Debug** - case CoolingThresholdTemperature, configuration: " + that.config));

						transmitValue = level;
						if (that.config.temperatureUnit == "F")
						{
							transmitValue = Math.round((level * (9/5)) + 32);
						}
						transmitRef = that.config.coolingSetpointRef;
						
						// console.log(chalk.magenta.bold("**Debug** - Dummy Target Temperature Function Level is: " +level + " transmitted as: " + transmitValue + " temperatureUnit is: " + that.config.temperatureUnit));

						break;
					}
					//TargetTemperature update is now handled in the device setup block!
/* 
					case(Characteristic.TargetTemperature.UUID):
					{
						transmitValue = level;
						if (that.config.temperatureUnit == "F")
						{
							transmitValue = Math.round((level * (9/5)) + 32);
						}

						switch(that.getCharacteristic(Characteristic.CurrentHeatingCoolingState).value)
						{
							case 0: performUpdate = false;
							case 1: transmitRef = that.config.heatingSetpoint;
							case 2: transmitRef = that.config.coolingSetpoint;
							case 3: throw new SyntaxError ("Target Temp being set in Auto mode is odd!");
						}
						
						console.log(chalk.magenta.bold("**Debug** - Fix so that Target Temp is mode dependent"));

						break;
					}
*/
					case(Characteristic.LockTargetState.UUID ):
					{
						switch(level)
						{
							case 0: {transmitValue =  0;   break;} // Lock Unsecured
							case 1: {transmitValue =  255; break; } // Lock Secured
						}
						// setHSValue(that.HSRef, transmitValue); ** Don't assume success for the lock. Wait for a poll!
						console.log("Set TransmitValue for lock characteristic %s to %s ", that.displayName, transmitValue);
						break;
					}
					
	
					case(Characteristic.On.UUID ):  
					{
						// For devices such as dimmers, HomeKit sends both "on" and "brightness" when you adjust brightness.
						// But Z-Wave only expects a brightness value if light is already on. So, if the device is already on (non-Zero ZWave value)
						// then don't send again.
						// HomeKit level == false means turn off, level == true means turn on.
						
						if (level == false) 
							{
								transmitValue = 0 ;
								forceHSValue(that.HSRef, 0); // assume success and set to 0 to avoid jumping of any associated dimmer / range slider.
						}
						else // turn on!
						{
							if(getHSValue(that.HSRef) == 0)	// if it is currently off, then turn fully on.
							{
								// if it is off, turn on to full level.
								transmitValue = (that.config.onValue != null) ? that.config.onValue : 255;
								forceHSValue(that.HSRef, 255);
							}
							else // If it appears to be on, then send same value!
							{
								// if it is on then use current value.
								// don't use the "255" value because Z-Wave dimmer's can be ramping up/down 
								// and use of set-last-value (255)  will cause jumping of the HomeKit Dimmer slider interface
								// if a poll occurs during ramping.
								transmitValue = getHSValue(that.HSRef); // if it is already on, then just transmit its current value
								performUpdate = false; // or maybe don't transmit at all (testing this feature)
							}
						}
						break; // 
					}

					default:
					{
						console.log (chalk.bold.red("*** PROGRAMMING ERROR **** - Service or Characteristic UUID not handled by setHSValue routine for: "
						+ that.displayName
						));
						
						error = "*** PROGRAMMING ERROR **** - Service or Characteristic UUID not handled by sendToHomeSeer routine" 
										+ that.UUID + "  named  " + that.displayName;
						throw new SyntaxError(error);
						return;
						break;
					}
				}
		
		if (isNaN(transmitValue)) 
			{
			throw new TypeError("Programming Error in function exports.sendToHomeSeer. Attempt to send value '" + transmitValue +"' to HomeSeer that is not a number");

			};
	
		 url = HomeSeerHost + "/JSON?request=controldevicebyvalue&ref=" + transmitRef + "&value=" + transmitValue;
 
		 // For debugging
		 //console.log ("Debug - Called setHSValue has URL = %s", url);
 
		 // console.log("Sending URL %s", url);

		if (performUpdate)
		 {
			 that.log("Transmitting to HomeSeer device: " + cyan(transmitRef) +", a new value: " + cyan(transmitValue));

			 promiseHTTP(url)
				.then( function(htmlString) {
						// console.log(that.displayName + ': HomeSeer setHSValue function succeeded!');
						// callback(null);
						// updateCharacteristic(this);// poll for this one changed Characteristic after setting its value.
									
				}.bind(this))
				.catch(function(err)
					{ 	
					console.log(chalk.bold.red("Error attempting to update %s, with error %s", that.displayName, that.UUID, err));
					}.bind(this)
				);
		 } 			
	 
}

// Function to process data received from HomeSeer
exports.processDataFromHomeSeer = function (characteristicObject, HSReference, that, Characteristic, Service, getHSValue)
{
		// The following "if" is a quick check to see if any change is needed.
		// if the HomeKit object value already matches what was received in the poll, then return and skip
		// processing the rest of this function code!
		// if ((pollingCount != 0) && (characteristicObject.value == newValue)) return; 
		
		// console.log(chalk.cyan.bold("*Debug - function processDataFromHomeSeer processing for reference: " + HSReference));
		var newValue = 0;

		switch(true)
		{
			// For the Lock Management service, but this seems to do nothing in ios 11.2.6!

			case(characteristicObject.UUID == Service.Thermostat.UUID):
			{
				var HSheatingTemp = getHSValue(characteristicObject.config.heatingSetpointRef)
				var HScoolingTemp = getHSValue(characteristicObject.config.coolingSetpointRef)
				var heatingTemp = HSheatingTemp;
				var coolingTemp = HScoolingTemp;
				// If HomeSeer users Fahrenheit, convert back to Celsius
				if (characteristicObject.config.temperatureUnit == "F")
					{ 
						heatingTemp = (HSheatingTemp - 32 )* (5/9);
						coolingTemp = (HScoolingTemp - 32 )* (5/9);
					}

				var mode = characteristicObject.getCharacteristic(Characteristic.TargetHeatingCoolingState).value;
				// console.log(chalk.magenta.bold("Updating Service.Thermostat, Current target Heating / cooling Mode is: " + mode + ", with new heating Temp: " + HSheatingTemp.toFixed(1) +	", new cooling Temp: " + HScoolingTemp.toFixed(1)));

				switch(mode)
				{
					case 0: //Off
					{
						// console.log(chalk.magenta.bold("Thermostat Target mode: off"));

						break;
					}
					case 1: //Heating
					{
						// console.log(chalk.magenta.bold("Thermostat Target mode: Heating"));
						characteristicObject.getCharacteristic(Characteristic.TargetTemperature)
							.updateValue(heatingTemp)						
						break;
					}
					case 2: // Cooling
					{
						// console.log(chalk.magenta.bold("Thermostat Target mode: Cooling"));
					characteristicObject.getCharacteristic(Characteristic.TargetTemperature)
							.updateValue(coolingTemp)	
						break;
					}
					case 3: // Auto
					{
						// console.log(chalk.magenta.bold("Thermostat Target mode: Auto"));
						
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
			case(characteristicObject.UUID == Characteristic.InUse.UUID): // Used for Valves!
			{
				newValue = getHSValue(characteristicObject.HSRef);
				switch (newValue)
				{
				case characteristicObject.config.closeValve: { characteristicObject.updateValue(0); break; }// 0 = HomeKit Valve Closed
				case characteristicObject.config.openValve: { characteristicObject.updateValue(1); break; } // 1 = HomeKit Valve Open
				};
				break;
			}
			case(characteristicObject.UUID == Characteristic.SecuritySystemTargetState.UUID):
			case(characteristicObject.UUID == Characteristic.SecuritySystemCurrentState.UUID):
			{
				newValue = getHSValue(characteristicObject.HSRef);
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
		
			case(characteristicObject.UUID == Characteristic.StatusLowBattery.UUID):
			{
				newValue = getHSValue(characteristicObject.HSRef);
				// that.log("Battery Threshold status of battery level %s with threshold %s", newValue, characteristicObject.batteryThreshold);
				characteristicObject.updateValue((newValue < characteristicObject.config.batteryThreshold) ? true : false);
				break;
			}
			
			// Window Coverings are only partially tested!  Needs more testing with "real" devices.
			case(characteristicObject.UUID == Characteristic.TargetPosition.UUID): 
			case(characteristicObject.UUID == Characteristic.CurrentPosition.UUID): // For a Window Covering!
			{
				newValue = getHSValue(characteristicObject.HSRef);
				if ((newValue > 100) && (newValue < 255))
				{	
					console.log(chalk.bold.red("** Warning - Possible Illegal value for window covering setting"));
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
							console.log(chalk.magenta.red(
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
				newValue = getHSValue(characteristicObject.HSRef);
				// console.log(chalk.magenta.bold("Debug - Setting CurrentDoorState to: " + newValue));
				switch(newValue)
				{
					case(255):	{	characteristicObject.updateValue(0);	break;	} // Open
					case(0):	{	characteristicObject.updateValue(1);	break;	} // Closed
					case(254):	{	characteristicObject.updateValue(2);	break;	} // Opening
					case(252):	{	characteristicObject.updateValue(3);	break;	} // Closing
					case(253):	{	characteristicObject.updateValue(4);	break;	} // Stopped
				}
				break;
			}
			case(characteristicObject.UUID == Characteristic.LockCurrentState.UUID): // For a Lock.
			{
				newValue = getHSValue(characteristicObject.HSRef);
				// Set to 0 = UnSecured, 1 - Secured, 2 = Jammed.
				// console.log("** Debug ** - Attempting LockCurrentState update with received HS value %s", newValue);
				
				switch(newValue)
				{
					case(0):	{	characteristicObject.updateValue(0);	break;	} // Locked
					case(255):	{	characteristicObject.updateValue(1);	break;	} // unlocked
					default:	{	characteristicObject.updateValue(2);	break;	} // unknown
				}
				break;
			}
			case (characteristicObject.UUID == Characteristic.TargetDoorState.UUID): // For garage door openers
			{
				newValue = getHSValue(characteristicObject.HSRef);
				// console.log(chalk.magenta.bold("Deug - Setting TargetDoorState to: " + newValue));
				switch(newValue)
				{
					case(0):	{	characteristicObject.updateValue(1);	break;	} // Door Closed
					case(255):	{	characteristicObject.updateValue(0);	break;	} // 255=Door Opened
					default:	{ 	console.log("ERROR - Unexpected Lock Target State Value %s", newValue); break;}
				}
				break;
			}			
			
			case (characteristicObject.UUID == Characteristic.LockTargetState.UUID): // For door locks
			{
				newValue = getHSValue(characteristicObject.HSRef);
				// console.log(chalk.magenta.bold("Deug - Setting TargetDoorState to: " + newValue));
				switch(newValue)
				{
					case(0):	{	characteristicObject.updateValue(0);	break;	} // Lock Unlocked
					case(255):	{	characteristicObject.updateValue(1);	break;	} // Lock Locked
					default:	{ 	console.log("ERROR - Unexpected Lock Target State Value %s", newValue); break;}
				}
				break;
			}
			// The following is for garage door openers and is an attempt to map the Z-Wave "Barrier" class
			// to an obstruction value. For some bizarre reason, some Z-Wave garage door openers use the value
			// of 74 to indicate a low battery in the sensor so if we get that value, ignore it.
			case( characteristicObject.UUID == Characteristic.ObstructionDetected.UUID ):
			{
				newValue = getHSValue(characteristicObject.HSRef);
				switch(newValue)
				{
					case(74): return; // The data was for a battery value update. Ignore it
					case(0):{	characteristicObject.updateValue(0);	break;	} // No Event Value
					default: {	characteristicObject.updateValue(1);	break;	} // Anything else, consider it obstructed.
					
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
			case( characteristicObject.UUID == Characteristic.On.UUID):
			{
				newValue = getHSValue(characteristicObject.HSRef);
				characteristicObject.updateValue( ((newValue) ? true: false) );
				break;
			}
			
			// For the following characteristics, no special handling is needed.
			// Simply provide HomeKit with whatever you got from HomeSeer				
			case(characteristicObject.UUID == Characteristic.CurrentAmbientLightLevel.UUID):
			case(characteristicObject.UUID == Characteristic.CurrentRelativeHumidity.UUID):
			case(characteristicObject.UUID == Characteristic.TargetRelativeHumidity.UUID):
			case(characteristicObject.UUID == Characteristic.BatteryLevel.UUID):
			{
				newValue = getHSValue(characteristicObject.HSRef);
				characteristicObject.updateValue(parseFloat(newValue));
				break;
			}
			
			// Handling Percentage values
			// The following characteristics are all exprssed in percentages.
			// Homekit uses 0 - 100 values. However, Z-Wave generally uses 0 - 99.
			// Simply passing the Z-wave value to HomeKit would result in HomeKit never showing 100%
			// even when device is fully on. So force a Z-Wave "99" to appear as 100%.
			case (characteristicObject.UUID == Characteristic.RotationSpeed.UUID):
			case (characteristicObject.UUID == Characteristic.Brightness.UUID):
			{
				newValue = getHSValue(characteristicObject.HSRef);
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
			case (characteristicObject.UUID == Characteristic.CurrentTemperature.UUID):
			{
				newValue = getHSValue(characteristicObject.HSRef);
				// console.log(chalk.cyan.bold("* Debug * - Received temperature value of: " + newValue + " temperatureUnit is: " + characteristicObject.config.temperatureUnit));
	
				// HomeKit uses Celsius, so if HS is using Fahrenheit, convert to Celsius.
				if ((characteristicObject.config.temperatureUnit != null) && (characteristicObject.config.temperatureUnit == "F")) 
					{ 
						newValue = (newValue - 32 )* (5/9);
					}
		// console.log(chalk.cyan.bold("* Debug * - Converted temperature value to: " + newValue));
								
				characteristicObject.updateValue(newValue);
				break;
			}
			case (characteristicObject.UUID == Characteristic.TargetHeatingCoolingState.UUID):
			case (characteristicObject.UUID == Characteristic.CurrentHeatingCoolingState.UUID):
			{
				newValue = getHSValue(characteristicObject.HSRef);
				// By Default, Z-Wave and HomeKit use the same numeric values 0 = Off, 1= Heat, 2=Cooling, 3 = Auto
				// So no conversion of the value should be needed.
				characteristicObject.updateValue(parseInt(newValue));
				break;
			}

			default:
			{
				// newValue = getHSValue(characteristicObject.HSRef);
				console.log("** WARNING ** -- characteristic %s not handled", characteristicObject.displayName);
				// characteristicObject.updateValue( newValue);
			}
		}; //end switch
		
		// Uncomment for debugging
		// console.log("** Debug ** -   %s value after update is: %s", characteristicObject.displayName, characteristicObject.value);
}


