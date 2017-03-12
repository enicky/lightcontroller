/**
 * Created by nicholase on 18/02/17.
 */

var fs = require('fs');
var path = require('path');

var nconf = require('nconf');

var isResinEnabled = process.env.ENABLED_RESIN;

module.exports = {
    targetConfigFilename : path.join(__dirname, 'config','azure.json'),
    targetConfigFolder : path.join(__dirname, 'config'),
    initialize : function(cb){
        if(isResinEnabled){
            this.targetConfigFilename = path.join('/data','azure.json');
        }
        if (!fs.existsSync(this.targetConfigFolder)){
            fs.mkdirSync(this.targetConfigFolder);
        }
        sails.log.debug('[ConfigService:initialize] Using targetConfigFilename : ', this.targetConfigFilename);
        nconf.file('azure', this.targetConfigFilename);
        return cb();
    },
    getValue : function(keyName, cb){
      sails.models.settings.findOne({key : keyName}).exec(function(err, result){
        if(err){
          sails.log.error('Error retrieving setting ... ' + keyName, err);
          return cb(err);
        }
        return cb(null, result);
      });
        //return nconf.get(keyName);
    },
    setValue : function(keyName, value, cb){
      sails.log.debug('[ConfigService:setValue] Setting Value "' + keyName + '" => "' + value + '"');
      sails.models.settings.findOne({key : keyName}).exec(function(err, found){
        sails.log.debug('[ConfigService:setValue] search finished for : ' + keyName + ' found => ', found, err);
        if(err){
          sails.log.error('Error finding ' + keyName + ' To Save or Update', err);
          throw "Error retrieving " + keyName;
        }
        if(found){
          found.value = value;
          found.save(function(err){
            sails.log.debug('[ConfigService:setValue] Updated ' + keyName + ' to value ' + value);
            return cb();
          })
        }else{
          sails.models.settings.create({
            key : keyName,
            value : value
          }).exec(function(err, createdValue){
            if(err){
              sails.log.error('Error creating Config Setting ' + keyName, err);
              return cb(err);
            }
            if(cb)return cb(null, createdValue);
          });
        }
      });

    }
}
