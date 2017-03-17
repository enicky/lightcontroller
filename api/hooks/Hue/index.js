/**
 * Created by NicholasE on 16/03/2017.
 */

module.exports = function HueHook(sails) {

  return {
    initialize : function(cb){
      sails.log.debug('[HueHook:initialize] Initializing Hue Hook');
      var hook = this;
      sails.on('hook:orm:loaded', function() {
        sails.log.debug('[HueHook:initialize] orm loaded ... ');
        HueService.initialize(function () {
          sails.log.debug('[HueHook:initialize] Done initializing HueService');
          return cb();
        })
      });
    }
  }
};
