const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const ethers = require("ethers");
var request = require('request');
var moment = require('moment');
var _config = require('../config');
var db = require('../lib/db');
var __logger = require('../lib/logger');
var __res = require('../express_server/response_handler');
// var sleep = require('sleep');
// var uuid = require('uuid/v4');
var jwt = require('jsonwebtoken');
var secureRandom = require('secure-random');

// var web3 = new Web3( new Web3.providers.HttpProvider('http://138.197.111.208:7007'));
var web3 = new Web3( new Web3.providers.HttpProvider('http://localhost:8545'));
console.log('connection status:::: ',web3.isConnected());
console.log('no of blocks:: ',web3.eth.blockNumber);
console.log('no of peers:: ',web3.net.peerCount);
console.log('accounts::: ',web3.eth.accounts);
db.initialize(function (err) {
	console.log('aaaa');
    if (err) {
    	console.log('eeee',err);
        // process.exit(1);
    }
    else {
        __logger.info('started all databases');
        setInterval(watcher,7000);
    }
});


function watcher(){
	__logger.debug('starting mempool script');
	var txpool = web3.eth.getBlock("pending",true);
	// console.log('txpool::: ',txpool);
	var transactions_list = txpool['transactions'];
	// console.log('ttttttttt ',transactions_list);
	transactions_list.forEach(function(txid){
		var tx_hash = txid['hash'];
		var value = txid['value'];
		__logger.info('crawling transaction::::: ',tx_hash);
		console.log('tttttt ',tx_hash);
		db.redis.__find_in_set('eth_vmp_set',tx_hash,function(err,res){
			console.log('pppaaaaa', res);
			if(err){
				__logger.error('error in redis conn:::: ', err);
			}
			else{
				if(res == 0){					
					var receipient = txid['to'];
					var sender = txid['from'];
					__logger.info('receipient addresses fo transaction::: ',tx_hash, 'is::: ',receipient);
					db.redis.__find_in_set('eth_aw_set',receipient,function(err,res){
						console.log('qwqwqw',err,res);
						if(err){
							__logger.error('error in redis conn:::: ', err);
						}
						else{
							if(res == 1){
								__logger.debug('address match:::: ', receipient);
								db.redis.add_to_set('eth_zct_set',tx_hash,function(err,res){
									if(err){
										__logger.error('error in redis conn::: ');
									}
									else{
										var insert_dict = {
											'flag':'incoming',
											'from_address':sender,
											'to_address':receipient,
											'txid':tx_hash,
											'conformations':'0',
											'value':value,
											'timestamp':Math.floor(new Date() / 1000).toString()
										}
										db.mysql.__insert('transaction_details',insert_dict,function(err,res){
											if(err){
												__logger.error('error in mysql conn:::');
											}
											else{
												__logger.info('inserted incoming transaction successfully');
												db.redis.add_to_set('eth_vmp_set',tx_hash,function(err,res){
													if(err){
														__logger.error('error in redis conn:::: ');
													}
													else{
														db.mysql.__find('address_master',{'address':receipient},function(err,res){
															if(err){
																__logger.error('error in mysql conn:: ');
															}
															else{
																__logger.info('found address in address_master,details:: ',receipient,res[0],typeof(res[0]));
																var send_dict = {
																	'from_address':sender,
																	'to_address':receipient,
																	'txid':tx_hash,
																	'value':value,
																	'confirmations':0
																};
																db.mysql.__find('user_master',{'user_name':res[0]['user']},function(err,res){
																	var notification_url = res[0]['notification_url'];
																	var options = {
																		'uri':notification_url,
																		'method':'POST',
																		'json': send_dict
																	}
																	request.post(options,function(err,response,body){
																		__logger.debug('notification sent to::: ', notification_url, ' data:: ');
																		if(err){
																			__logger.error('error in sending response::: ',err);
																		}
																		if(response.statusCode == 200){
																			__logger.debug('response received::: ', body);
																		}
																		
																	})
																})
															}
														})
													}
												});
											}
										})
									}
								})
							}
							else{

							}
						}
					})
				}
			}
			
			
		})
		
	});
}