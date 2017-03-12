/**
 * Created by enicky on 11/11/2015.
 */
module.exports.mysensorconfig = {
    serialport: '/dev/ttyMySensorsGateway',
    enabled: true,
    mqtt : {
        enabled : true,
        server : '172.16.0.136',
        port : 1883
    }
}