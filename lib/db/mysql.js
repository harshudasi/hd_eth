var lib_mysql = {};
var mysql = require('mysql');
var config = require('../../config');
var __logger = require('../../lib/logger');

lib_mysql.init = function (__callback) {
    var __m = 'lib_mysql.init';
    if (!config.mysql.init) {
        lib_mysql.conn = null;
        __callback(null);
        return;
    }
    var pool = mysql.createPool({
        connectionLimit: config.mysql.options.connection_limit,
        // host: config.mysql.options.host,
        // user: config.mysql.options.user,
        // password: config.mysql.options.password,
        // database: config.mysql.options.database
        host: '127.0.0.1',
        user: 'root',
        password: 'a',
        database: 'eth_auxpay'
    });
    setTimeout(function () {
        __logger.info('connecting with mysql', {method: __m, host: config.mysql.options.host});
        pool.getConnection(function (err, connection) {
            if (err) {
                __logger.error('connection failed with mysql', {method: __m, host: config.mysql.options.host,err:err});
                __callback({message: 'mysql connection failed', err: err, mysql: config.mysql});
            }
            else {
                __logger.info('connection established with mysql', {method: __m, host: config.mysql.options.host});
                connection.release();
                lib_mysql.conn = pool;
                __callback(null);
            }
        });
    }, 1000);
};
lib_mysql.init_sms_dlr = function (__callback) {
    var __m = 'lib_mysql.init_sms_dlr';
    if (!config.mysql_sms_dlr.init) {
        lib_mysql.conn_sms_dlr = null;
        __callback(null);
        return;
    }
    var pool = mysql.createPool({
        connectionLimit: config.mysql_sms_dlr.options.connection_limit,
        host: config.mysql_sms_dlr.options.host,
        user: config.mysql_sms_dlr.options.user,
        password: config.mysql_sms_dlr.options.password,
        database: config.mysql_sms_dlr.options.database
    });
    setTimeout(function () {
        __logger.info('connecting with mysql', {method: __m, host: config.mysql_sms_dlr.options.host});
        pool.getConnection(function (err, connection) {
            if (err) {
                __logger.error('connection failed with mysql', {method: __m, host: config.mysql_sms_dlr.options.host});
                __callback({message: 'mysql connection failed', err: err, mysql: config.mysql_sms_dlr});
            }
            else {
                __logger.info('connection established with mysql', {method: __m, host: config.mysql_sms_dlr.options.host});
                connection.release();
                lib_mysql.conn_sms_dlr = pool;
                __callback(null);
            }
        });
    }, 1000);
};
lib_mysql.__find = function(table_name,find_params,__cb){
    __logger.debug('mysql.__find, request', {db: 'mysql', table:table_name, params: find_params});
    if(lib_mysql.conn){
        var find_query = "SELECT * FROM " + table_name + " WHERE "
        for(var key in find_params){
            find_query += " " + key + " = '" + find_params[key] + "' AND "
        }
        find_query = find_query.substring(0,find_query.length - 4);
        lib_mysql.conn.query(find_query,function(err,result){
            if(err){
                __logger.error('lib_musql.__find, failed', {db: 'mysql', table: table_name, params: find_params});
                __cb(err, null);
            }
            else{
                __logger.debug('lib_musql.__find, success', {db: 'mysql', table: table_name, params: find_params});
                __cb(null, result);
            }
        });
        // console.log('find query is::: ' , find_query);
    }
    else {
        __logger.error('lib_musql.__find, error connecting mysqldb:');
        __cb(new Error('not connected'));
    }
}
lib_mysql.__insert = function(table_name,insert_params,__cb){
    __logger.debug('mysql.__insert, request', {db: 'mysql', table:table_name, params: insert_params});
    if(lib_mysql.conn){
        var insert_query = "INSERT INTO " + table_name + " (";
        for(var key in insert_params){
            insert_query += key + ',';
        }
        insert_query = insert_query.substring(0,insert_query.length - 1);
        insert_query += ") VALUES (";
        for(var key in insert_params){
            insert_query += "'" + insert_params[key] + "',";
        }
        insert_query = insert_query.substring(0,insert_query.length - 1);
        insert_query += ")";
        console.log('insert_query is::: ', insert_query);
        lib_mysql.conn.query(insert_query,function(err,result){
            if(err){
                __logger.error('lib_musql.__insert, failed', {db: 'mysql', table: table_name, params: insert_params});
                __cb(err, null);
            }
            else{
                __logger.debug('lib_musql.__insert, success', {db: 'mysql', table: table_name, params: insert_params});
                __cb(null, result);
            }
        });
        // console.log('find query is::: ' , find_query);
    }
    else {
        __logger.error('lib_musql.__find, error connecting mysqldb:');
        __cb(new Error('not connected'));
    }
}
lib_mysql.__increment = function(table_name,find_params,incr_params,__cb){
    __logger.debug('mysql__incremeny, request',{db:'mysql',table:table_name,find_params:find_params,incr_params:incr_params});
    var find_query = "SELECT * FROM " + table_name + " WHERE ";
    for(var key in find_params){
        find_query += " " + key + " = '" + find_params[key] + "' AND "
    }
    find_query = find_query.substring(0,find_query.length - 4);
    lib_mysql.conn.query(find_query,function(err,res){
        if(err){
            __logger.error('lib_musql.__find, failed', {db: 'mysql', table: table_name, params: find_params});
            __cb(err, null);
        }
        else{
            __logger.debug('lib_musql.__find, success', {db: 'mysql', table: table_name, params: find_params});
            var confirmations = (parseInt(res[0]['conformations']) + 1).toString();
            var update_query = "UPDATE " + table_name + " SET " + incr_params + " = " + confirmations + " WHERE txid = '" + find_params['txid'] + "'";
            __logger.debug('update quey is:::: ',update_query);
            lib_mysql.conn.query(update_query,function(err,res){
                if(err){
                     __logger.error('lib_musql.__increment, failed', {db: 'mysql', table: table_name, params: find_params},' ERROR is:::: ',err);
                    __cb(err, null);
                }
                else{
                    __logger.debug('lib_musql.__increment, success', {db: 'mysql', table: table_name, params: find_params},'res is:::: ',res);
                    __cb(null,res);
                }
            })
        }
    })
}
module.exports = lib_mysql;
