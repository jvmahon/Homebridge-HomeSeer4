[![npm version](https://badge.fury.io/js/homebridge-homeseer-plugin-2018.svg)](https://badge.fury.io/js/homebridge-homeseer-plugin-2018)

# homebridge-homeseer-plugin-2018

This Version 2.0 plugin is still undergoing testing! See notes below regarding non-implemented features!

Note: This package is based on version 1.0.17 of the jrhubott/homebridge-homeseer plugin. 

## What's Changed - New Features
This version uses a new polling mechanism in which all HomeSeer devices are polled in a single HTTP call rather than individual HTTP calls. This reduces the polling stress on HomeSeer and allows for much more frequent polling. E.g., in testing, a 100 Z-Wave node system shows minimal load even with poll times as low as 5 seconds. Only the sysem polling time setting is used, individual polling settings are no longer needed. 

This plugin also changes the way in which device characteristics are updated. In particular, the brightness characteristic of dimmable lights is now updated on the Apple Home application in "real time" (well, on each poll), so you no longer need to refresh the screen in the Home application to see brighness changes that occur due to manual interactions with the Z-Wave switch or via HomeSeer.

Code architecture has been changed to use JavaScript native Promises for HTTP access. Required node version has been updated to Version 4.0 to ensure that Promises are implemetned.

## Unsupported Devices
This Plugin removes support for the following device types (Sorry, but I don't have these device types so I can't test them. Therefore, they have been removed):

* Battery (now added as a service to the other devices; no longer a separate device)
* Door (but you can still configure a Lock)
* Garage Door Opener
* Security System
* Thermostats (but Temperature Sensors can still be configured!)
* Window Coverings
  
## Certain config.json Settings No longer supported
Note that "onValues", "offValues", "LockSecuredValues", "LockUnsecuredValues", and "LockJammedValues" config.json settings are not implemented. Instead this plugin uses the standared Z-Wave values for these settings.  If a specific use case exist for implementing these settings (or if the plugin doesn't work without them for your Z-Wave device), please indicate that as an issue and support may be implemented in a future revision.

## Future Work
* Check if HomeSeer is running and can be accessed. Currently, ther is little clear warning to the user. Warn user and stop if HomeSeer is not running (or loop until HomeSeer becomes available)
* Add in additional data checking to ensure config.json settings match device type information retrieved from HomeSeer.
* Get device name from HomeSeer rather than manual input via config.json.
* Get device type from HomeSeer rather than manual input via config.json.
* Automatically identify devices by polling HomeSeer.

## Cautions
Extreme caution should be used when using this plugin with sensors and, in particular, any safety oriented sensors. This plugin does not provide real-time update to the sensor status and updates are delayed by at least the polling period. Sensor status should not be relied on for critical safety or security applications.

## Credits
This plugin is for use with [homebridge](https://github.com/nfarina/homebridge) Apple iOS Homekit support application to support integration with the [Homeseer V3](http://www.homeseer.com/home-control-software.html) software

Based on and includes code from [hap-nodejs](https://github.com/KhaosT/HAP-NodeJS) and [homebridge-legacy-plugins](https://github.com/nfarina/homebridge-legacy-plugins) and [homebridge-homeseer-plugin](https://github.com/jrhubott/homebridge-homeseer).

# Installation
Linux (Ubuntu/Debian based)

1. `sudo npm install homebridge -g`
2. `sudo npm install -g homebridge-homeseer--2018`

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
```

## All Accessories options
```js
"ref":8,                            // Required - HomeSeer Device Reference (To get it, select the HS Device - then Advanced Tab)
"type":"Lightbulb",                 // Required - Identifies a supported device type.
"name":"My Light",                  // Optional - HomeSeer device name is the default
"uuid_base":"SomeUniqueId2"         // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !


See [index.js](https://raw.githubusercontent.com/jrhubott/homebridge-homeseer/master/index.js) for full configuration information or [config.js](https://raw.githubusercontent.com/jrhubott/homebridge-homeseer/master/config/config.json) for sample configuration


#Credit
The original HomeBridge plugin that this was based on was done by Jean-Michel Joudrier and posted to the [Homeseer forums](http://board.homeseer.com/showthread.php?t=177016).
