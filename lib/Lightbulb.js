		case "Lightbulb": 
		{
            //globals.log("DEBUG - Case Lightbulb");
			// that.log("** Debug ** - Setting up bulb %s with can_dim: %s", that.config.name, that.config.can_dim);
			var thisService = new Service.Lightbulb();
			thisService.isPrimaryService = true;
			thisService.displayName = "Service.Lightbulb";
			thisService.config = that.config;

			thisService.getCharacteristic(Characteristic.On).updateUsingHSReference(that.config.ref);
			
			thisService.getCharacteristic(Characteristic.On)
				.setConfigValues(that.config)
				.on('change', function(value)
							{

								if (value.newValue == true)
								{
									if (this.config.interface_name == "Z-Wave") 
									{
											this.sendHS(255) 
											globals.forceHSValue(this.HSRef, 255)
									}
									else
									{
										this.sendHS(this.config.onValue)
									}

								}
								else // turn off	
									{this.sendHS(0);}							
							} );
							
			if (HSutilities.findControlPairByCommand(that.config.ref, "Dim") != null)
			{
				thisService.isDimmer = true;
				thisService.addCharacteristic(new Characteristic.Brightness())
					.setConfigValues(that.config)
					.setProps({maxValue:that.config.levels})

					.on('set', function(value, callback, context)
							{
								// Only send if value isn't 255. If value is at 255, it means device just received a Z-Wave 'last value' command to turn on and that still hasn't finished, so don't do anything to the brightness yet!
								if(globals.getHSValue(this.HSRef) != 255) 
								{
									this.sendHS(value)
								}
								callback(null); //must always finish with the callback(null);
							} );
							
				thisService.getCharacteristic(Characteristic.On).on('HSvalueChanged', function(newValue, HomeKitObject)
					{
						globals.log(chalk.blue("Updating a Dimming light"));
						switch(true)
						{
							case(newValue == 0):// Zer is universal for turning off, so just turn light off
							{
								HomeKitObject.getCharacteristic(Characteristic.On).updateValue(false); 
								break;
							}
							case(newValue == 255): // 255 is the Z-Wave value for "last value" - just turn on
							{
								HomeKitObject.getCharacteristic(Characteristic.On).updateValue(true); 
								break;
							}
							default: // any other value, figure if it is just to adjust brightness, or to turn on!
							{
								switch( HomeKitObject.getCharacteristic(Characteristic.On).value)
								{
									case(true): // already on, so just adjust brightness
									{
										HomeKitObject.getCharacteristic(Characteristic.Brightness).updateValue(newValue); 
									}
									case(false): // was off, so turn on and adjust brightness.
									{
										HomeKitObject.getCharacteristic(Characteristic.On).updateValue(true); 
										HomeKitObject.getCharacteristic(Characteristic.Brightness).updateValue(newValue); 
										break;

									}
								}
							}
						}
					});

			}
			else{
				thisService.getCharacteristic(Characteristic.On).on('HSvalueChanged', function(newValue, HomeKitObject)
					{
						globals.log(chalk.blue("Updating a non-dimming light"));
						/*if (newValue == 0) 	
							HomeKitObject.getCharacteristic(Characteristic.On).updateValue(false) 
						else 
							HomeKitObject.getCharacteristic(Characteristic.On).updateValue(true); */
					});
			
			}
			services.push(thisService);
			break;
		}
	}

/*
