[![npm version](https://badge.fury.io/js/homebridge-homeseer-plugin-2018.svg)](https://badge.fury.io/js/homebridge-homeseer-plugin-2018)

# homebridge-homeseer-plugin-2018

The homebridge-homeseer-plugin-2018 is an open-source plugin for the homebridge environment. This plugin, when used with homebridge, acts as a bridge between Apple's HomeKit platform and HomeSeer home automation software. The homebridge-homeseer-plugin-2018 supports common Z-Wave device including lights, switches, sensors, locks, and garage door openers. 

## A. New Installation and Setup Wiki Pages 
Please see the Wiki pages for instructions on Installing HomeBridge on Windows 10 and Linux and for enabling the Instant Status feature.

If you have problems getting this to work, I will try to help, but please reveiw this entire ReadMe page and reveiw the Wiki pages concerning installation on Windows and Linux before asking for assistance and, if you get specific error messages, try a few google searches for the error messages to see if there are known solutionss. Also, problems may relate to HomeBridge itself, rather than this plugin, so you should also review information posted on the HomeBridge site at: https://github.com/nfarina/homebridge in its "issues" tab and its wiki. All assistance request should be raise in the "Issues" tab.

## B. Overview of Recent Changes and Additions

## **New in 2.3.11** - Valve Timers & Types, Thermostat Fixes

The "Valve" type has been enhanced to allow selecting of the type of valve (using config.json parameter valveType: ); allowed values are 0= Generic, 1=Irrigation, 2=Shower Head, 3=Water Faucet. As of iOS 11.3, the only effect is that a setting of 1  will change the Icon displayed in the Home app. All other setttings use the same icon.

*Experimmental* - The "Valve" type has als been enhanced to allow use of timers ("useTimer":"true"). Time is set on the 'details' page for the valve. The default minimum time is 30 seconds (this can be changed in the config.json file using parameter minTime:30. After the valve is opend, the remaining duration will dipslay in the Home app. There is a bug which causes the remaining time displayed to 'reset' if the phone screen has been locked and then unlocked. Though the *displayed* time resets, the actual countdown appears to continue as expected. This appears to be an iOS Home app. bug rather than a plugin bug.

## **New in 2.3.10** - Thermostat Fixes, Valves and Improved Error Checking

The Thermostat type has been updates to support separate heating and cooling setpoints. You should no longer use a setPointRef, but instead, should set coolingSetpointRef to the HomeSeer device that controls temperature in cooling mode, and heatingSetpointRef to the HomeSeer device that controls the temperature in heating mode.

Support for simple water valves has been added. To add a valve, put an entry of the following form in your config.json

     {"type":"Valve", "ref":123, "openValve":255, "closeValve":0}

where "ref" specifies the HomeSeer reference controlling the valve. The "openValve" and "closeValve" parameters are optional and do not need to be specified if your device uses the 'typical' values of 255 for open, 0 for closed.

I have not yet implemented valve timers. That may come in the future.

Additional config.json error checking has been added to catch some more common errors like incorrectly specified parameters and incorrectly identified HomeSeer references.

## **New in 2.3.6** - Security System Support
Security System support has been added. See sample configuration files in 'config' directory, and wiki pages for configuraiton parameter setings.

Window Coverings can now accept an "openValue" and "closedValue" as well as a "binarySwitch" configuration parameter.See WindowCovering section, below.

## **New in 2.3.5** - Thermostat and onValue Support

Support has been added for Z-Wave Thermostats. This is still somewhat "untested" so post an issue if have any problems. See Section G of the Wiki page "Seting Up Your Config.json file" for more information on configuring thermostats. https://github.com/jvmahon/homebridge-homeseer/wiki/Setting-Up-Your-Config.json-file.

	{"type":"Thermostat", "name":"Living Room", "ref":29, "setPointRef":28, "controlRef":27, "stateRef":26, "humidityRef":32, "humidityTargetRef":33, "temperatureUnit":"F"}
	
where "ref" is the current temperature device; "setPointRef" is the target temperature device, "controlRef" is the device to select the heating mode (Off, Heat, Cool, Auto), and "stateRef" is the device that reports the working state of the system ("Off", "Heating", "Cooling"). The "temperatureUnit" setting is the unit used by your HomeSeer configuration.  Your iPhone's temperature unit is determined by the iPhone's system settings. You may also specify an optional humidity sensor via "humidityRef" and optional device to control relative humidity using "humidityTargetRef".

This update also supports specification of an "onValue" parameter for lightbulb, outlet, fan, and switch accessories. This has been added to allow support of accessories which do not use the "default" Z-Wave value of 255 to turn on the accessory. For example, the Lutron plugin uses values 1-100 to turn on a Lutron bulb. May be also be used for Z-Wave dimmers to always turn the dimmer on to a set value when the accessory icon is tapped (e.g., "onValue":75 will always turn dimmer on to 75%). For Z-Wave, it is generally preferable to leave the onValue undefined which defaults to 255 (on-last-level). If specified for Z-Wave, onValue should be in the range 1-99 or 255.

## **New in 2.3.1 ** - Window Coverings

Control for simple window coverings has returned. To add a Window Covering, put a WindowCovering entry in the accessories section of your config.json file along the lines of:

	{"type":"WindowCovering", 		"ref" 715, 	"binarySwitch":true, 	"openValue":255, "closedValue: 0,  "obstructionRef":716	}

The "binarySwitch" parameter is optional and used only if your widow covering is controlled by a binary switch and is limited to fully open / fully closed operation. This "should" be detected automatically, but add the parameter if it doesn't seem to detect correctly. The "openValue" and "closedValue" parameters can be used in conjunction with "binarySwitch" to specify the opening / closing values to be sent to / received from HomeSeer. The "obstructinRef" parameter is optional.
            
See additional information in "Window Coverings" section of the Wiki entry  [Setting Up Your Config.json file.](https://github.com/jvmahon/homebridge-homeseer/wiki/Setting-Up-Your-Config.json-file.)

## **New in Version 2.3 ** - Battery Detection, Bug Fixes

Automatically detects if a Z-Wave device has an associated battery and detects/corrects when a wrong battery reference is specified for a device in config.json. 

Also bug fixes for Garage Door Opener.

## *New in Version 2.2.5 * - Easier Lighting Configuration
Since lightbulbs are one of the most common accessories, the plugin has been updated to make it easier to specify Z-Wave lightbulb accessories. You no longer need to individually specify each as an accessory. Instead, you can specify the HomeSeer references for lightbulbs (both dimmable and binary-switched) as a group using the lightbulb group entry identifyer "lightbulbs" in your config.json file like so:
    
    "lightbulbs": [308, 311, 314, 317, 400, 415],

NOTE: This only works for Lightbulbs that use the value "255" as the turn-on value ("Last" brihtness setting). If your lights are Z-Wave, then you should be O.K. as "255" is the standard "Last" brightness value for Z-Wave.

See additional informatinon in "Lightbulbs Group" section of the Wiki entry  [Setting Up Your Config.json file.](https://github.com/jvmahon/homebridge-homeseer/wiki/Setting-Up-Your-Config.json-file.)

## *New in Version 2.2 -* Garage Door Openers
Support for Garage Door Openers has returned. To add a garage door opener, put a GarageDoorOpener entry in the accessories section of your config.json file along the lines of:

    {"type":"GarageDoorOpener", "name":"myGarageDoor", "ref":648, "obstructionRef":649 },

See additional information in "Garage Door Openers" section of the Wiki entry  [Setting Up Your Config.json file.](https://github.com/jvmahon/homebridge-homeseer/wiki/Setting-Up-Your-Config.json-file.)


## *New in Version 2.1 -* Instant Status Update Feature - Check it out!
Version 2.1 introduced an "Instant" status feature which provides near-instantaneous status updates from HomeSeer. To enable this feature, you must enable HomeSeer's "Enable Control using ASCII commands" feature. See Wiki entry: https://github.com/jvmahon/homebridge-homeseer/wiki/Enable-Instant-Status-(HomeSeer-ASCII-Port) 

## C. Changes to config.json setup!
For further infomration on setting up the config.json file, see Wiki page entry at: https://github.com/jvmahon/homebridge-homeseer/wiki/Setting-Up-Your-Config.json-file.

## C.1. Automatic Type Determination
* For some types of devices, the device type is now determined from information retrieved from HomeSeer if it hasn't been specified in the config.json file. Specifically, this plugin now looks at the "Device Type (String)" field obtained from HomeSeer to determine a mapping to a HomeKit device. The mappings are fairly simple and not all HomeKit devices are supported. Supported Mappings are:

  - "Z-Wave Switch Binary"        ->  "Switch"
  - "Z-Wave Switch Multilevel"    ->  "Lightbulb" 
  - "Z-Wave Door Lock"            ->  "Lock"
  - "Z-Wave Temperature"          ->  "TemperatureSensor"
  - "Z-Wave Water Leak Alarm"     ->  "LeakSensor"
  
  ** If you know of other mappings that can be included such as for the Fan, Outlet, MotionSensor, CarbonMonoxideSensor, CarbonDioxideSensor, ContactSensore, OccupancySensor, SmokeSensor, LightSensor, HumiditySensor types, please let me know and I'll include them

Note that a user can manually alter their HomeSeer Device type (String) so this mapping mechanism only works if the user hasn't touched it!

# D. Installation

If you used a prior HomeSeer plugin, you must remove it before installing this plugin using, e.g.,:

  npm -g uninstall homebridge-homeseer
  
  npm -g uninstall homebridge-homeseer-plugin
  
  
## D.1. Windows
For Windows installation, see: https://github.com/jvmahon/homebridge-homeseer/wiki/Windows-10-Installation.

## D.2. Linux (Ubuntu/Debian based
For Linux installation, see: https://github.com/jvmahon/homebridge-homeseer/wiki/Linux-Installation.
 
## E. Cautions
Extreme caution should be used when using this plugin with sensors and, in particular, any safety oriented sensors. This plugin may not provide real-time update to the sensor status and updates can be delayed due to polling delays or update failurs. Sensor status should not be relied on for critical safety or security applications. This software is implimented for educational and experimental purposes,  is not of commercial quality, and has not undergone significant user testing. All use is at your own risk.

## F. Credits
This plugin is for use with [homebridge](https://github.com/nfarina/homebridge) Apple iOS Homekit support application to support integration with the [Homeseer V3](http://www.homeseer.com/home-control-software.html) software

Based on and includes code from [hap-nodejs](https://github.com/KhaosT/HAP-NodeJS) and [homebridge-legacy-plugins](https://github.com/nfarina/homebridge-legacy-plugins) and [homebridge-homeseer-plugin](https://github.com/jrhubott/homebridge-homeseer) and others cited therein.
