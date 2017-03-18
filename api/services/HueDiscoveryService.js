/**
 * Created by NicholasE on 17/03/2017.
 */
var hue = require("node-hue-api");
var HueApi = hue.HueApi;
var  lightState = hue.lightState;

module.exports = {
  minutes : process.env.HUE_DISCO_TIMEOUT ? process.env.HUE_DISCO_TIMEOUT : 5,
  handleBridge : function(bridge, cb){
    HueBridge.findOne({id : bridge.id }).exec(function(err, foundBridge){
      if(!foundBridge ){
        var newBridge = {
          id : bridge.id,
          host : bridge.ipaddress
        }
        HueBridge.create(newBridge).exec(function(err, createdBridge){
          if(err){
            sails.log.error('[HueDiscoveryService:handleBridge] Error creating Brididge : ', err);
            throw err;
            return cb();
          }
          return cb();
        })
      }else{
        foundBridge.host = bridge.ipaddress;
        foundBridge.save(function(){
          return cb();
        })
      }
    })
  },
  registerDevices : function(bridge){
    var that = this;
    sails.log.verbose('[HueService.initialize] Found HueBridges : ', bridge);
    async.each(bridge, that.handleBridge, function(err){
      sails.log.verbose('[HueDiscoveryService:registerDevices] Done registering bridges ... ');
    });
  },
  discoverHue : function(){
    var that = this;
    sails.log.verbose('[HueDiscoveryService:discoverHue] Searching ... ');
    hue.nupnpSearch().then(that.registerDevices)
      .catch(function(err){
        sails.log.error('[HueDiscoveryService:discoverHue] Error search for hue ', err);
      })
      .done(function(){
        sails.log.verbose('[HueDiscoveryService:discoverHue] Done Searching ... ');
    });
  },
  handleRegisterLight : function(lamp, bridge, cb){
    HueService.findLamp(lamp.id, bridge.id, function(err, lampObject) {
      if(!lampObject){

        var newLamp = {
          hueId : lamp.id,
          name : lamp.name,
          bridgeId : bridge.id
        };
        HueService.createLamp(newLamp, function(){
          return cb();
        });
      }else{
        lampObject.name = lamp.name;
        bridgeId : bridge.id;
        HueService.saveLamp(lampObject, function(err){
          return cb();
        })
      }
    });

  },
  handleSearchLampOnBridge : function(bridge, cb){
    var that = this;
    ConfigService.getValue('HUE_USER_ID', function(err, hueUserObject){
      let userId = hueUserObject.value;
      let api = new HueApi(bridge.host, userId);
      api.lights().then(function(foundLights){
        foundLights.lights.forEach(function(lamp){
          that.handleRegisterLight(lamp, bridge, function(){
            sails.log.verbose('[HueDiscoveryService:handleSearchLampOnBridge] finished registration for lamp id : ', lamp.id);
          })
        })
        return foundLights;
      }).done(function(f){
        return cb();
      })
    });

  },
  discoverLamps : function(){
    var that = this;
    HueBridge.find({}).exec(function(err, hueBridges){
      async.each(hueBridges, that.handleSearchLampOnBridge, function(err){
        if(err){
          sails.log.error('[HueDiscoveryService:discoverLamps] done searching for lamps on bridges');
        }
      })
    });
  },
  discoverHueStuff : function(){
    var that = this;
    that.discoverHue();
    that.discoverLamps();
  },
  startDiscovery : function(cb){
    var that = this;
    let the_interval = this.minutes * 60 * 1000;
    that.discoverHue();
    that.discoverLamps();

    setInterval(that.discoverHueStuff, the_interval);
    return cb();
  },
  switchLamp : function(lampId, targetStatus,cb){
    HueLight.findOne({hueId : lampId}).exec(function(err, lamp){
      sails.log.verbose('lampId : ', lampId, lamp, err);
      HueBridge.findOne({_id: lamp.bridgeId}).exec(function(err, bridge){
        ConfigService.getValue('HUE_USER_ID', function(err, hueUserObject) {
          let userId = hueUserObject.value;
          let api = new HueApi(bridge.host, userId);
          let state = lightState.create();

          let lightStatus = targetStatus ?state.on() : state.off();

          api.setLightState(lampId, lightStatus).then(function(lampStatus){
            return lampStatus
          }).fail(function(err){
            sails.log.error('error setting status : ', err);
          })
            .done(function(lampStatus){
            return cb();
          })
        });
      })
    });
  },
  getLampStatus : function(lampId , cb){
    HueLight.findOne({hueId : lampId}).exec(function(err, lamp){
      sails.log.verbose('lampId : ', lampId, lamp, err);
      HueBridge.findOne({_id: lamp.bridgeId}).exec(function(err, bridge){
        ConfigService.getValue('HUE_USER_ID', function(err, hueUserObject) {
          let userId = hueUserObject.value;
          let api = new HueApi(bridge.host, userId);
          api.lightStatus(lampId).then(function(lampStatus){
            sails.log.debug('[HueDiscoveryService:getLampStatus] status : ', lampStatus);
            return lampStatus
          }).done(function(lampStatus){
            let isOn = lampStatus.state.on;
            return cb(err, isOn);
          })
        });
      })
    });
  }
}
