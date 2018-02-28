[![npm version](https://badge.fury.io/js/homebridge-homeseer-plugin-2018.svg)](https://badge.fury.io/js/homebridge-homeseer-plugin-2018)

# homebridge-homeseer-plugin-2018

### New Installation and Setup Wiki pages - check the Wiki pages for instructions on Installing HomeBridge on Windows 10 - 64 Bit  and on enabling the Instant Status feature.

## *New in Version 2.1 -* Instant Status Update Feature - Check it out!
In addition to the new polling mechanism, described below, this version can also retrieve "Instant" status updates without polling. To enable this feature, you must enable HomeSeer's "Enable Control using ASCII commands" feature which can be accessed from the HomeSeer browers interface at [Tools menu] -> [Setup] -> [Network tab].  Its recommened that you leave the control port at the default setting of "11000".  The plugin will automatically attempt a connection to HomeSeer using the ASCII commands feature and, if that is not available, will then revert to using polling over the HTTP / JSON interface for status updates. Status messages displayed during startup will let you know if the Instant Status feature has been enabled.

When Instant Status is enbled, dimmer devices supporting the Last-Level feature (most Z-Wave Dimmers) will turn on to the last level they were at prior to being turned off rather than always turning on at 100%.

If Instant Status is enabled, polling is also reduced to once per minute. This shouldn't really be needed at all, but an occasionall poll is done out of caution to ensure that HomeBridge / HomeSeer remain properly synchronized.

## Version 2.x - What's Changed - New Features beyond Version 1.x
Version 2.x of this plugin uses a new polling mechanism in which all HomeSeer devices are polled in a single HTTP call rather than individual HTTP calls. This reduces the polling stress on HomeSeer and allows for much more frequent polling. E.g., in testing, a 100 Z-Wave node system shows minimal load even with poll times as low as 5 seconds. Only the sysem polling time setting is used, individual polling settings are no longer needed.

This plugin also changes the way in which device characteristics are updated. In particular, the brightness characteristic of dimmable lights is now updated on the Apple Home application in "real time" (well, on each poll), so you no longer need to refresh the screen in the Home application to see brighness changes that occur due to manual interactions with the Z-Wave switch or via HomeSeer.

Code architecture has been changed to use JavaScript native Promises for HTTP access. Required node version has been updated to Version 4.0 to ensure that Promises are implemented.

## Easier config.json setup!
* For some types of devices, the device type is now determined from information retrieved from HomeSeer if it hasn't been specified in the config.json file. Specifically, this plugin now looks at the "Device Type (String)" field obtained from HomeSeer to determine a mapping to a HomeKit device. The mappings are fairly simple and not all HomeKit devices are supported. Supported Mappings are:

  - "Z-Wave Switch Binary"        ->  "Switch"
  - "Z-Wave Switch Multilevel"    ->  "Lightbulb" 
  - "Z-Wave Door Lock"            ->  "Lock"
  - "Z-Wave Temperature"          ->  "TemperatureSensor"
  - "Z-Wave Water Leak Alarm"     ->  "LeakSensor"
  
  ** If you know of other mappings that can be included such as for the Fan, Outlet, MotionSensor, CarbonMonoxideSensor, CarbonDioxideSensor, ContactSensore, OccupancySensor, SmokeSensor, LightSensor, HumiditySensor types, please let me know and I'll include them

Note that a user can manually alter their HomeSeer Device type (String) so this mapping mechanism only works if the user hasn't touched it! A better approach may be to use the device type / subtype numbers returned from HomeSeer as those aren't subject to user-manipulation. However, I can't find documentation for those (so if anybody can point to the mappings using those numbers, I'll try to revise the code and base device type on those).

* Default uuid_base is now set to the string "Ref" plus the HomeSeer device reference number. This allows a consistent and predictable uuid_base across startups even if the HomeSeer device name changes. It is possible to use the same HomeSeer device reference for multiple HomeKit devices - if you are doing that, you should still manually specify the uuid_base to specify unique values for that group of devices.


## Unsupported Devices
The jrhubott/homebridge-homeseer plugin included support for several device types that are not supported in this updated -2018 plugin. These types include:

* Battery (now added as a service to the other devices; no longer a separate device)
* Door (but you can still configure a Lock)
* Garage Door Opener
* Security System
* Thermostats (but Temperature Sensors can still be configured!)
* Window Coverings

In order to allow continued use of these device types, I have implemented a slightly modified version of the original plugin which you can use in parallel with the -2018 plugin to support these devices. Of course, you won't get the instant-status updates and other features of the -2018 plugin, but you won't lose anything either. See the wiki entry "Using 'original' and 'new' Plugin in Parallel." (https://github.com/jvmahon/homebridge-homeseer/wiki/Using-'original'-and-'new'-Plugin-in-Parallel)]

I may add support for some of these devices in the future; however, I don't have a schedule for doing so and may not be able to do so unless someone wants to donate to me devices for testing and implementing the feature.
  
## Certain config.json Settings No longer supported
The jrhubott/homebridge-homeseer plugin included support for the specifying the following device configureation parameters in the config.json file: "onValues", "offValues", "LockSecuredValues", "LockUnsecuredValues", and "LockJammedValues." These configuration settings are no longer necessary and have no function in this HomeSeer plugin. Instead this plugin uses the standared Z-Wave values for these settings.  If a specific use case exist for implementing these settings (or if the plugin doesn't work without them for your Z-Wave device), please indicate that as an issue and I'll consider adding support in a future revision.

## Cautions
Extreme caution should be used when using this plugin with sensors and, in particular, any safety oriented sensors. This plugin does not provide real-time update to the sensor status and updates are delayed by at least the polling period. Sensor status should not be relied on for critical safety or security applications. This software is implimented for educational and experimental purposes,  is not of commercial quality, and has not undergone significant user testing. All use is at your own risk.

## Credits
This plugin is for use with [homebridge](https://github.com/nfarina/homebridge) Apple iOS Homekit support application to support integration with the [Homeseer V3](http://www.homeseer.com/home-control-software.html) software

Based on and includes code from [hap-nodejs](https://github.com/KhaosT/HAP-NodeJS) and [homebridge-legacy-plugins](https://github.com/nfarina/homebridge-legacy-plugins) and [homebridge-homeseer-plugin](https://github.com/jrhubott/homebridge-homeseer).

# Installation

See Wiki entries for Windows installation instrucitons.

Linux (Ubuntu/Debian based)

1. `sudo npm install -g homebridge`
2. `sudo npm install -g homebridge-homeseer-2018`

Windows

1. Follow [these](http://board.homeseer.com/showpost.php?p=1204012&postcount=250) instructions for homebridge Installation
2. Run `npm install homebridge-homeseer-2018` from the homebridge-homeseer directory

# Usage
## Platform options

```js
"platform": "HomeSeer",             // Required
"name": "HomeSeer",                 // Required
"host": "http://yourserver",        // Required - If you did setup HomeSeer authentication, use "http://user:password@ip_address:port"
"poll" : 10                         // Optional - Default polling rate in seconds to check for changed device status
"ASCIIPort":11000                   // Optional - Defaults to 11000. This is the TCP/IP Port for ASCII control interface. Used for Instant Status. Must match setting on "Tools" -> "Setup" -> "Network" tab of HomeSeer.
```

## All Accessories options
```js
"ref":8,                            // Required - HomeSeer Device Reference (To get it, select the HS Device - then Advanced Tab)
"type":"Lightbulb",                 // Required - Identifies a supported device type.
"name":"My Light",                  // Optional - HomeSeer device name is the default
"uuid_base":"SomeUniqueId2"         // Optional - HomeKit identifier will be derived from this parameter instead of the name. Defaults to the string "Ref" plus the HomeSeer Device Reference added on (e.g., "REF235")


See [index.js](https://raw.githubusercontent.com/jrhubott/homebridge-homeseer/master/index.js) for full configuration information or [config.js](https://raw.githubusercontent.com/jrhubott/homebridge-homeseer/master/config/config.json) for sample configuration


#Credit
The original HomeBridge plugin that this was based on was done by Jean-Michel Joudrier and posted to the [Homeseer forums](http://board.homeseer.com/showthread.php?t=177016).
