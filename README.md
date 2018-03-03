[![npm version](https://badge.fury.io/js/homebridge-homeseer-plugin-2018.svg)](https://badge.fury.io/js/homebridge-homeseer-plugin-2018)

# homebridge-homeseer-plugin-2018

## A. New Installation and Setup Wiki Pages 
Please see the Wiki pages for instructions on Installing HomeBridge on Windows 10 and Linux and for enabling the Instant Status feature.

If you have problems getting this to work, I will try to help, but please reveiw this entire ReadMe page and reveiw the Wiki pages concerning installation on Windows and Linux before asking for assistance and, if you get specific error messages, try a few google searches for the error messages to see if there are known solutionss. Also, problems may relate to HomeBridge itself, rather than this plugin, so you should also review information posted on the HomeBridge site at: https://github.com/nfarina/homebridge in its "issues" tab and its wiki. All assistance request should be raise in the "Issues" tab.

## B. Recent Changes

## B.1 *New in Version 2.2.5 * - Easier Lighting Configuration
Since lightbulbs are one of the most common accessories, the plugin has been updated to make it easier to specify lightbulb accessories. You no longer need to individually specify each as an accessory. Instead, you can specify the HomeSeer references for lightbulbs (both dimmable and binary-switched) as a group using the lightbulb group entry identifyer "lightbulbs" in your config.json file like so:
    
    			"lightbulbs": [308, 311, 314, 317, 400, 415],
          
Note that you * must * use square brackets. 

Use of the "lightbulbs" entry is optional and you can, instead, continue to specify bulbs individually in config.json. See the sample configuration files in the "config" folder for an example of how the "lightbulbs" entry is specified. This may not work reliably for non-Z-Wave devices as it relies on the  presence of the string "Z-Wave Switch Binary" or "Z-Wave Switch Multilevel" in the HomeSeer device data to determine whether the bulb is dimmable or not. If you include a non-Z-Wave binary switch in this array, it will default to dimmable even if it is a binary switch! The solution to this is to simply specify non-Z-Wave bulbs as part of the "accessories" array as in prior versions.     

## B.2. *New in Version 2.2 -* Garage Door Openers
Support for Garage Door Openers has returned. To add a garage door opener, put a GarageDoorOpener entry in the accessories section of your config.json file along the lines of:

{"type":"GarageDoorOpener", "name":"myGarageDoor", "ref":648, "obstructionRef":649 },

where "ref": identifies the reference number of the HomeSeer device that controls the opening / closing of the garage door. This may be designated "Roll Up Door" in Homeseer, and
where "obstructionRef": identifies the obstruction sensor. This may be designated as "Barrier Sensor" in HomeSeer.

This has been tested with the GoControl/Liner GD00Z-4 garage door opener. I believe it will also work with the Aeotec garage door opener. If you have another Z-Wave opener and can't get that to work, please let me know in the "issues" section. Note that hte "Barrier Sensor" in the GoControl/Linear/Aeotec devices has an odd implementation - sometimes, its used to report whether the barrier (garage door) is obstructed, but at times it reports a "special" value (74) indicating its battery is low. The plugin doesn't distinguish between a battery warning or a true obsruction so if you see an alert (!) symbol  displayed on the HomeKit device icon, you should check on HomeSeer to determine if this is a battery issue or something else. Also, the fact that an obstruction is indicated in the iPhone Home act doesn't actually affect operation - your "real" door opener is what actually decides whether the door can be moved.


## B.3. *New in Version 2.1 -* Instant Status Update Feature - Check it out!
In addition to the new polling mechanism, described below, this version can also retrieve "Instant" status updates without polling. To enable this feature, you must enable HomeSeer's "Enable Control using ASCII commands" feature which can be accessed from the HomeSeer browers interface at [Tools menu] -> [Setup] -> [Network tab].  Its recommened that you leave the control port at the default setting of "11000".  The plugin will automatically attempt a connection to HomeSeer using the ASCII commands feature and, if that is not available, will then revert to using polling over the HTTP / JSON interface for status updates. Status messages displayed during startup will let you know if the Instant Status feature has been enabled.

When Instant Status is enbled, dimmer devices supporting the Last-Level feature (most Z-Wave Dimmers) will turn on to the last level they were at prior to being turned off rather than always turning on at 100%.

If Instant Status is enabled, polling is also reduced to once per minute. This shouldn't really be needed at all, but an occasionall poll is done out of caution to ensure that HomeBridge / HomeSeer remain properly synchronized.

## B.4 Version 2.x - What's Changed - New Features beyond Version 1.x
Version 2.x of this plugin uses a new polling mechanism in which all HomeSeer devices are polled in a single HTTP call rather than individual HTTP calls. This reduces the polling stress on HomeSeer and allows for much more frequent polling. A poll time of 5-10 seconds is recommended.

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

## C.2. Automatic uuid_base
* Default uuid_base for Accessories is now set to the string "Ref" plus the HomeSeer device reference number. This allows a consistent and predictable uuid_base across startups even if the HomeSeer device name changes. It is possible to use the same HomeSeer device reference for multiple HomeKit devices - if you are doing that, you should still manually specify the uuid_base to specify unique values for that group of devices.

  
## C.3. Certain config.json Settings No longer Needed
The jrhubott/homebridge-homeseer plugin included support for the specifying the following device configuration parameters in the config.json file: "onValues", "offValues", "LockSecuredValues", "LockUnsecuredValues", and "LockJammedValues." These configuration settings are no longer necessary and have no function in this HomeSeer plugin. Instead this plugin uses the standared Z-Wave values for these settings.  If a specific use case exist for implementing these settings (or if the plugin doesn't work without them for your Z-Wave device), please indicate that as an issue and I'll consider adding support in a future revision.

## C.4. Unsupported Devices
The jrhubott/homebridge-homeseer plugin included support for several device types that are not supported in this updated -2018 plugin. These types include:

* Battery (now added as a service to the other devices; no longer a separate device)
* Door (but you can still configure a Lock)
* Security System
* Thermostats (but Temperature Sensors can still be configured!)
* Window Coverings

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
