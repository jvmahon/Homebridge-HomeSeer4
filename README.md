[![npm version](https://badge.fury.io/js/homebridge-homeseer4.svg)](https://badge.fury.io/js/homebridge-homeseer4)

# homebridge-homeseer4-plugin

[[Version History | Version History]]

## For the most up-to-date information, see: https://github.com/jvmahon/homebridge-homeseer4/

Information on github and in the wiki section may be more up-to-date than in the README file downloaded from 'npm'. Its strongly recommended that you check the github.com information (both the README and the wiki section) for up-to-date information and assistance.

## Posting Issues
Please don't post issues on the HomeSeer forums - while I occasionally check there, you will get a quicker response raising your issue in the "Issues" section of github at www.github.com/jvmahon/homebridge-homeseer4

## Overview

The homebridge-homeseer4-plugin is an open-source plugin for the homebridge environment. This plugin, when used with homebridge, acts as a bridge between Apple's HomeKit platform and HomeSeer 3  or HomeSeer 4 home automation software. The homebridge-homeseer-plugin supports common Z-Wave device including lights, switches, sensors, locks, and garage door openers. 

Version 1.x.x has the same features on both  "HomeSeer 4" and "HomeSeer 3."  As HomeSeer 4 develops, additional HomeSeer 4 features may be added.

## Migrating from homebridge-homeseer-plugin-2018
* This is a placeholder for tips on migrating from the prior version.
* Generally, you should not have to do much to migrate.
* There are several no-longer-used parameters that you should delete from config.json. See section B.3 below.
* You must add login / password information. See B.1, below.


## A. Installation and Setup Wiki Pages 
Please see the Wiki pages for instructions on Installing HomeBridge on Windows 10 and Linux. Really - look there first: https://github.com/jvmahon/homebridge-homeseer4/wiki.

If you have problems getting the plugin to work, I will try to help, but please reveiw this entire ReadMe page and review the Wiki pages concerning installation on Windows and Linux before asking for assistance (if you're problem is something I've seen before, I will try and document its solution in the Wiki) and, if you get specific error messagesa and the solution isn't in the Wiki, try a few google searches for the error messages to see if there are known solutions.

## B. Clean Up Your Config.JSON / New config.json setup
This plugin depends on you properly setting up a "config.json" file which identifies the HomeSeer devices that you want to appear in the iOS Home application. Instructions for setting that up are found in the Wiki at 
https://github.com/jvmahon/Homebridge-HomeSeer4/wiki/Setting-Up-Your-Config.json-file.

### B.1 Add Login Information

If you are updating from the HomeSeer 3 version of this plugin ("HomeBridge-HomeSeer-Plugin-2018"), there have been several changes that you will need to make to your config.json file. Most importantly, you will need to add your HomeSeer login and password information to the config.json file. 

### B.2 Changed Thermostat Setup

Note the changes made for setting up Thermostats -- you can now simply identify them by their "root" device and the plugin will query HomeSeer to find the other parameters needed for setup.

### B.3 Remove Unused Parameters

A number of configuration settings are no longer used (the plugin has been updated to automatically detect the proper parameters). Please remove the following configuration parameters from your config.json file (if you used them):
`````
"temperatureUnit"
"uses99Percent"
"can_dim"
"binarySwitch"
"obstructionRef"
"obstructionClearValues"
`````
### B.4 Simplified Identification and Setup of Accessories

This update includes a new simplified method of identifying which HomeSeer devices should apear as HomeKit accessories

https://github.com/jvmahon/Homebridge-HomeSeer4/wiki/Setting-Up-Your-Config.json-file


##  C. Installation

If you used a prior HomeSeer plugin, you must remove it before installing this plugin

You can get a full listing of your homebridge plugins using:
`````
npm -g list --depth=0
`````
And then uninstall any old versions using, e.g.:
`````
  npm -g uninstall homebridge-homeseer
  
  npm -g uninstall homebridge-homeseer-plugin-2018
`````
  
 
## D. Cautions
Extreme caution should be used when using this plugin with sensors and, in particular, any safety oriented sensors. Z-Wave sensors can be particulalry tricky as the sensor may be configured to report its status using Basic Set or Notification Class reports and the HomeSeer interface does not make clear which is being used. You should always test a sensor after setting it up to make sure it works. E.g., if you set up a leak sensor, wet it after setting it up and make sure the plugin is reporting properly.

This plugin may not provide real-time update to the sensor status and updates can be delayed due to polling delays or update failurs. Sensor status should not be relied on for critical safety or security applications. This software is implimented for educational and experimental purposes,  is not of commercial quality, and has not undergone significant user testing. All use is at your own risk.

## E. Credits
This plugin is for use with [homebridge](https://github.com/nfarina/homebridge) Apple iOS Homekit support application to support integration with the HomeSeer 3 and [Homeseer V4](http://www.homeseer.com/home-control-software.html) software

