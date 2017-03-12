/**
 * Reading.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {
        sensorId : {type : 'integer'},
        deviceId : {type : 'integer'},
        internalId : {type : 'string'},
        type : {type : 'integer'},
        deviceTypeString : {type : 'string'},
        value : {type : 'float'},
        sensor : {
            model : 'sensor'
        }
    },
    afterCreate : function(newlyInsertedRecord, cb){
        Sensor.findOne({internalid : newlyInsertedRecord.internalId}).exec(function(err, sensor){
            if(err){
                sails.log.error('[Reading:afterCreate] Error retrieving sensor informaton', err);
                return cb();
            }

            /*var rest = require('restler');

            var targetUrl = 'http://docker1.gitlab.be:8090/input/post.json?node=' + newlyInsertedRecord.deviceId+
                    //'&csv=' + newlyInsertedRecord.value +'&apikey=8eb4b8e6d986d1902f9a0788d8e21f60';
                '&json={' + sensor.deviceTypeString + ':' + newlyInsertedRecord.value +'}&apikey=8eb4b8e6d986d1902f9a0788d8e21f60';
            sails.log.debug('[Reading:afterCreate] targetUrl : ', targetUrl);
            rest.get(targetUrl).once('complete', function(data, response){
                sails.log.info('[Reading:afterCreate] => data : ', response.raw.toString('utf8'));
                //sails.log.info('[Reading:afterCreate] => response : ', response);
                return cb();
            })
            */
        })

    }
};

