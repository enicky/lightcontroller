/**
 * Sensor.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  //  adapter: 'someMongodbServer',
    attributes: {
        deviceId: {type: 'integer'},
        sensorId: { type: 'integer'},
        internalid : {type : 'string'},
        type: {type: 'string'},
        deviceTypeString : {type : 'string'},
        counter_failed: {type: 'integer'},
        counter_retries: {type: 'integer'},
        counter_received: {type: 'integer'},
        counter_sent: {type: 'integer'},
        readings : {
            collection : "reading",
            via : 'sensor'
        }
    }
};

