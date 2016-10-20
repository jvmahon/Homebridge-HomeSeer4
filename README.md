[![npm version](https://badge.fury.io/js/homebridge-homeseer-plugin.svg)](https://badge.fury.io/js/homebridge-homeseer-plugin)

# homebridge-homeseer-plugin

Plugin for the [homebridge](https://github.com/nfarina/homebridge) Apple iOS Homekit support application

Based on and includes code from [hap-nodejs](https://github.com/KhaosT/HAP-NodeJS) and [homebridge-legacy-plugins](https://github.com/nfarina/homebridge-legacy-plugins)

# Usage
## Platform options

```js
"platform": "HomeSeer",             // Required
"name": "HomeSeer",                 // Required
"host": "http://yourserver",        // Required - If you did setup HomeSeer authentication, use "http://user:password@ip_address:port"
"poll" : 60                         // Optional - Default polling rate in seconds to check for changed device status
```

## All Accessories options
```js
"ref":8,                        // Required - HomeSeer Device Reference (To get it, select the HS Device - then Advanced Tab) 
"type":"Lightbulb",             // Optional - Lightbulb is the default
"name":"My Light",              // Optional - HomeSeer device name is the default
"uuid_base":"SomeUniqueId2"     // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !
"poll" : 60,                        // Optional - Override default polling rate in seconds to check for changed device status
"statusUpdateCount" : 10            // Optional - Override the number of times that the device is checked for a status change after its value is updated. Checks occur every 1 second.
```
See [index.js](https://raw.githubusercontent.com/jrhubott/homebridge-homeseer/master/index.js) for full configuration information or [config.js](https://raw.githubusercontent.com/jrhubott/homebridge-homeseer/master/config/config.json) for sample configuration
