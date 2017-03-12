/**
 * Created by enicky on 4/11/2015.
 */

var sugar = require('sugar');
module.exports = function mySimpleHook(sails) {

    return {
        startMySensorsProcess: function(){
            MySensorService.initializeMySensors({
                sails : sails
            }, function(){

            });
        },

        // Runs automatically when the hook initializes
        initialize: function (cb) {
            sails.log.debug('[MySensorsHook:initialize] Start init hook');
            var hook = this;

            // You must trigger `cb` so sails can continue loading.
            // If you pass in an error, sails will fail to load, and display your error on the console.

            hook.startMySensorsProcess();
            sails.log.debug('[MySensorsHook:initialze] finished start hook');
            return cb();
        }
    }
};
