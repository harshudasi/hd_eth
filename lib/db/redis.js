/**
 * Created by sma
 */
var lib_redis = {};
var redis = require('redis');
var __config = require('../../config');
var __logger = require('../../lib/logger');
var redis_client = null;

lib_redis.init = function (cb) {
    if (!__config.redis.init) {
        lib_redis.conn = null;
        cb(null, null);
        return;
    }
    __logger.debug('lib_redis.init, initializing redis connection ', {port: __config.redis.port, host: __config.redis.host});
    redis_client = redis.createClient(__config.redis.port, __config.redis.host, {});
    redis_client.on("error", function (err) {
        __logger.error('lib_redis.init, error in redis connection ', {port: __config.redis.port, host: __config.redis.host});
        lib_redis.conn = null;
        cb(err, null);
    });
    redis_client.on("connect", function () {
        __logger.info('lib_redis.init, success redis connection ', {port: __config.redis.port, host: __config.redis.host});
        lib_redis.conn = redis_client;
        cb(null, redis_client);
    });
};

lib_redis.add_json = function (key, value, __callback) {
    if (lib_redis.conn) {
        lib_redis.conn.set(key, value,function(err,res){
            console.log('kkk',err,res);
            if(err){
                __callback(err);
            }
            else{
                __callback(null,res);
            }
        });

    }
    else {
            __callback(new Error('redis connection failed'));
    }
};
lib_redis.get_json = function (key, __callback) {
    if (lib_redis.conn) {
        lib_redis.conn.hgetall(key, function (err, json_object) {
            if (err) {
                __callback(err);
            }
            else {
                __callback(null, json_object);
            }
        });
    }
    else {
        __callback(new Error('redis connection failed'));
    }
};
lib_redis.update_json = function (key, value, __callback) {
    if (lib_redis.conn) {
        lib_redis.conn.exists(key, function (err, result) {
            if (err) {
                if (__callback)
                    __callback(1);
            }
            else if (result === 0) {
                if (__callback)
                    __callback(1);
            }
            else {
                lib_redis.conn.hmset(key, value);
                if (__callback)
                    __callback(null);
            }
        });


    }
    else {
        if (__callback)
            __callback(new Error('redis connection failed'));
    }
};


lib_redis.set_token = function (key, value, __callback) {
    if (lib_redis.conn) {
        lib_redis.conn.setex(key, 30, value);
        if (__callback)
            __callback(null);
    }
    else {
        if (__callback)
            __callback(new Error('redis connection failed'));
    }
};
lib_redis.add_to_set = function(key, value, __callback){
    if(lib_redis.conn){
        lib_redis.conn.sadd(key,value);
        if(__callback)
            __callback(null);
    }
    else{
        if(__callback)
            __callback(new Error('redis connection failed'));
    }
};
lib_redis.set_jwt = function (key, value, __callback) {
    if (lib_redis.conn) {
        lib_redis.conn.setex(key, 3600, value);
        if (__callback)
            __callback(null);
    }
    else {
        if (__callback)
            __callback(new Error('redis connection failed'));
    }
};
lib_redis.check_token = function (key, __callback) {
    if (lib_redis.conn) {
        lib_redis.conn.get(key, function (err, json_object) {
            console.log('12121212',err,json_object);
            if (err) {
                __callback(err);
            }
            else {
                __callback(null, json_object);
            }
        });
    }
    else {
        __callback(new Error('redis connection failed'));
    }
};
lib_redis.__find_in_set = function(set,key,__callback){
    if(lib_redis.conn){
        __logger.info('finding key::: ', key, ' in set::: ', set );
        lib_redis.conn.sismember(set,key,function(err,result){
            __logger.info('sismember err,result::: ',err,result);
            if(err){
                __callback(err);
            }
            else{
                __callback(null,result);
            }
        });
    }
    else{
        __callback(new Error('redis connection failed'));
    }
}
lib_redis.__get_all_elements_in_set = function(set,__callback){
    if(lib_redis.conn){
        
        lib_redis.conn.smembers(set,function(err,res){
            // console.log('aaaa',err,res);
            if(err){
                __callback(err);
            }
            else{
                __logger.info('getting all elements of set::: ', set);
                __callback(null,res);
            }
        })
    }
    else{
        __callback(new Error('redis connection failed'));
    }
};
lib_redis.__remove_from_set = function(set,key,__callback){
    if(lib_redis.conn){
        __logger.info('delete element from set::: ',key,set);
        lib_redis.conn.srem(set,key,function(err,res){
            if(err){
                __callback(err);;
            }
            else{
                __callback(null,res);
            }
        })
    }
    else{
        __callback(new Error('redis connection failed'));
    }
}
lib_redis.__move_to_set = function(set1,set2,key,__callback){
    if(lib_redis.conn){
        __logger.info('moving key:: ', key,' from set:: ', set1,' to set: ',set2);
        lib_redis.conn.smove(set1,set2,key,function(err,res){
            if(err){
                __callback(err);
            }
            else{
                __logger.debug('successfully moved ', key,' to ', set2,' response is::::: ',res);
                __callback(null,res);
            }
        });
    }
    else{
        __callback(new Error('redis connection failed'));
    }
};
lib_redis.__incr = function(key,__callback){
    if(lib_redis.conn){
        __logger.info('incrementing key::: ', key);
        lib_redis.conn.incr(key,function(err,res){
            if(err){
                __callback(err);
            }
            else{
                __callback(null,res);
            }
        })
    }
    else{
        __callback(new Error('redis connection failed'));
    }
}
module.exports = lib_redis;
