'use strict'
var exports = module.exports;

var HSutilities = require("../lib/HomeSeerUtilities");
var globals = require("../index").globals;
var HomeSeerData = require("../index.js").HomeSeer;

function isZwaveLock(reference) {
		var StatusInfo = HomeSeerData.getStatusData(reference)
		
		if ((StatusInfo === null) || (StatusInfo === undefined) ) {
				throw new SyntaxError(red("You specified a Lock using HomeSeer reference: '" + reference + "' which is not a valid HomeSeer reference. Check your config.json file and fix!"))
		} else if (StatusInfo.interface_name != "Z-Wave") {
			return false
		}

		if (StatusInfo.device_type_string == "Z-Wave Door Lock") {
			return true;
		} else if (	(StatusInfo.device_type.Device_API 		== 4) 
					&& 	(StatusInfo.device_type.Device_Type 	== 0) 
					&& 	(StatusInfo.device_type.Device_SubType 	== 98)
					) {
						return true
		} else {
			return false
		}
}

exports.setupLocksDoorsWindows = function (that, services) {
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, that.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + that.config.type + " ref " + that.ref);
		
	switch (that.config.type)  {
		case "GarageDoorOpener": 
			var thisService = new Service.GarageDoorOpener()
				.updateUsingHSReference(that.config.ref);
			
			// IF user-specified, choose that first!

			thisService.control = [];
			var targetDoorState = thisService.getCharacteristic(Characteristic.TargetDoorState);
			targetDoorState.setConfigValues(that.config)
			
			var currentDoorState = thisService.getCharacteristic(Characteristic.CurrentDoorState)
			currentDoorState.setConfigValues(that.config);

				switch (that.config.interface_name) {
					case ("Z-Wave"):
						that.config.openValue		=	255 // Open
						that.config.closedValue		=	0 	// Closed
						that.config.openingValue	=	254 // Opening
						that.config.closingValue	=	252 // Closing
						that.config.stoppedValue	=	253 // Stopped
						break;
					case ("LiftMaster MyQ"):
						that.config.openValue		=	1 // Open
						that.config.closedValue		=	2 	// Closed
						that.config.openingValue	=	4 // Opening
						that.config.closingValue	=	5 // Closing
						that.config.stoppedValue	=	3 // Stopped						
						break;
					case ("MyQ"):
						that.config.openValue		=	1 // Open
						that.config.closedValue		=	3 	// Closed
						that.config.openingValue	=	undefined  // Opening
						that.config.closingValue	=	undefined  // Closing
						that.config.stoppedValue	=	undefined  // Stopped						
						break;
					case ("HSMyQ"):
						that.config.openValue		=	3 // Open
						that.config.closedValue		=	1 	// Closed
						that.config.openingValue	=	4  // Opening
						that.config.closingValue	=	2  // Closing
						that.config.stoppedValue	=	5  // Stopped						
						break;
					default:
						that.config.closedValue ??= HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.DoorLock);
							
						that.config.openValue ??= HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.DoorUnLock);
						
						if ((that.config.closedValue === undefined) || (that.config.openValue === undefined) ) {
							globals.log(red("*Warning* - openValue, closeValue, openingValue, closingValue, or stoppedValue not defined in config.json for GarageDoorOpener with reference: " + that.config.ref));
							globals.log(red("For proper configuration, Consult Wiki entry at: " + "https://github.com/jvmahon/Homebridge-HomeSeer4/wiki/Garage-Door-Openers"));
							throw new SyntaxError(red("Undefined garage door control values"));
						}
				}
				
			thisService	
				.on('HSvalueChanged', (newHSValue) => {
						switch(true){
							case(currentDoorState.config.openValue === newHSValue)	:	// Open
									targetDoorState.updateValue(0);	
									currentDoorState.updateValue(0);	
									break;	
							case(currentDoorState.config.closedValue === newHSValue)	:	// Closed
									targetDoorState.updateValue(1);
									currentDoorState.updateValue(1);	
									break;	
							case(currentDoorState.config.openingValue === newHSValue)	:	// Opening
									targetDoorState.updateValue(0);	
									currentDoorState.updateValue(2);	
									break;	
							case(currentDoorState.config.closingValue === newHSValue)	:	// Closing
									targetDoorState.updateValue(1);	
									currentDoorState.updateValue(3);	
									break;	
							case(currentDoorState.config.stoppedValue === newHSValue)	:	// Stopped
									currentDoorState.updateValue(4);	
									break;	
							default:
								globals.log(red("*Debug* - Received unexpected GarageDoorOpener value of: " + newHSValue ));
								// throw new RangeError(red("Error in GarageDoorOpener type - HSvalueChanged value out of range! Value is: " + newHSValue));
						}
					});

			targetDoorState
				.on('set', (value, callback) =>{
						switch(value){
							case 0:  // Command to HomeSeer to Open Door
									HomeSeerData.sendDataValue(that.config.ref, targetDoorState.config.openValue); 
									break;
							case 1:  // Command to HomeSeer to Close Door
									HomeSeerData.sendDataValue(that.config.ref, targetDoorState.config.closedValue); 
									break; 
						}
						callback(null);
					} );					

			if(that.config.obstructionRef){
			thisService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
                .setConfigValues(that.config)
					.on('HSvalueChanged', (newHSValue) => {
						if (that.config.obstructionClearValues.indexOf(newHSValue) == -1) {	// obstruction detected
							thisService.getCharacteristic(Characteristic.ObstructionDetected).updateValue(true);
						} else {	// not obstructed
							thisService.getCharacteristic(Characteristic.ObstructionDetected).updateValue(false);
						}
					});
			}
			services.push(informationService);
			services.push(thisService);
			break;
		case "BinaryWindowCovering": 
		case "BinaryWindow": 
		{
			switch(that.config.type) {
				case "BinaryWindowCovering":
					var thisService = new Service.WindowCovering()
					break;
				case "BinaryWindow":
					var thisService = new Service.Window()
					break;
			}

			thisService
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				.setAsPrimary();
				
			var currentPosition = thisService.getCharacteristic(Characteristic.CurrentPosition);
				currentPosition.setConfigValues(that.config).setProps({maxValue:1});
				
			var targetPosition = thisService.getCharacteristic(Characteristic.TargetPosition)
				targetPosition.setConfigValues(that.config).setProps({maxValue:1})

			
			that.config.openValue 	??= HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.DoorUnlock)
									?? 	HomeSeerData.findCommandValue(that.config.ref,  HomeSeerData.controlUses.On) 
									?? 	0
				
			that.config.closedValue	??=	HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.Doorlock)
									??	HomeSeerData.findCommandValue(that.config.ref,  HomeSeerData.controlUses.Off)
									??	255

		
			// Handle a change received from HomeSeer!
			thisService.on('HSvalueChanged', (newHSValue) => {
				switch(true) {
					case (newHSValue === that.config.openValue):
						currentPosition.updateValue(1);
						targetPosition.updateValue(1);
						break;
					case (newHSValue === that.config.closedValue):
						currentPosition.updateValue(0);
						targetPosition.updateValue(0);
						break;
					default:
						currentPosition.updateValue(newHSValue);
						targetPosition.updateValue(newHSValue);
						break;
				}
			})	
				
				
			thisService.getCharacteristic(Characteristic.TargetPosition)
				.on('set', (value, callback) => {
					switch( value) {
						case 0: // For HomeKit "Window", value of 0 means fully closed. For Windows / Shades, value of 0 means "least light" allowed.
							HomeSeerData.sendDataValue(that.config.ref, that.config.closedValue )
							callback(null);
							break;
						case 1:
							HomeSeerData.sendDataValue(that.config.ref, that.config.openValue)
							callback(null);
							break;
						default:
							globals.log(red("*Alert* - received invalid value for binary window covering. Sending an open as default. Received value was: " + value));

							HomeSeerData.sendDataValue(that.config.ref, that.config.openValue)
							callback(null);
							break;
					}
				} );		


			if(that.config.obstructionRef) {
				thisService.getCharacteristic(Characteristic.ObstructionDetected)
					.updateUsingHSReference(that.config.obstructionRef)
					.setConfigValues(that.config)
						.on('HSvalueChanged', (newHSValue) => {
							if (that.config.obstructionClearValues.indexOf(newHSValue) == -1) {	// obstruction detected
								thisService.getCharacteristic(Characteristic.ObstructionDetected).updateValue(true);
							} else {	// not obstructed
								thisService.getCharacteristic(Characteristic.ObstructionDetected).updateValue(false);
							}
						});
			}			
			
			services.push(informationService);
			services.push(thisService);
			break;
		}	
		
		case "VariableWindowCovering": 
		case "VariableWindow": 
		{
			switch(that.config.type) {
				case "VariableWindowCovering":
					var thisService = new Service.WindowCovering()
					break;
				case "VariableWindow":
					var thisService = new Service.Window()
					break;
			}

			thisService
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				.setAsPrimary();
				
			var currentPosition = thisService.getCharacteristic(Characteristic.CurrentPosition);
			var targetPosition = thisService.getCharacteristic(Characteristic.TargetPosition)
			
			if (that.config.interface_name == "Z-Wave"){
				currentPosition.setConfigValues(that.config).setProps({maxValue:99});			
				targetPosition.setConfigValues(that.config).setProps({maxValue:99})	;
			}
				
			// Handle a change received from HomeSeer!
			thisService.on('HSvalueChanged', (newHSValue) => {
				currentPosition.updateValue(newHSValue);
				targetPosition.updateValue(newHSValue);
			})	
				
			thisService.getCharacteristic(Characteristic.TargetPosition)
					.on('set', (value, callback) => {
						HomeSeerData.sendDataValue(that.config.ref, value)
						callback(null);
					} );		

			if(that.config.obstructionRef) {
				let obstruction = thisService.getCharacteristic(Characteristic.ObstructionDetected);
				obstruction
					.updateUsingHSReference(that.config.obstructionRef)
					.setConfigValues(that.config)
						.on('HSvalueChanged', (newHSValue) => {
							if (that.config.obstructionClearValues.indexOf(newHSValue) == -1) {	// obstruction detected
								obstruction.updateValue(true);
							} else {	// not obstructed
								obstruction.updateValue(false);
							}
						});
			}			
			
			services.push(informationService);
			services.push(thisService);
			break;
		}	
		case "Lock": 
		{
			// Apple's HAP says that Service.LockManagement is mandatory for a lock, but it seems to do nothing! Include it anyway.
			var lockMgmtService = new Service.LockManagement();
				lockMgmtService.getCharacteristic(Characteristic.LockControlPoint);
				lockMgmtService.getCharacteristic(Characteristic.Version).updateValue("1.0");
				lockMgmtService.addCharacteristic(Characteristic.CurrentDoorState).updateValue(1);
				
			var currentDoorState = lockMgmtService.getCharacteristic(Characteristic.CurrentDoorState);
				
			//This is for a simple door open/closed sensor. Though supported by lockManagement, it seems to do nothing!
			if(that.config.doorSensorRef) {
				that.config.doorSensorClosedValues ??= [0];

				currentDoorState
					.updateUsingHSReference(that.config.doorSensorRef)
					.setConfigValues(that.config)
					.on('HSvalueChanged', (newHSValue, homekitObject) =>  { 
						if (currentDoorState.config.doorSensorClosedValues.includes(newHSValue))
								{ currentDoorState.updateValue(1); }
							else
								{ 	currentDoorState.updateValue(0); }		
					});		
			}

			services.push(lockMgmtService);
			
			that.config.lockRef = that.ref;
			var lockService = new Service.LockMechanism().setAsPrimary();
			lockService.HSRef = that.config.ref;
			
			if (HomeSeerData.isRootDevice(that.config.ref)) {
				throw SyntaxError(red(`*Config.json Setup Error* - You have tried to configure a Lock device for device ${cyan(that.config.ref)} specifying the reference number of its Root. For Locks, you need to specify the reference device of the lock mechanism, not the root device. See wiki entry: ${cyan("https://github.com/jvmahon/Homebridge-HomeSeer4/wiki/Setting-Up-Your-Config.json-file")}.`));
			}
			
			that.config.unlockValue	??= HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.DoorUnLock)
									?? 	0

			that.config.lockValue 	??= HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.DoorLock)
									??	255

		
			if (isZwaveLock(that.config.ref)) {
				that.config.lockedStatusValues = [65, 129, 255];
				that.config.unlockedStatusValues = [0, 1, 16, 17, 32, 33, 64, 128];
			} else {
				that.config.lockedStatusValues ??= [that.config.lockValue];
				that.config.unlockedStatusValues ??= [that.config.unlockValue];
			}
			
			if (	that.config.lockValue == that.config.unlockValue ) {
				throw new SyntaxError(red("*ERROR* - Error setting up lock. The lockValue and unlockValue can't be the same. Check your configuration values. Configuration settings are: " + JSON.stringify(that.config)));
			}
			
			if (	that.config.lockedStatusValues.includes(that.config.unlockValue) 
					|| that.config.unlockedStatusValues.includes(that.config.lockValue)) {
				throw new SyntaxError(red("*ERROR* - Error setting up lock. The unlockedStatusValues includes your locking value, or else the lockedStatusValues includes your unlocking value. Please report this on github if you can't resolve it!"));
			};
					
			if (	(that.config.lockedStatusValues.includes(that.config.lockValue) === false)
					|| (that.config.unlockedStatusValues.includes(that.config.unlockValue) === false)) {
				throw new SyntaxError(red("*ERROR* - Error setting up lock. The unlockedStatusValues is missing your unlocking value, or else the lockedStatusValues is missing your locking value. Please report this on github if you can't resolve it!"));
			}

			lockService.getCharacteristic(Characteristic.LockCurrentState)
				.setConfigValues(that.config)
				
				lockService
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				.on('HSvalueChanged', (newHSValue, HomeKitObject) => {
					switch(true) {
						case(that.config.lockedStatusValues.includes(parseFloat(newHSValue)) ): // Zwave Locked
							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(1) // secured
							HomeKitObject.getCharacteristic(Characteristic.LockTargetState).updateValue(1)
							break;
						case(that.config.unlockedStatusValues.includes(parseFloat(newHSValue))): // Zwave Unlocked
							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(0) //unsecured
							HomeKitObject.getCharacteristic(Characteristic.LockTargetState).updateValue(0)
							break;
						default:
							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(3) //jammed
							break;
					}
				});					
				

			lockService.getCharacteristic(Characteristic.LockTargetState)
				// .updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', (value, callback) => {
						switch (value) {	
							case 0: // unlock the door
									HomeSeerData.sendDataValue(that.config.ref, this.config.unlockValue);
									break					
							case 1: // lock the door
									if(currentDoorState.value === 0) {
										globals.log(yellow(`Warning - The Door with HomeSeer Reference ${lockService.config.ref} is open and you're attempting to extend the lock cylinder. To prevent damage to door frame, this command will be ignored!`));
										
										setTimeout(() => { // Wait a few seconds then restore the lock to an unlocked state
												lockService.getCharacteristic(Characteristic.LockCurrentState).updateValue(0);
												lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(0)
											}, 3000)
									} else {
										HomeSeerData.sendDataValue(that.config.ref , this.config.lockValue);
									}
									break;
							default:
									globals.log(red(`Error - incorrect value for a Lock Target State.`));
						}
						callback(null);
					});
		
			lockService.isPrimaryService = true;
	
			services.push(informationService);
			services.push(lockService);
			break;
		}
	}
}
