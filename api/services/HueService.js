/**
 * Created by NicholasE on 16/03/2017.
 */
var hue = require("node-hue-api");
var HueApi = hue.HueApi;

module.exports = {
  userDescription : process.env.HUE_USER_DESCRIPTION ? process.env.HUE_USER_DESCRIPTION : 'Hue Device',
  displayUserResult : function(result){
    sails.log.debug('[HueService:displayUserResult] result : ', result);
    ConfigService.setValue('HUE_USER_ID', result);
  },
  displayResult : function(result){
    sails.log.debug('[HueService:displayResult] result : ', result);
    let lights = result.lights['1'];
    sails.log.debug('', lights);

  },
  displayError : function(err){
    sails.log.error('[HueService:displayError] ', err);
  },
  saveLamp : function(lampObject, cb){
    lampObject.save(function(err){
      return cb(err);
    })
  },
  createLamp : function(newLamp, cb){
    HueLight.create(newLamp).exec(function(err, created){
      return cb(err, created);
    })
  },
  findLamp : function(lampId, bridgeId, cb){
    HueLight.findOne({hueId : lampId, bridgeId : bridgeId}).then(function(lamp){
      if(lamp){
        return cb(null, lamp);
      }
      return cb(null,null);
    })
  },
  getLampStatus : function(hueLampToGetStatusFrom, cb){
    sails.log.verbose('[HueService:getLampStatus] id ; ', hueLampToGetStatusFrom);
    HueDiscoveryService.getLampStatus(hueLampToGetStatusFrom, cb);
  },
  switchLamp : function(hueLampToGetStatusFrom, targetStatus,cb){
    HueDiscoveryService.switchLamp(hueLampToGetStatusFrom, targetStatus, cb);
  },
  initialize : function(cb){
    var that = this;
    HueDiscoveryService.startDiscovery(function(){
      return cb();
    });
  }
}
