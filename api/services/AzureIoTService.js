var Protocol = require('azure-iot-device-mqtt').Mqtt;

var Client = require('azure-iot-device').Client;
var Message = require('azure-iot-device').Message;
var iothub = require('azure-iothub');
var uuid = require('uuid');


module.exports = {
  iotHubConnectionString: process.env.IOT_HUB_CONNECTIONSTRING,
  connectionString: '',
  client: null,
  switchLight: function (req, res) {
    var that = this;
    sails.log.verbose('[AzureIoTService:switchLight] Received method call for method \'' + req.methodName + '\'');

    // if there's a payload just do a default console log on it
    if (!!(req.payload)) {
      sails.log.verbose('[AzureIoTService:switchLight] Payload: ' + req.payload);
    }
    let requestObject = JSON.parse(req.payload);
    let hasToTurnOn = requestObject.status;
    let lampId = requestObject.lightId;

    sails.log.debug('[AzureIoTService:switchLight] Turn lamp ' + lampId + ' on ? ' + hasToTurnOn);
    var toReturn = {
      "success" : true
    };
    res.send(200, toReturn, function (err) {
      if (!!err) {
        sails.log.error('An error ocurred when sending a method response: ' + err.toString());
      } else {
        sails.log.verbose('Response to method \'' + req.methodName + '\' sent successfully.');
      }
    });
  },
  setWhiteColor : function(req, res){
    var that = this;
    let jsonObject = JSON.parse(req.payload);
    let hueId = jsonObject.lampId;
    let whiteColor = jsonObject.whiteColor;
    let brightness = jsonObject.brightness;

    HueService.setWhiteColor(hueId, whiteColor, brightness, function(){
      var toReturn = {
        "success" : true
      };
      res.send(200, toReturn, function (err) {
        if (!!err) {
          sails.log.error('An error ocurred when sending a method response: ' + err.toString());
        } else {
          sails.log.verbose('Response to method \'' + req.methodName + '\' sent successfully.');
        }
      });
    })
  },
  receivedMessage: function (msg) {
    var that = this;
    sails.log.debug('[AzureIoTService:receivedMessage] Id: ' + msg.messageId + ' Body: ' + msg.data);
    this.client.complete(msg, function printResult(err, res) {
      if (err) {
        console.log('[AzureIoTService:receivedMessage] error: ' + err.toString());
      } else {
        console.log('[AzureIoTService:receivedMessage] status: ' + res.constructor.name);
      }
    });
  },
  initialize: function (config, cb) {
    var that = this;
    sails.log.debug('[AzureIoTService:initialize] Check if IoTService is already configured or not');
    if (this.iotHubConnectionString == null) {
      sails.log.error('[AzureIoTService:initialize] No IOT Hub Connection string defined!!!');
      throw new Error('No connectionstring defined');
    }
    config.sails.models.settings.findOne({key : 'configured'}, function(err, value){
      if(err){
        sails.log.error('[AzureIoTService:initialize] Error retrieving COnfig value : ', 'configured');
        return;
      }
      let platform = process.platform;
      sails.log.debug('[AzureIoTService:initialize] platform : ', platform);
      if(!value || (value && value.value == 'false')){
        //not configured ...
        sails.log.debug('[AzureIoTService:initiaize] IoT Not yet configured... ');
        let serialToUse = "";
        if (platform == "linux") {
          var piinfo = require('piinfo');
          let piSerial = piinfo.serial();
          serialToUse = piSerial;
        } else if (platform == "darwin") {
          let seria = uuid();
          serialToUse = seria;
        } else if (platform == 'win32') {
          let serial = uuid();
          serialToUse = serial;
        }

        sails.log.debug('[AzureIoTService:initialize] serialToUse : ', serialToUse);
        let registry = iothub.Registry.fromConnectionString(that.iotHubConnectionString);
        let device = {
          deviceId: serialToUse
        }
        registry.create(device, function (err, deviceInfo, res) {
          if (err) sails.log.error('[AzureIoTService:initialize] Error Creating new device registry : ', err);
          if (res) sails.log.debug('[AzureIoTService:initialize] status: ' + res.statusCode + ' ' + res.statusMessage);
          if (deviceInfo) sails.log.debug('[AzureIoTService:initialize] device info: ' + JSON.stringify(deviceInfo));

          sails.log.debug('[AzureIoTService:initialize] Device Created ... ');
          ConfigService.setValue('configured', true, function(){
            ConfigService.setValue('deviceId', deviceInfo.deviceId, function(){
              ConfigService.setValue('primaryKey', deviceInfo.authentication.symmetricKey.primaryKey, function(){
                ConfigService.setValue('secondaryKey', deviceInfo.authentication.symmetricKey.secondaryKey, function(){
                  sails.log.debug('[AzureIoTService:initialize] Config Updated')
                  that.connectionString = 'HostName=' + process.env.IOT_HUB_CLIENT_SERVER + ';DeviceId=' + deviceInfo.deviceId + ';SharedAccessKey='
                    + deviceInfo.authentication.symmetricKey.primaryKey;
                  sails.log.info('[AzureIoTService:initialize] connectionString : ', that.connectionString);
                  ConfigService.setValue('connectionString', that.connectionString, function(){
                    that.client = Client.fromConnectionString(that.connectionString, Protocol);
                    that.initializeCallback(function(){
                      sails.log.debug('[AzureIoTService:initialize] Finished initialize');
                      if(cb) return cb();
                    })
                  });
                });

              });
            });
          });
        });
      }else{
        sails.log.debug('[AzureIoTService:initialize] Device already registered ... ');
        ConfigService.getValue('deviceId', function(err, deviceId){
          ConfigService.getValue('connectionString', function(err, connectionString){
            sails.log.debug('[AzureIoTService:Initialize] Connectionstring : ', connectionString.value);
            that.client = Client.fromConnectionString(connectionString.value, Protocol);
            sails.log.debug('[AZureIoTService:Initialize] cleint : ', this.client == null);
            that.initializeCallback(function(){
              sails.log.debug('[AzureIoTService:initialize] Finished initialize');
              if(cb) return cb();
            })
          });
        });
      }
    });
  },
  /**
   * Turn light on for a Hue Device
   * @param req
   * @param res
   */
  switchHueLight : function(req, res){
    var that = this;
    sails.log.verbose('[AzureIoTService:hueLightGetStatus] Received method call for method \'' + req.methodName + '\'');

    // if there's a payload just do a default console log on it
    if (!!(req.payload)) {
      sails.log.verbose('[AzureIoTService:hueLightGetStatus] Payload: ' + req.payload);
    }
    let jsonObject = JSON.parse(req.payload);
    var hueLampToGetStatusFrom = jsonObject.lampId;
    var targetStatus = jsonObject.status;
    HueService.switchLamp(hueLampToGetStatusFrom, targetStatus, function(){
      sails.log.debug('[AzureIoTService:hueLightGetStatus] Turn lamp ' + hueLampToGetStatusFrom + ' on ? ' + targetStatus);
      var toReturn = {
        "success" : true
      };
      res.send(200, toReturn, function (err) {
        if (!!err) {
          sails.log.error('An error ocurred when sending a method response: ' + err.toString());
        } else {
          sails.log.verbose('Response to method \'' + req.methodName + '\' sent successfully.');
        }
      });
    })

  },

  hueLightGetStatus : function(req, res){
    var that = this;
    sails.log.debug('[AzureIoTService:hueLightGetStatus] paylad : ', req.payload);
    var hueLampToGetStatusFrom = JSON.parse(req.payload).lampId;
    HueService.getLampStatus(hueLampToGetStatusFrom, function(err, status){
      var toReturn = {
        "success" : true,
        "status" : status
      };
      res.send(200, toReturn, function(err){
        if (!!err) {
          sails.log.error('An error ocurred when sending a method response: ' + err.toString());
        } else {
          sails.log.verbose('Response to method \'' + req.methodName + '\' sent successfully.');
        }
      })
    })
  },
  initializeCallback : function (cb) {
    var that= this;
    sails.log.debug('[AzureIoTService:initializeCallback] client config for azure finished');
    sails.log.debug('[AZureIoTService:Initialize] cleint : ', this.client == null);
    this.client.open(function (err) {
      if (err) {
        sails.log.error('[AzureIoTService:initializeCallback] error opening connection to Azure ', err);
      } else {
        sails.log.debug('[AzureIoTService:initializeCallback] Connected to IoT Service Hub');
        that.client.sendEvent(new Message("{'test':true}"), function (err) {
          if (err) {
            sails.log.error('[AzureIoTService:initializeCallback] error sending event : ', err);
          }
        });
        that.client.onDeviceMethod('switchLight', that.switchLight);
        that.client.onDeviceMethod('HUE_LIGHT_SWITCH',that.switchHueLight);
        that.client.onDeviceMethod('HUE_LIGHT_GET_STATUS', that.hueLightGetStatus);
        that.client.onDeviceMethod('LIGHTS_GET_ALL', that.getAllLightDescriptions);
        that.client.onDeviceMethod('HUE_LIGHT_SET_WHITE', that.setWhiteColor);
        that.client.on('message', that.receivedMessage);
        if(cb) return cb();
      }
    })
  },

  getAllLightDescriptions : function(req, res){
    var that = this;
    sails.log.debug('[AzureIoTService:hueLightGetStatus] paylad : ', req.payload);
    var hueLampToGetStatusFrom = JSON.parse(req.payload).lampId;
    HueService.getLampStatus(hueLampToGetStatusFrom, function(err, status){
      var toReturn = {
        "success" : true,
        "status" : status
      };
      res.send(200, toReturn, function(err){
        if (!!err) {
          sails.log.error('An error ocurred when sending a method response: ' + err.toString());
        } else {
          sails.log.verbose('Response to method \'' + req.methodName + '\' sent successfully.');
        }
      })
    })
  }
}
