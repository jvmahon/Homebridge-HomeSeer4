'use strict'
var exports = module.exports;

var HSutilities = require("../lib/HomeSeerUtilities");
var globals = require("../index").globals;
var HomeSeerData = require("../index.js").HomeSeer;

exports.setupLightsFansPlugs = function (that, services) {
	
	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;
	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, that.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + that.config.type + " ref " + that.ref);
	switch (that.config.type)  {
		
		case "Switch": 
		case "Outlet":
		case "LightSwitch":
		case "BinaryLight":
		case "BinaryFan":
		{
			switch((that.config.type).toLowerCase() ) {
				case "switch":
					var thisService = new Service.Switch()
					var onControl	= thisService.getCharacteristic(Characteristic.On);
					break;
				case "outlet":
					var thisService = new Service.Outlet()
					var onControl	= thisService.getCharacteristic(Characteristic.On);
					break;
				case "binarylight":
				case "lightswitch": // A simple non-dimming lightbulb
					var thisService = new Service.Lightbulb()
					var onControl	= thisService.getCharacteristic(Characteristic.On);
					break;
				case "binaryfan":
					var thisService = new Service.Fanv2()
					var onControl	= thisService.getCharacteristic(Characteristic.Active);
					break;
				default:
					throw new SyntaxError("Error in setting up Binary device. Type not processed: " + that.config.type);
			}
			

			thisService
				.setAsPrimary()
				.setConfigValues(that.config);

				onControl
					.setConfigValues(that.config)
					.updateUsingHSReference(that.config.ref)
				
				// Select from a hierarchy of possible 'on' and 'off' values.
				onControl.onValue = onControl.config.onValue 
									?? HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.OnAlternate) 
									?? HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.On)
									?? 255

				onControl.offValue = onControl.config.offValue // if this is undefined, continue with the other choices
									?? HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.Off) 
									?? 0


			onControl
				.on('HSvalueChanged', function(newHSValue, HomeKitObject) {
					switch(parseFloat(newHSValue)) {
						case (onControl.offValue): 
						case 0:  // assumes 0 is always off.
								HomeKitObject.updateValue(0); 
								break ;
						default: 
								HomeKitObject.updateValue(1); 
								break;
					}
				})
				.on('set', function(newHSValue, callback) {
						switch(newHSValue == true) {
							case (true):
								HomeSeerData.sendDataValue(onControl.config.ref, onControl.onValue)
								break;
							case (false):
								HomeSeerData.sendDataValue(onControl.config.ref, onControl.offValue)
								break;
							default:
								globals.log("Error in 'Switch' device type processing on 'set'");
						}
						
						callback(null);
					} );
					
			services.push(informationService);
			services.push(thisService);
			break;
		}

		case "Lightbulb":
		case "MultilevelFan":
		case "DimmingLight":
		{
			switch(that.config.type) {
				case "DimmingLight":
				case "Lightbulb":
					var thisService = new Service.Lightbulb();
					var onControl	= thisService.getCharacteristic(Characteristic.On)
					var multilevelControl = thisService.addCharacteristic(new Characteristic.Brightness())
					if (that.config.colorTemperatureRef !== undefined) {
						var colorTemperatureControl = thisService.addCharacteristic(new Characteristic.ColorTemperature())
					}
					break;
				case "MultilevelFan":
					var thisService = new Service.Fanv2();
					var onControl	= thisService.getCharacteristic(Characteristic.Active)
					var multilevelControl = thisService.addCharacteristic(new Characteristic.RotationSpeed())
					break;
				default:
					throw new SyntaxError("Not a light or fan");
			}

			thisService
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref)
				.setAsPrimary();
			thisService.name = that.config.name;
			thisService.HSRef = that.config.ref;

			onControl.setConfigValues(that.config);
		
		// Determine the HomeSeer values that turn the device On and Off.
		// Use a user-defined value first, then try to determine the value from HomeSeer's 'Control Use' settings.
			onControl.onValue = onControl.config.onValue 
								?? HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.OnAlternate) 
								?? HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.On)
								?? 255
								
			onControl.offValue = onControl.config.offValue
								?? HomeSeerData.findCommandValue(that.config.ref, HomeSeerData.controlUses.Off) 
								?? 0
								
			onControl
				.on('change', (data) => {
						switch(data.newValue) { // Compare it to true because you might also get a 0 or 1 due to Active characteristic!
							case (1):
							case(true): // turn on.  Active Characteristic for Fan = 1, which evaluates to truthy
								if (multilevelControl.value == onControl.offValue) {	// if for some reason the multilevel control has a value equal to its offValue (which shouldn't happen), then turn it on by sending the onValue
									HomeSeerData.sendDataValue(that.config.ref, onControl.onValue )
								} else { 	// Else, turn it on by sending its last value
									HomeSeerData.sendDataValue(that.config.ref, multilevelControl.value )
								}
								break;
							case 0:
							case(false): // turn off. Active Characteristic for Fan = 0, which evaluates to falsy
								HomeSeerData.sendDataValue(that.config.ref, onControl.offValue);
								break; 
						}
					}
				);								
				
				multilevelControl.HSRef = that.config.ref;
				
				if (that.config.interface_name == "Z-Wave") { multilevelControl.setProps({maxValue:99})}
		
				multilevelControl
					.setConfigValues(that.config)
					.on('set', (value, callback) => {
								// Only send if value isn't currently set at 255. If value is at 255, it means device just received a Z-Wave 'last value' command to turn on and that still hasn't finished, so don't do anything to the brightness yet!
								
								if(HomeSeerData.getValue(multilevelControl.HSRef) != 255) {
									HomeSeerData.sendDataValue(that.config.ref, value)
								}
								callback(null); //must always finish with the callback(null);
							} );
			if(that.config.colorTemperatureRef !== undefined)
			{	
				colorTemperatureControl.HSRef = that.config.colorTemperatureRef;
				colorTemperatureControl
					.updateUsingHSReference(that.config.colorTemperatureRef)
					.setConfigValues(that.config)
					.on('set', function(value, callback) {
								globals.log(`Received a new ColorTemperature Value of: ${value} when On was set to: ${onControl.value} and while Multilevel Value was ${multilevelControl.value}` );
								HomeSeerData.sendDataValue(that.config.colorTemperatureRef, value)
								callback(null); //must always finish with the callback(null);
							} );	
							
				colorTemperatureControl.on('HSvalueChanged', function(newValue, HomeKitObject) {
					globals.log(`Received a new ColorTemperature Value of: ${newValue} from HomeSeer` );
					
					var newColorTemp = Math.min(Math.max(newValue, colorTemperatureControl.props.minValue), colorTemperatureControl.props.maxValue )		

					colorTemperatureControl.updateValue(newColorTemp);
				})
			}
			// Now is the tricky part - handle updates coming from HomeSeer but don't turn On if already On!
			
			thisService.on('HSvalueChanged', (newValue) => {
				switch(true) {
					case(newValue == 0):// Zero is universal for turning off, so just turn device off
						onControl.updateValue(0); 
						break;
					case(newValue == 255): // 255 is the Z-Wave value for "last value" - just turn on
						onControl.updateValue(1); 
						break;
					default: // any other value, figure if it is just to adjust brightness, or to turn on!
						switch( onControl.value == true) {
							case(true): // already on, so just adjust brightness
								multilevelControl.updateValue(newValue); 
								break;
							case(false): // was off, so turn on and adjust brightness.
								multilevelControl.updateValue(newValue); 
								onControl.updateValue(true); 

								break;
							default:
								globals.log("*Debug* - Invalid control value for onControl.value of: " + onControl.value);
						}
				}
			});
			services.push(informationService)
			services.push(thisService)
			break;
		}
	}
}
