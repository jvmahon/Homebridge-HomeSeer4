'use strict'
var exports = module.exports;

var HSutilities = require("../lib/HomeSeerUtilities");
var globals = require("../index").globals;
var HomeSeerData = require("../index.js").HomeSeer;

function isZwaveLock(reference) {
		var StatusInfo = HomeSeerData.getStatusData(reference)
		
		if ((StatusInfo === null) || (StatusInfo === undefined) ) {
				throw new SyntaxError("You specified a Lock using HomeSeer reference: '" + reference + "' which is not a valid HomeSeer reference. Check your config.json file and fix!")
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

exports.setupLocksDoorsWindows = function (newDevice, services) {
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, newDevice.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + newDevice.config.type + " ref " + newDevice.ref);
		
	switch (newDevice.config.type)  {
		case "GarageDoorOpener": 
			var thisService = new Service.GarageDoorOpener()
				.updateUsingHSReference(newDevice.config.ref);
			
			// IF user-specified, choose that first!

			thisService.control = [];
			var targetDoorState = thisService.getCharacteristic(Characteristic.TargetDoorState);
			targetDoorState.setConfigValues(newDevice.config)
			
			var currentDoorState = thisService.getCharacteristic(Characteristic.CurrentDoorState)
			currentDoorState.setConfigValues(newDevice.config);

				switch (newDevice.config.interface_name) {
					case ("Unknown"):
						newDevice.config.openValue		=	255 // Open
						newDevice.config.closedValue	=	0 	// Closed
						newDevice.config.openingValue	=	254 // Opening
						newDevice.config.closingValue	=	252 // Closing
						newDevice.config.stoppedValue	=	253 // Stopped
						break;
					case ("Z-Wave"):
						newDevice.config.openValue		=	255 // Open
						newDevice.config.closedValue	=	0 	// Closed
						newDevice.config.openingValue	=	254 // Opening
						newDevice.config.closingValue	=	252 // Closing
						newDevice.config.stoppedValue	=	253 // Stopped
						break;
					case ("LiftMaster MyQ"):
						newDevice.config.openValue		=	1 // Open
						newDevice.config.closedValue	=	2 	// Closed
						newDevice.config.openingValue	=	4 // Opening
						newDevice.config.closingValue	=	5 // Closing
						newDevice.config.stoppedValue	=	3 // Stopped						
						break;
					case ("MyQ"):
						newDevice.config.openValue		=	1 // Open
						newDevice.config.closedValue	=	3 	// Closed
						newDevice.config.openingValue	=	undefined  // Opening
						newDevice.config.closingValue	=	undefined  // Closing
						newDevice.config.stoppedValue	=	undefined  // Stopped						
						break;
					case ("HSMyQ"):
						newDevice.config.openValue		=	3 // Open
						newDevice.config.closedValue	=	1 	// Closed
						newDevice.config.openingValue	=	4  // Opening
						newDevice.config.closingValue	=	2  // Closing
						newDevice.config.stoppedValue	=	5  // Stopped						
						break;
					default:
						newDevice.config.closedValue ??= HomeSeerData.findCommandValue(newDevice.config.ref, HomeSeerData.controlUses.DoorLock);
							
						newDevice.config.openValue ??= HomeSeerData.findCommandValue(newDevice.config.ref, HomeSeerData.controlUses.DoorUnLock);
						
						if ((newDevice.config.closedValue === undefined) || (newDevice.config.openValue === undefined) ) {
							globals.log("*Warning* - openValue, closeValue, openingValue, closingValue, or stoppedValue not defined in config.json for GarageDoorOpener with reference: " + newDevice.config.ref);
							globals.log("For proper configuration, Consult Wiki entry at: " + "https://github.com/jvmahon/Homebridge-HomeSeer4/wiki/Garage-Door-Openers");
							throw new SyntaxError("Undefined garage door control values");
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
								globals.log("*Debug* - Received unexpected GarageDoorOpener value of: " + newHSValue );
								// throw new RangeError("Error in GarageDoorOpener type - HSvalueChanged value out of range! Value is: " + newHSValue);
						}
					});

if (newDevice.config.interface_name === "Unknown") {
globals.log("Garage Door interface is " + newDevice.config.interface_name + ", using openingValue and closingValue to control door.")
			targetDoorState
				.on('set', (value, callback) =>{
						switch(value){
							case 0:  // Command to HomeSeer to Open Door
									HomeSeerData.sendDataValue(newDevice.config.ref, targetDoorState.config.openingValue); 
									break;
							case 1:  // Command to HomeSeer to Close Door
									HomeSeerData.sendDataValue(newDevice.config.ref, targetDoorState.config.closingValue); 
									break; 
						}
						callback(null);
					} );	
					
}

if (newDevice.config.interface_name != "Unknown") {
globals.log("Garage Door interface is " + newDevice.config.interface_name + ", using openValue and closedValue to control door.")
			targetDoorState
				.on('set', (value, callback) =>{
						switch(value){
							case 0:  // Command to HomeSeer to Open Door
									HomeSeerData.sendDataValue(newDevice.config.ref, targetDoorState.config.openValue); 
									break;
							case 1:  // Command to HomeSeer to Close Door
									HomeSeerData.sendDataValue(newDevice.config.ref, targetDoorState.config.closedValue); 
									break; 
						}
						callback(null);
					} );	
					
}
			

			if(newDevice.config.obstructionRef){
			thisService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(newDevice.config.obstructionRef)
                .setConfigValues(newDevice.config)
					.on('HSvalueChanged', (newHSValue) => {
						if (newDevice.config.obstructionClearValues.indexOf(newHSValue) == -1) {	// obstruction detected
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
			switch(newDevice.config.type) {
				case "BinaryWindowCovering":
					var thisService = new Service.WindowCovering()
					break;
				case "BinaryWindow":
					var thisService = new Service.Window()
					break;
			}

			thisService
				.setConfigValues(newDevice.config)
				.updateUsingHSReference(newDevice.config.ref)
				.setAsPrimary();
				
			var currentPosition = thisService.getCharacteristic(Characteristic.CurrentPosition);
				currentPosition.setConfigValues(newDevice.config).setProps({maxValue:1});
				
			var targetPosition = thisService.getCharacteristic(Characteristic.TargetPosition)
				targetPosition.setConfigValues(newDevice.config).setProps({maxValue:1})

			
			newDevice.config.openValue 	??= HomeSeerData.findCommandValue(newDevice.config.ref, HomeSeerData.controlUses.DoorUnlock)
									?? 	HomeSeerData.findCommandValue(newDevice.config.ref,  HomeSeerData.controlUses.On) 
									?? 	0
				
			newDevice.config.closedValue	??=	HomeSeerData.findCommandValue(newDevice.config.ref, HomeSeerData.controlUses.Doorlock)
									??	HomeSeerData.findCommandValue(newDevice.config.ref,  HomeSeerData.controlUses.Off)
									??	255

		
			// Handle a change received from HomeSeer!
			thisService.on('HSvalueChanged', (newHSValue) => {
				switch(true) {
					case (newHSValue === newDevice.config.openValue):
						currentPosition.updateValue(1);
						targetPosition.updateValue(1);
						break;
					case (newHSValue === newDevice.config.closedValue):
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
							HomeSeerData.sendDataValue(newDevice.config.ref, newDevice.config.closedValue )
							callback(null);
							break;
						case 1:
							HomeSeerData.sendDataValue(newDevice.config.ref, newDevice.config.openValue)
							callback(null);
							break;
						default:
							globals.log("*Alert* - received invalid value for binary window covering. Sending an open as default. Received value was: " + value);

							HomeSeerData.sendDataValue(newDevice.config.ref, newDevice.config.openValue)
							callback(null);
							break;
					}
				} );		


			if(newDevice.config.obstructionRef) {
				thisService.getCharacteristic(Characteristic.ObstructionDetected)
					.updateUsingHSReference(newDevice.config.obstructionRef)
					.setConfigValues(newDevice.config)
						.on('HSvalueChanged', (newHSValue) => {
							if (newDevice.config.obstructionClearValues.indexOf(newHSValue) == -1) {	// obstruction detected
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
			switch(newDevice.config.type) {
				case "VariableWindowCovering":
					var thisService = new Service.WindowCovering()
					break;
				case "VariableWindow":
					var thisService = new Service.Window()
					break;
			}

			thisService
				.setConfigValues(newDevice.config)
				.updateUsingHSReference(newDevice.config.ref)
				.setAsPrimary();
				
			var currentPosition = thisService.getCharacteristic(Characteristic.CurrentPosition);
			var targetPosition = thisService.getCharacteristic(Characteristic.TargetPosition)
			
			if (newDevice.config.interface_name == "Z-Wave"){
				currentPosition.setConfigValues(newDevice.config).setProps({maxValue:99});			
				targetPosition.setConfigValues(newDevice.config).setProps({maxValue:99})	;
			}
				
			// Handle a change received from HomeSeer!
			thisService.on('HSvalueChanged', (newHSValue) => {
				currentPosition.updateValue(newHSValue);
				targetPosition.updateValue(newHSValue);
			})	
				
			thisService.getCharacteristic(Characteristic.TargetPosition)
					.on('set', (value, callback) => {
						HomeSeerData.sendDataValue(newDevice.config.ref, value)
						callback(null);
					} );		

			if(newDevice.config.obstructionRef) {
				let obstruction = thisService.getCharacteristic(Characteristic.ObstructionDetected);
				obstruction
					.updateUsingHSReference(newDevice.config.obstructionRef)
					.setConfigValues(newDevice.config)
						.on('HSvalueChanged', (newHSValue) => {
							if (newDevice.config.obstructionClearValues.indexOf(newHSValue) == -1) {	// obstruction detected
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
			if(newDevice.config.doorSensorRef) {
				newDevice.config.doorSensorClosedValues ??= [0];

				currentDoorState
					.updateUsingHSReference(newDevice.config.doorSensorRef)
					.setConfigValues(newDevice.config)
					.on('HSvalueChanged', (newHSValue, homekitObject) =>  { 
						if (currentDoorState.config.doorSensorClosedValues.includes(newHSValue))
								{ currentDoorState.updateValue(1); }
							else
								{ 	currentDoorState.updateValue(0); }		
					});		
			}

			services.push(lockMgmtService);
			
			newDevice.config.lockRef = newDevice.ref;
			var lockService = new Service.LockMechanism().setAsPrimary();
			lockService.HSRef = newDevice.config.ref;
			
			if (HomeSeerData.isRootDevice(newDevice.config.ref)) {
				throw SyntaxError(`*Config.json Setup Error* - You have tried to configure a Lock device for device ${newDevice.config.ref} specifying the reference number of its Root. For Locks, you need to specify the reference device of the lock mechanism, not the root device. See wiki entry: ${"https://github.com/jvmahon/Homebridge-HomeSeer4/wiki/Setting-Up-Your-Config.json-file"}.`);
			}
			
			newDevice.config.unlockValue ??= HomeSeerData.findCommandValue(newDevice.config.ref, HomeSeerData.controlUses.DoorUnLock) ?? 	0

			newDevice.config.lockValue 	??= HomeSeerData.findCommandValue(newDevice.config.ref, HomeSeerData.controlUses.DoorLock) ??	255

		
			if (isZwaveLock(newDevice.config.ref)) {
				newDevice.config.lockedStatusValues = [65, 129, 255];
				newDevice.config.unlockedStatusValues = [0, 1, 16, 17, 32, 33, 64, 128];
			} else {
				newDevice.config.lockedStatusValues ??= [newDevice.config.lockValue];
				newDevice.config.unlockedStatusValues ??= [newDevice.config.unlockValue];
			}
			
			if (	newDevice.config.lockValue == newDevice.config.unlockValue ) {
				throw new SyntaxError("*ERROR* - Error setting up lock. The lockValue and unlockValue can't be the same. Check your configuration values. Configuration settings are: " + JSON.stringify(newDevice.config));
			}
			
			if (	newDevice.config.lockedStatusValues.includes(newDevice.config.unlockValue) 
					|| newDevice.config.unlockedStatusValues.includes(newDevice.config.lockValue)) {
				throw new SyntaxError("*ERROR* - Error setting up lock. The unlockedStatusValues includes your locking value, or else the lockedStatusValues includes your unlocking value. Please report this on github if you can't resolve it!");
			};
					
			if (	(newDevice.config.lockedStatusValues.includes(newDevice.config.lockValue) === false)
					|| (newDevice.config.unlockedStatusValues.includes(newDevice.config.unlockValue) === false)) {
				throw new SyntaxError("*ERROR* - Error setting up lock. The unlockedStatusValues is missing your unlocking value, or else the lockedStatusValues is missing your locking value. Please report this on github if you can't resolve it!");
			}

			lockService.getCharacteristic(Characteristic.LockCurrentState)
				.setConfigValues(newDevice.config)
				
				lockService
				.setConfigValues(newDevice.config)
				.updateUsingHSReference(newDevice.config.ref)
				.on('HSvalueChanged', (newHSValue, HomeKitObject) => {
					switch(true) {
						case(newDevice.config.lockedStatusValues.includes(parseFloat(newHSValue)) ): // Zwave Locked
							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(1) // secured
							HomeKitObject.getCharacteristic(Characteristic.LockTargetState).updateValue(1)
							break;
						case(newDevice.config.unlockedStatusValues.includes(parseFloat(newHSValue))): // Zwave Unlocked
							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(0) //unsecured
							HomeKitObject.getCharacteristic(Characteristic.LockTargetState).updateValue(0)
							break;
						default:
							HomeKitObject.getCharacteristic(Characteristic.LockCurrentState).updateValue(3) //jammed
							break;
					}
				});					
				

			lockService.getCharacteristic(Characteristic.LockTargetState)
				// .updateUsingHSReference(newDevice.config.ref)
				.setConfigValues(newDevice.config)
				.on('set', (value, callback) => {
						switch (value) {	
							case 0: // unlock the door
									HomeSeerData.sendDataValue(newDevice.config.ref, newDevice.config.unlockValue);
									break					
							case 1: // lock the door
									if(currentDoorState.value === 0) {
										globals.log(`Warning - The Door with HomeSeer Reference ${lockService.config.ref} is open and you're attempting to extend the lock cylinder. To prevent damage to door frame, this command will be ignored!`);
										
										setTimeout(() => { // Wait a few seconds then restore the lock to an unlocked state
												lockService.getCharacteristic(Characteristic.LockCurrentState).updateValue(0);
												lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(0)
											}, 3000)
									} else {
										HomeSeerData.sendDataValue(newDevice.config.ref , newDevice.config.lockValue);
									}
									break;
							default:
									globals.log(`Error - incorrect value for a Lock Target State.`);
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
