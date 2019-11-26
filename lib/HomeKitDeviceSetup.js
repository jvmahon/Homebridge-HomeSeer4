
		case "Valve":
		{
		    //globals.log("DEBUG - Case Valve");
			var valveService = new Service.Valve();
			valveService.isPrimaryService = true;
			valveService.displayName = "Service.Valve";
			valveService.timer = null;
			
			valveService.getCharacteristic(Characteristic.Active)
				.on('set', function(value, callback, context)
					{
						switch (value)
						{
						case 0: { this.sendHS( that.config.closeValve); break; }// 0 = HomeKit Valve Closed
						case 1: { this.sendHS( that.config.openValve) ; break; } // 1 = HomeKit Valve Open
						}

						callback(null);
					} )
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref);
					
			valveService.getCharacteristic(Characteristic.InUse)
				.setConfigValues(that.config)
				.updateUsingHSReference(that.config.ref);
					
			valveService.getCharacteristic(Characteristic.ValveType)
				.updateValue(that.config.valveType)
				

			if (that.config.useTimer)
			{
				valveService.addCharacteristic(Characteristic.SetDuration)
					.on('change', (data)=> 
						{
							globals.log(yellow("Valve Time Duration Set to: " + data.newValue + " seconds"))
							if(valveService.getCharacteristic(Characteristic.InUse).value)
							{
								valveService.getCharacteristic(Characteristic.RemainingDuration)
									.updateValue(data.newValue);
									
								clearTimeout(valveService.timer); // clear any existing timer
								valveService.timer = setTimeout( ()=> 
										{
											globals.log(yellow("Valve Timer Expired. Shutting off Valve"));
											// use 'setvalue' when the timer ends so it triggers the .on('set'...) event
											valveService.getCharacteristic(Characteristic.Active).setValue(0); 
										}, (data.newValue *1000));	
							}
						}); // end .on('change' ...

				valveService.addCharacteristic(Characteristic.RemainingDuration)
					.on('change', (data) => { globals.log("Valve Remaining Duration changed to: " + data.newValue) });

				valveService.getCharacteristic(Characteristic.InUse)
					.on('change', (data) =>
						{
							switch(data.newValue)
							{
								case 0:
								{
									valveService.getCharacteristic(Characteristic.RemainingDuration).updateValue(0);
									clearTimeout(valveService.timer); // clear the timer if it was used!
									break;
								}
								case 1:
								{
									var timer = valveService.getCharacteristic(Characteristic.SetDuration).value;
									
									if (timer < that.config.minTime) 
										{
											globals.log(magenta("Selected Valve On Duration of: ") + cyan(timer) 
													+ 	magenta(" seconds is less than the minimum permitted time, setting On time to: ") 
													+ 	cyan(that.config.minTime) + " seconds");
													timer = that.config.minTime
										}
									valveService.getCharacteristic(Characteristic.RemainingDuration)
										.updateValue(timer);
									
									globals.log(yellow("Turning Valve ") + cyan(that.config.name) + yellow(" on with Timer set to: ")+ cyan(timer) + yellow(" seconds"));									
									valveService.timer = setTimeout( ()=> {
														globals.log(yellow("Valve Timer Expired. Shutting off Valve"));
														// use 'setvalue' when the timer ends so it triggers the .on('set'...) event
														valveService.getCharacteristic(Characteristic.Active).setValue(0); 
												}, (timer *1000));
									break;
								}
							}
						}); // end .on('change' ...
			} // end if(that.config.useTimer)
			//globals.log("   valveService: " + JSON.stringify(valveService))
			services.push(valveService);
			break;
		}
		




		
		case "GarageDoorOpener": 
		{
            //globals.log("DEBUG - Case GarageDoorOpener");
			var garageDoorOpenerService = new Service.GarageDoorOpener();
			garageDoorOpenerService.displayName = "Service.GarageDoorOpener";
			garageDoorOpenerService.getCharacteristic(Characteristic.CurrentDoorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config);
				
			garageDoorOpenerService.getCharacteristic(Characteristic.TargetDoorState)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('set', function(value, callback, context)
					{
						switch(value)
						{
							case 0: {this.sendHS(that.config.openValue); break;} // Door Open
							case 1: {this.sendHS(that.config.closedValue); break; } // Door Closed
						}

						callback(null);
					} );					

			if(that.config.obstructionRef)
			{
			garageDoorOpenerService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
                .setConfigValues(that.config)
			}
            //globals.log("   garageDoorOpenerService: " + JSON.stringify(garageDoorOpenerService));
			services.push(garageDoorOpenerService);
			break;
		}
		
		case "Window": 
		{
            //globals.log("DEBUG - Case Window");
			var windowService = new Service.Window();
			windowService.displayName = "Service.Window";
			
			windowService.getCharacteristic(Characteristic.CurrentPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.setProps({maxValue:that.config.levels});
				
			windowService.getCharacteristic(Characteristic.TargetPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.setProps({maxValue:1})
					.on('set', function(value, callback, context)
					{
						(value > 0) ? this.sendHS(this.config.openValue) : this.sendHS(this.config.closedValue);
						callback(null);
					} );		

			if(that.config.obstructionRef != null)
			{
			windowService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
				.setConfigValues(that.config);					
			}
            //globals.log("   windowService: " + JSON.stringify(windowService));
			services.push(windowService);
			break;
		}		

		case "WindowCovering": 
		{
            //globals.log("DEBUG - Case WindowCovering");
			var windowService = new Service.WindowCovering();
			windowService.displayName = "Service.WindowCovering";
			
			windowService.getCharacteristic(Characteristic.CurrentPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.on('HSvalueChanged', (newHSValue, HomeKitObject) => { globals.log(magenta("HSvalueChanged called to update :" + HomeKitObject.displayName)) })
				.setProps({maxValue:1});
				
			windowService.getCharacteristic(Characteristic.TargetPosition)
				.updateUsingHSReference(that.config.ref)
				.setConfigValues(that.config)
				.setProps({maxValue:1})
				.on('HSvalueChanged', (data) => { globals.log(magenta("HSvalueChanged called to update TargetPosition with new value :" + data)) })
				.on('set', function(value, callback, context)
							{
								globals.log(green("value is: " + value));
								(value > 0) ? this.sendHS(this.config.openValue) : this.sendHS(this.config.closedValue);

								callback(null);
							} );				

			if(that.config.obstructionRef != null)
			{
			windowService.getCharacteristic(Characteristic.ObstructionDetected)
				.updateUsingHSReference(that.config.obstructionRef)
				.setConfigValues(that.config);					
			}
            //globals.log("   windowService: " + JSON.stringify(windowService));
			services.push(windowService);
			break;
		}		
		
