var types = require("../lib/HAP-NodeJS/accessories/types.js");
var httpSync = require('http-sync');

function Spark(log, config) {
  this.log = log;
  this.name = config["name"];
  this.token = config["access_token"];
  this.device = config["device_id"];
  this.hue = 0;
  this.saturation = 100;
  this.brightness = 100;
  this.speed = 170;
  this.animation = 0;
  this.animations = readAnimations(this);
}

function setColor(that, r, g, b) {
  var result = callFunction(that, 'setColor', r+","+g+","+b);
  console.log(result);
}

function animate(that, animation, brightness, speed) {
  var result = callFunction(that, 'animate', animation+","+brightness+","+speed);
  console.log(result);
}

function readAnimations(that) {
  return readVariable(that, 'animations').split(",");
}

function readVariable(that, variable) {
  var token = that.token;
  var device = that.device;
  var request = httpSync.request({
    method: 'GET',
    headers: {"Authorization": "Bearer "+token},
    body: '',
 
    protocol: 'https',
    host: 'api.spark.io',
    port: 443,
    path: '/v1/devices/'+device+'/'+variable
  });
  var response = request.end();
  var body = JSON.parse(response.body.toString());
  return body.result;
}

function callFunction(that, func, value) {
  var token = that.token;
  var device = that.device;
  var request = httpSync.request({
    method: 'POST',
    headers: {"Authorization": "Bearer "+token},
    body: value,
 
    protocol: 'https',
    host: 'api.spark.io',
    port: 443,
    path: '/v1/devices/'+device+'/'+func
  });
  var response = request.end();
  var body = JSON.parse(response.body.toString());
  return body;
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
    };
}

Spark.prototype = {

  setPowerState: function(powerOn) {

    var binaryState = powerOn ? "0,255,0" : "0,0,0";
    var that = this;
    
    this.log("Setting power state of " + this.name + " to " + powerOn);
    
    if (powerOn) {
      this.animation = 1;
      this.brightness = 100;
      this.speed = 200;
      animate(that, this.animation, 255, 200);
    } else {
      setColor(that, 0, 0, 0);
    }
  },

  setHueValue: function(value) {
    var that = this;

    this.log("Setting hue value to " + value);
    this.hue = value;

    rgb = HSVtoRGB(this.hue / 360, this.saturation / 100, this.brightness / 100);
    setColor(that, rgb.r, rgb.g, rgb.b);
  },

  setSaturationValue: function(value) {
    var that = this;

    this.log("Setting saturation value to " + value);
    this.saturation = value;

    rgb = HSVtoRGB(this.hue / 360, this.saturation / 100, this.brightness / 100);
    setColor(that, rgb.r, rgb.g, rgb.b);
  },

  setBrightnessLevel: function(value) {
    var that = this;
    
    this.log("Setting brightness level to " + value);
    this.brightness = value;
    
    rgb = HSVtoRGB(this.hue / 360, this.saturation / 100, this.brightness / 100);
    setColor(that, rgb.r, rgb.g, rgb.b);
  },

  setAnimation: function(value) {
    var that = this;
    
    this.log("Setting animation to " + value);
    this.animation = value;
    
    animate(that, this.animation, this.brightness, this.speed);
  },

  setSpeed: function(value) {
    var that = this;
    
    this.log("Setting speed to " + value);
    this.speed = value;
    
    animate(that, this.animation, this.brightness, this.speed);
  },

  getServices: function() {
    var that = this;
    return [{
      sType: types.ACCESSORY_INFORMATION_STYPE,
      characteristics: [{
        cType: types.NAME_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: this.name,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Name of the accessory",
        designedMaxLength: 255
      },{
        cType: types.MANUFACTURER_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "X10",
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Manufacturer",
        designedMaxLength: 255
      },{
        cType: types.MODEL_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "Rev-1",
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Model",
        designedMaxLength: 255
      },{
        cType: types.SERIAL_NUMBER_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "A1S2NASF88EW",
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "SN",
        designedMaxLength: 255
      },{
        cType: types.IDENTIFY_CTYPE,
        onUpdate: null,
        perms: ["pw"],
        format: "bool",
        initialValue: false,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Identify Accessory",
        designedMaxLength: 1
      }]
    },{
      sType: types.LIGHTBULB_STYPE,
      characteristics: [{
        cType: types.NAME_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: this.name,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Name of service",
        designedMaxLength: 255
      },{
        cType: types.POWER_STATE_CTYPE,
        onUpdate: function(value) { that.setPowerState(value); },
        perms: ["pw","pr","ev"],
        format: "bool",
        initialValue: false,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Change the power state of a Variable",
        designedMaxLength: 1
      },{
        cType: types.BRIGHTNESS_CTYPE,
        onUpdate: function(value) { that.setBrightnessLevel(value); },
        perms: ["pw","pr","ev"],
        format: "int",
        initialValue: 100,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Adjust Brightness of Light",
        designedMinValue: 0,
        designedMaxValue: 100,
        designedMinStep: 1,
        unit: "%"
      },{
        cType: types.HUE_CTYPE,
        onUpdate: function(value) { that.setHueValue(value); },
        perms: ["pw","pr","ev"],
        format: "int",
        initialValue: 0,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Adjust Hue of Light",
        designedMinValue: 0,
        designedMaxValue: 360,
        designedMinStep: 1,
        unit: "arcdegrees"
      },{
        cType: types.SATURATION_CTYPE,
        onUpdate: function(value) { that.setSaturationValue(value); },
        perms: ["pw","pr","ev"],
        format: "int",
        initialValue: 100,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Adjust Saturation of Light",
        designedMinValue: 0,
        designedMaxValue: 100,
        designedMinStep: 1,
        unit: "%"
      },{
        cType: "0000000A-0000-1000-8000-0026BB765291",
        onUpdate: function(value) { that.setAnimation(value); },
        perms: ["pw","pr","ev"],
        format: "int",
        initialValue: 0,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Set animation of Light",
        designedMinValue: 0,
        designedMaxValue: this.animations.length,
        designedMinStep: 1
      },{
        cType: "0000000B-0000-1000-8000-0026BB765291",
        onUpdate: function(value) { that.setSpeed(value); },
        perms: ["pw","pr","ev"],
        format: "int",
        initialValue: 170,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Set animation speed of Light",
        designedMinValue: 1,
        designedMaxValue: 200,
        designedMinStep: 1
      }]
    }];
  }
};

module.exports.accessory = Spark;
