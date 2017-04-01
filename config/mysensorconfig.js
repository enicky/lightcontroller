/**
 * Created by enicky on 11/11/2015.
 */
module.exports.mysensorconfig = {
    serialport: '/dev/ttyMySensorsGateway',
    enabled: true,
    mqtt : {
        enabled : true,
        server : process.env.MQTT_SERVER ? process.env.MQTT_SERVER :  '172.16.0.136',
        port : process.env.MQTT_PORT ? process.env.MQTT_PORT : 1883
    }
}
