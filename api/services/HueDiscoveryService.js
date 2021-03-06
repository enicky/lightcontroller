/**
 * Created by NicholasE on 17/03/2017.
 */
var hue = require("node-hue-api");
var HueApi = hue.HueApi;
var  lightState = hue.lightState;

module.exports = {
  minutes : process.env.HUE_DISCO_TIMEOUT ? process.env.HUE_DISCO_TIMEOUT : 5,
  handleRegisterUser : function(host){
    var retryThread  = setInterval(function(){
      sails.log.debug('[HueDiscoveryService:handleRegisterUser] try to register ... ');
      var hueClient = new HueApi();

      hueClient.registerUser(host)
        .then(function( res ){
          sails.log.info('res : ', res);
          //HUE_USER_ID
          //9pycoC4xidpeoAJa7MWzVXMIN3JoJiEjRWc7kAiK
          ConfigService.setValue('HUE_USER_ID', res, function(){
            clearInterval(retryThread);
          })
        })
        .fail(function(err){
          sails.log.info('err : ', err);

        })
        .done();



    }, 10000);
  },
  handleBridge : function(bridge, cb){
    var that = this;
    HueBridge.findOne({id : bridge.id }).exec(function(err, foundBridge){
      sails.log.verbose('[HueDiscoveryService:handleBridge] Found Birdge : ', foundBridge);
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
          //handle user Registration
          that.handleRegisterUser(newBridge.host);
          return cb();
        })
      }else{
        foundBridge.host = bridge.ipaddress;
        sails.log.verbose('save bridge ...', foundBridge);
        foundBridge.save(function(err){
          sails.log.verbose('saved  bridge ... ', err);
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
    sails.log.info('[HueDiscoveryService:discoverHue] Searching ... ');
    hue.nupnpSearch().then(that.registerDevices)
      .catch(function(err){
        sails.log.error('[HueDiscoveryService:discoverHue] Error search for hue ', err);
      })
      .done(function(){
        sails.log.info('[HueDiscoveryService:discoverHue] Done Searching ... ');
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
      
      if(hueUserObject == null) return cb();
      let userId = hueUserObject.value;
      let api = new HueApi(bridge.host, userId);
      api.lights().then(function(foundLights){
        sails.log.info('[HueDiscoService:handleSearchLampOnBridge] Found lamps : ', foundLights);
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
    sails.log.info('[HueDiscoService:discoverLamps] ... ');
    HueBridge.find({}).exec(function(err, hueBridges){
      sails.log.debug('found huebridges : ', hueBridges, err);
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
    sails.log.info('start discoverLamps');
    that.discoverLamps();

    setInterval(that.discoverHueStuff, the_interval);
    return cb();
  },
  switchLamp : function(lampId, targetStatus,cb){
    HueLight.findOne({hueId : lampId.toString()}).exec(function(err, lamp){
      sails.log.debug('lampId : ', lampId, lamp, err);
      HueBridge.findOne({_id: lamp.bridgeId}).exec(function(err, bridge){
        ConfigService.getValue('HUE_USER_ID', function(err, hueUserObject) {
          let userId = hueUserObject.value;
          let api = new HueApi(bridge.host, userId);
          let state = lightState.create();

          let lightStatus = targetStatus ?state.on() : state.off();
          console.log('set lamp stat ... ', lightStatus);
          api.setLightState(lampId, lightStatus).then(function(lampStatus){
            console.log('lampsTTUS / 4', lampStatus);
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
  setWhiteColor : function(lampId, whiteColor, brightness, cb){
    HueLight.findOne({hueId : lampId.toString()}).exec(function(err, lamp){
      HueBridge.findOne({_id: lamp.bridgeId}).exec(function(err, bridge){
        ConfigService.getValue('HUE_USER_ID', function(err, hueUserObject) {
          let userId = hueUserObject.value;
          let api = new HueApi(bridge.host, userId);
          let state = lightState.create().on().white(whiteColor, brightness);

          api.setLightState(lampId, state).then(function(lampStatus){
            console.log('lampStatus : ', lampStatus);
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
    HueLight.findOne({hueId : lampId.toString()}).exec(function(err, lamp){
      sails.log.debug('lampId : ', lampId, lamp, err);
      HueBridge.findOne({_id: lamp.bridgeId}).exec(function(err, bridge){
        ConfigService.getValue('HUE_USER_ID', function(err, hueUserObject) {
          let userId = hueUserObject.value;
          let api = new HueApi(bridge.host, userId);
          api.lightStatus(lampId).then(function(lampStatus){
            sails.log.debug('[HueDiscoveryService:getLampStatus] status : ', lampStatus);
            return lampStatus
          }).done(function(lampStatus){
            let isOn = lampStatus.state.on;
            let isReachable = lampStatus.state.reachable;
            let toReturn = {
              isOn : isOn,
              isReachable : isReachable,
              color : {
                bri : lampStatus.state.bri,
                hue : lampStatus.state.hue,
                sat : lampStatus.state.sat,
                xy : lampStatus.state.xy,
                ct : lampStatus.state.ct
              }
            }
            return cb(err, toReturn);
          })
        });
      })
    });
  }
}
