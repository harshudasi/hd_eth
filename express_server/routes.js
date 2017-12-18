/**
 * Created by sma on 27/6/16.
 */


var serveStatic = require('serve-static');
var __config = require('../config');
var __logger = require('../lib/logger');
var __res = require('./response_handler');
var api = require('./api');


module.exports = function (app) {
    app.use('/' + __config.api_prefix + '/api', api);
    app.route('/*').get(function (req, res, next) {
        __logger.warn('got invalid request format', {remote_host: req.clientAddress, uri: req.url});
        new __res.ERROR().send(res);
    });
};