[![npm version](https://badge.fury.io/js/homebridge-homeseer-plugin-2018.svg)](https://badge.fury.io/js/homebridge-homeseer-plugin-2018)

# homebridge-homeseer-plugin-2018

### For the most up-to-date information, see: https://github.com/jvmahon/homebridge-homeseer/

Information on github and in the wiki section may be more up-to-date than in the README file downloaded from 'npm'. Its strongly recommended that you check the github.com information (both the README and the wiki section) for up-to-date information and assistance.

## Overview

The homebridge-homeseer-plugin-2018 is an open-source plugin for the homebridge environment. This plugin, when used with homebridge, acts as a bridge between Apple's HomeKit platform and HomeSeer home automation software. The homebridge-homeseer-plugin-2018 supports common Z-Wave device including lights, switches, sensors, locks, and garage door openers. 

## A. New Installation and Setup Wiki Pages 
Please see the Wiki pages for instructions on Installing HomeBridge on Windows 10 and Linux. Really - look there first: https://github.com/jvmahon/homebridge-homeseer/wiki.

If you have problems getting the plugin to work, I will try to help, but please reveiw this entire ReadMe page and review the Wiki pages concerning installation on Windows and Linux before asking for assistance (if you're problem is something I've seen before, I will try and document its solution in the Wiki) and, if you get specific error messagesa and the solution isn't in the Wiki, try a few google searches for the error messages to see if there are known solutions. Also, problems may relate to HomeBridge itself, rather than this plugin, so you should also review information posted on the HomeBridge site at: https://github.com/nfarina/homebridge in its "issues" tab and its wiki. All assistance request should be raise in the "Issues" tab.

## B. Overview of Recent Changes and Additions

## *New in 2.3.14* - "Windows" Type Support
Support has been added for a "Window" type. This is for a window that opens and closes. If you are  controlling a shade or blind, use the WindowCovering type instead.


## *New in 2.3.12* - Stricter Type Checking, offValue

There code now applies stricter checking to your config.json file. Invalid accessory property names are now checked on a per-type basis and will now throw an error.

An "offValue" parameter setting is now allowed for Switches, Outlets, Fans and Lightbulbs.

An "offValues" array can now be set for binary switch types using an off value other than 0. This is for 'odd' use cases and generally does not need to be set by the user!

You may now specify a "tamperRef" for most sensor types. The "tamperRef" parameter should be set to the HomeSeerDevice that reports that a device has been tampered with. If set, the Home app will indicate on a device's "details" page if it has been tampered with.






## **New in 2.3.5** - onValue Support


This update also supports specification of an "onValue" parameter for lightbulb, outlet, fan, and switch accessories. This has been added to allow support of accessories which do not use the "default" Z-Wave value of 255 to turn on the accessory. For example, the Lutron plugin uses values 1-100 to turn on a Lutron bulb. May be also be used for Z-Wave dimmers to always turn the dimmer on to a set value when the accessory icon is tapped (e.g., "onValue":75 will always turn dimmer on to 75%). For Z-Wave, it is generally preferable to leave the onValue undefined which defaults to 255 (on-last-level). If specified for Z-Wave, onValue should be in the range 1-99 or 255.

## **New in 2.3.1 ** - Window Coverings

Control for simple window coverings has returned. To add a Window Covering, put a WindowCovering entry in the accessories section of your config.json file along the lines of:

	{"type":"WindowCovering", 		"ref" 715, 	"binarySwitch":true, 	"openValue":255, "closedValue: 0,  "obstructionRef":716	}

The "binarySwitch" parameter is optional and used only if your widow covering is controlled by a binary switch and is limited to fully open / fully closed operation. This "should" be detected automatically, but add the parameter if it doesn't seem to detect correctly. The "openValue" and "closedValue" parameters can be used in conjunction with "binarySwitch" to specify the opening / closing values to be sent to / received from HomeSeer. The "obstructinRef" parameter is optional.
            
See additional information in "Window Coverings" section of the Wiki entry  [Setting Up Your Config.json file.](https://github.com/jvmahon/homebridge-homeseer/wiki/Setting-Up-Your-Config.json-file.)


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
  
 
## E. Cautions
Extreme caution should be used when using this plugin with sensors and, in particular, any safety oriented sensors. This plugin may not provide real-time update to the sensor status and updates can be delayed due to polling delays or update failurs. Sensor status should not be relied on for critical safety or security applications. This software is implimented for educational and experimental purposes,  is not of commercial quality, and has not undergone significant user testing. All use is at your own risk.

## F. Credits
This plugin is for use with [homebridge](https://github.com/nfarina/homebridge) Apple iOS Homekit support application to support integration with the [Homeseer V3](http://www.homeseer.com/home-control-software.html) software

Based on and includes code from [hap-nodejs](https://github.com/KhaosT/HAP-NodeJS) and [homebridge-legacy-plugins](https://github.com/nfarina/homebridge-legacy-plugins) and [homebridge-homeseer-plugin](https://github.com/jrhubott/homebridge-homeseer) and others cited therein.
