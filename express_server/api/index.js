/**
 * Created by sma on 27/6/16.
 */


var express = require('express');
var router = express.Router();
var methods = require('../methods');

var __res = require('../response_handler');
var __logger = require('../../lib/logger');


router.get('/get_eth_address', function(req,res,next){
    methods.get_eth_address(req,res,next);
});

router.get('/get_hd_address', function(req,res,next){
    methods.get_hd_address(req,res,next);
});

router.post('/forward_eth', function(req,res,next){
    methods.forward_eth(req,res,next);
});



module.exports = router;