[![npm version](https://badge.fury.io/js/homebridge-homeseer-plugin.svg)](https://badge.fury.io/js/homebridge-homeseer-plugin)

# homebridge-homeseer-plugin

Plugin for the [homebridge](https://github.com/nfarina/homebridge) Apple iOS Homekit support application

Based on and includes code from [hap-nodejs](https://github.com/KhaosT/HAP-NodeJS)

# Usage
## Platform options

```js
"poll" : 60                 // Optional - Default polling rate in seconds to check for changed device status
```

## Accessories options
```js
"poll" : 60,                // Optional - Override default polling rate in seconds to check for changed device status
"statusUpdateCount" : 10    // Optional - Override the number of times that the device is checked for a status change after its value is updated. Checks occur every 1 second.
```