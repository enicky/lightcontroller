/**
 * Created by nicholase on 17/02/17.
 */
var sugar = require('sugar');

module.exports = function myAzureHook(sails) {

    return {
        startIotServiceProcess: function(cb){
            ConfigService.initialize(function(){
              AzureIoTService.initialize({
                sails : sails
              },function(){
                sails.log.debug('[AzureIotHook:startIotServiceProcess]Finished Init');
                return cb();
              });
            });
        },

        // Runs automatically when the hook initializes
        initialize: function (cb) {

            sails.log.debug('[AzureIotHook:initialize] Start init AzureHook');
            var hook = this;
          sails.on('hook:orm:loaded', function() {
            sails.log.debug('[AzureIoTHook:initialize] orm loaded ... ');
            // You must trigger `cb` so sails can continue loading.
            // If you pass in an error, sails will fail to load, and display your error on the console.

            hook.startIotServiceProcess(function () {
              sails.log.debug('[AzureIotHook:initialize] finished start AzureHook');
              return cb();
            });
          });
        }
    }
};
