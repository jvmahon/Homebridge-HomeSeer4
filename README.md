[![npm version](https://badge.fury.io/js/homebridge-homeseer4-plugin.svg)](https://badge.fury.io/js/homebridge-homeseer4-plugin)

# homebridge-homeseer4-plugin

This is still a "work in progress."  An 'official' release has not yet been posted to npmjs.

## For the most up-to-date information, see: https://github.com/jvmahon/homebridge-homeseer4/

Information on github and in the wiki section may be more up-to-date than in the README file downloaded from 'npm'. Its strongly recommended that you check the github.com information (both the README and the wiki section) for up-to-date information and assistance.

## Overview

The homebridge-homeseer4-plugin is an open-source plugin for the homebridge environment. This plugin, when used with homebridge, acts as a bridge between Apple's HomeKit platform and HomeSeer home automation software. The homebridge-homeseer-plugin supports common Z-Wave device including lights, switches, sensors, locks, and garage door openers. 

Though the plugin references "HomeSeer 4", it is also compatible with "HomeSeer 3."

## A. Installation and Setup Wiki Pages 
Please see the Wiki pages for instructions on Installing HomeBridge on Windows 10 and Linux. Really - look there first: https://github.com/jvmahon/homebridge-homeseer4/wiki.

If you have problems getting the plugin to work, I will try to help, but please reveiw this entire ReadMe page and review the Wiki pages concerning installation on Windows and Linux before asking for assistance (if you're problem is something I've seen before, I will try and document its solution in the Wiki) and, if you get specific error messagesa and the solution isn't in the Wiki, try a few google searches for the error messages to see if there are known solutions.

## B. New Config.JSON setup
This plugin depends on you properly setting up a "config.json" file which identifies the HomeSeer devices that you want to appear in the iOS Home application. Instructions for setting that up are found in the Wiki.

If you are updating from the HomeSeer 3 version of this plugin ("HomeBridge-HomeSeer-Plugin-2018"), there have been several changes that you will need to make to your config.json file. Most importantly, you will need to add your HomeSeer login and password information to the config.json file. Also note the changes made for setting up Thermostats -- you can now simply identify them by their "root" device and the plugin will query HomeSeer to find the other parameters needed for setup.

##  C. Installation

If you used a prior HomeSeer plugin, you must remove it before installing this plugin using, e.g.,:

  npm -g uninstall homebridge-homeseer
  
  npm -g uninstall homebridge-homeseer-plugin-2018
  
 
## D. Cautions
Extreme caution should be used when using this plugin with sensors and, in particular, any safety oriented sensors. This plugin may not provide real-time update to the sensor status and updates can be delayed due to polling delays or update failurs. Sensor status should not be relied on for critical safety or security applications. This software is implimented for educational and experimental purposes,  is not of commercial quality, and has not undergone significant user testing. All use is at your own risk.

## E. Credits
This plugin is for use with [homebridge](https://github.com/nfarina/homebridge) Apple iOS Homekit support application to support integration with the [Homeseer V4](http://www.homeseer.com/home-control-software.html) software

Based on and includes code from [hap-nodejs](https://github.com/KhaosT/HAP-NodeJS)
