[![npm version](https://badge.fury.io/js/homebridge-homeseer-plugin-2018.svg)](https://badge.fury.io/js/homebridge-homeseer-plugin-2018)

# homebridge-homeseer-plugin-2018

The homebridge-homeseer-plugin-2018 is an open-source plugin for the homebridge environmen. This plugin, when used with homebridge, acts as a bridge between Apple's HomeKit platform and HomeSeer home automation software. The homebridge-homeseer-plugin-2018 supports common Z-Wave device including lights, switches, sensors, locks, and garage door openers. 

## A. New Installation and Setup Wiki Pages 
Please see the Wiki pages for instructions on Installing HomeBridge on Windows 10 and Linux and for enabling the Instant Status feature.

If you have problems getting this to work, I will try to help, but please reveiw this entire ReadMe page and reveiw the Wiki pages concerning installation on Windows and Linux before asking for assistance and, if you get specific error messages, try a few google searches for the error messages to see if there are known solutionss. Also, problems may relate to HomeBridge itself, rather than this plugin, so you should also review information posted on the HomeBridge site at: https://github.com/nfarina/homebridge in its "issues" tab and its wiki. All assistance request should be raise in the "Issues" tab.

## B. Overview of Recent Changes and Additions

## B.1 **New in 2.3.1 ** - Window Coverings

Control for simple window coverings has returned. To add a Window Covering, put a WindowCovering entry in the accessories section of your config.json file along the lines of:

			{"type":"WindowCovering", 		"ref" 715, 	"binarySwitch":true, 	"obstructionRef":716	}

The "binarySwitch" parameter is optional and used only if your widow covering is controlled by a binary switch and is limited to fully open / fully closed operation. This "should" be detected automatically, but add parameter if needed. The "obstructinRef" parameter is optional.
            
See additional information in "Window Coverings" section of the Wiki entry  [Setting Up Your Config.json file.](https://github.com/jvmahon/homebridge-homeseer/wiki/Setting-Up-Your-Config.json-file.)

## B.2 **New in Version 2.3 ** - Battery Detection, Bug Fixes

Automatically detects if a Z-Wave device has an associated battery and detects/corrects when a wrong battery reference is specified for a device in config.json. 

Also bug fixes for Garage Door Opener.

## B.3 *New in Version 2.2.5 * - Easier Lighting Configuration
Since lightbulbs are one of the most common accessories, the plugin has been updated to make it easier to specify lightbulb accessories. You no longer need to individually specify each as an accessory. Instead, you can specify the HomeSeer references for lightbulbs (both dimmable and binary-switched) as a group using the lightbulb group entry identifyer "lightbulbs" in your config.json file like so:
    
    "lightbulbs": [308, 311, 314, 317, 400, 415],
          
See additional informatinon in "Lightbulbs Group" section of the Wiki entry  [Setting Up Your Config.json file.](https://github.com/jvmahon/homebridge-homeseer/wiki/Setting-Up-Your-Config.json-file.)

## B.4. *New in Version 2.2 -* Garage Door Openers
Support for Garage Door Openers has returned. To add a garage door opener, put a GarageDoorOpener entry in the accessories section of your config.json file along the lines of:

    {"type":"GarageDoorOpener", "name":"myGarageDoor", "ref":648, "obstructionRef":649 },

See additional information in "Garage Door Openers" section of the Wiki entry  [Setting Up Your Config.json file.](https://github.com/jvmahon/homebridge-homeseer/wiki/Setting-Up-Your-Config.json-file.)


## B.5. *New in Version 2.1 -* Instant Status Update Feature - Check it out!
In addition to the new polling mechanism, described below, this version can also retrieve "Instant" status updates without polling. To enable this feature, you must enable HomeSeer's "Enable Control using ASCII commands" feature which can be accessed from the HomeSeer browers interface at [Tools menu] -> [Setup] -> [Network tab].  Its recommened that you leave the control port at the default setting of "11000".  The plugin will automatically attempt a connection to HomeSeer using the ASCII commands feature and, if that is not available, will then revert to using polling over the HTTP / JSON interface for status updates. Status messages displayed during startup will let you know if the Instant Status feature has been enabled.

When Instant Status is enbled, dimmer devices supporting the Last-Level feature (most Z-Wave Dimmers) will turn on to the last level they were at prior to being turned off rather than always turning on at 100%.

If Instant Status is enabled, polling is also reduced to once per minute. This shouldn't really be needed at all, but an occasionall poll is done out of caution to ensure that HomeBridge / HomeSeer remain properly synchronized.

## B.6 Version 2.0 - What's Changed - New Features beyond jrhubott / Version 1.x plugin
Version 2.0 of this plugin introduced a new polling mechanism in which all HomeSeer devices are polled in a single HTTP call rather than individual HTTP calls. This reduces the polling stress on HomeSeer and allows for much more frequent polling. A poll time of 5-10 seconds is recommended.

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

## C.2. Unsupported Devices
The jrhubott/homebridge-homeseer plugin included support for several device types that are not supported in this updated -2018 plugin. These types include:

* Battery (now added as a service to the other devices; no longer a separate device)
* Door (but you can still configure a Lock)
* Security System
* Thermostats (but Temperature Sensors can still be configured!)

In order to allow continued use of these device types, I have implemented a slightly modified version of the original plugin which you can use in parallel with the -2018 plugin to support these devices. Of course, you won't get the instant-status updates and other features of the -2018 plugin, but you won't lose anything either. See the wiki entry "Using 'original' and 'new' Plugin in Parallel." (https://github.com/jvmahon/homebridge-homeseer/wiki/Using-'original'-and-'new'-Plugin-in-Parallel)]

I may add support for some of these devices in the future; however, I don't have a schedule for doing so and may not be able to do so unless someone wants to donate to me devices for testing and implementing the feature.

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

Based on and includes code from [hap-nodejs](https://github.com/KhaosT/HAP-NodeJS) and [homebridge-legacy-plugins](https://github.com/nfarina/homebridge-legacy-plugins) and [homebridge-homeseer-plugin](https://github.com/jrhubott/homebridge-homeseer) and others cited therei.
