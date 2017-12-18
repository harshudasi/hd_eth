/**
 * Created by sma
 */

var db = {};
var async = require('async');
var __logger = require('../logger');

db.mongo = require('./mongo');
db.redis = require('./redis');
db.mysql = require('./mysql');

console.log(db.redis);

db.initialize = function (__callback) {
    async.series(
        [
            // db.mongo.init,
            db.redis.init,
            db.mysql.init,
            db.mongo.init
        ],
        function (err, results) {
            if (err) {
                __logger.error('failed to run all databases', {err: err});
                __callback(err);
            } else {
                __callback(null);
            }
        }
    );
};


module.exports = db;
