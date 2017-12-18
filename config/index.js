/**
 * Created by sma on 26/6/16.
 */
var _ = require('lodash');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var app_name = "eth_auxpay";
var db_name = app_name;
var all = {
    env: process.env.NODE_ENV,
    path: __dirname,
    app_name: app_name,
    api_prefix: "eth_auxpay",
    base_url: "http://localhost:8000/",
    port: 8005,
    socket_io_port: 8006,
    default_server_response_timeout: 60000,
    logging: {
        log_file: '/var/log/node_apps/',
        console: true,
        json: false,
        level: 'silly', //[silly,debug,verbose,info,warn,error]
        datePattern: 'yyyy-MM-dd',//log rotation
        maxsize: 104857600, //log rotates after specified size of file in bytes
        colorize: 'true',
        mongo: {
            host: "mdb.phnapp.com",
            db: "phnapp",
            port: 27017,
            username: 'admin',
            password: 'inf0viv@',
            enabled: false
        }
    },
    mongo: {
        init: true,
        uri: 'mongodb://localhost/',
        options: {
            db: {native_parser: true},
            server: {poolSize: 5},
            user: 'dev',
            pass: 'dev'
        }
    },
    redis: {
        init: true,
        host: "localhost",
        db: "0",
        port: 6379
    },
    mysql: {
        init: true,
        options: {
            connection_limit: 10,
            host: 'localhost',
            user: 'root',
            password: 'a',
            database: 'eth_auxpay'
        }
    },

    app_settings: {
    }
};

all = _.merge(all, require('./' + process.env.NODE_ENV + '.js') || {});

all.logging.log_file += app_name;
all.mongo.uri += db_name;

module.exports = all;