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
var sleep = require('sleep');
// var uuid = require('uuid/v4');
var jwt = require('jsonwebtoken');
var secureRandom = require('secure-random');
var async = require('async');

// var web3 = new Web3( new Web3.providers.HttpProvider('http://138.197.111.208:7007'));
var web3 = new Web3( new Web3.providers.HttpProvider('http://localhost:7007'));
db.initialize(function (err) {
    if (err) {
        process.exit(1);
    }
    else {
        __logger.info('started all databases');
        setInterval(watcher,5000);
    }
});
function crawl_pct(__callback){
	__logger.debug('start crawling pct:::: ');
	db.redis.__get_all_elements_in_set('eth_pct_set',function(err,res){
		if(err){
			__logger.error('error crawling pct::: ',err)
			__callback(err);
		}
		else{
			var tx_list = res;
			tx_list.forEach(function(txid){
				var transaction_details = web3.eth.getTransaction(txid);
				var block_number = transaction_details['blockNumber'];
				var confirmations = current_block_height - block_number;
				if(confirmations <= 3){
					db.mysql.__increment('transaction_details',{'txid':txid},'conformations',function(err,res){
						if(err){
							__callback(err);
						}
						else{
							__logger.info('incremented confirmations of txid:: ',txid);
							db.mysql.__find('transaction_details',txid,function(err,result){
								if(err){
									__callback(err);
								}
								else{
									var address = res[0]['to_address'];
									db.mysql.__find('address_master',{'address':address},function(err,res){
										if(err){
											__callback(err);
										}
										else{
											var send_dict = {
												'from_address':result[0]['from_address'],
												'to_address':result[0]['to_address'],
												'txid':txid,
												'value':result['value'],
												'confirmations':parseInt(result[0]['conformations'])
											}
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
													__callback(err);
												}
												if(response.statusCode == 200){
													__logger.debug('response received::: ', body);
													__callback(res);
												}
												
											});
										}
									});
								}
							});
						}
					});
				}
				else{
					db.redis.__remove_from_set('eth_pct_set',txid,function(err,res){
						if(err){
							__logger.error('error in removing from eth_pct_set', err);
							__callback(err);
						}
						else{
							__logger.info('removed transation::: ',txid,' from eth_pct_set');
							__callback(res);
						}
					})
				}
			})
		}
	})
}
function crawl_zct(__callback){
	__logger.debug('start crawling zct:::: ');
	db.redis.__get_all_elements_in_set('eth_zct_set',function(err,res){
		console.log('ppp',err,res);
		if(err){
			__callback(err);
		}
		else{
			var zct_tx_list = res;
			zct_tx_list.forEach(function(zct_txid){
				var zct_tx_detail = web3.eth.getTransaction(zct_txid);
				var zct_block_number = zct_tx_detail['blockNumber'];
				if(zct_block_number != null){
					db.redis.__move_to_set('eth_zct_set','eth_pct_set',zct_txid,function(err,res){
						if(err){
							__callback(err);
						}
						else{
							console.log('aa');
							db.mysql.__increment('transaction_details',{'txid':zct_txid},'conformations',function(err,res){
								console.log('aa');
								if(err){
									__logger.info('error in redis conn:: ');
									__callback(err);
								}
								else{
									db.mysql.__find('transaction_details',{'txid':zct_txid},function(err,result){
										if(err){
											__callback(err);
										}
										else{
											var address = result['to_address'];
											db.mysql.__find('address_master',{'address':address},function(err,res){
												if(err){
													__callback(err);
												}
												else{
													var send_dict = {
														'from_address':result['from_address'],
														'to_address':result['to_address'],
														'txid':txid,
														'value':result['value'],
														'confirmations':1
													}
													var notification_url = res['notification_url'];
													var options = {
														'uri':notification_url,
														'method':'POST',
														'json': send_dict
													}
													request.post(options,function(err,response,body){
														__logger.debug('notification sent to::: ', notification_url, ' data:: ');
														if(err){
															__logger.error('error in sending response::: ',err);
															__callback(err);
														}
														if(response.statusCode == 200){
															__logger.debug('response received::: ', body);
															__callback(res);
														}
														
													});
												}
											})
										}
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
function block_crawler(block_number,__callback){
	__logger.debug('starting to crawl block number::::: ', block_number);
	var block_details = web3.eth.getBlock(block_number);
	var transation_list = block_details['transactions'];
	// console.log('bbbb',block_details);
	transation_list.forEach(function(txid){
		db.redis.__remove_from_set('eth_vmp_set',txid,function(err,res){
			console.log('popopop',err,res);
			if(err){
				__callback(err);
			}
			else{
				db.redis.__incr('eth_blocks_crawled',function(err,res){
					if(err){
						__callback(err);
					}
					else{
						__callback(null,res);
					}
				})
			}
		})
	})

}
// function watcher(){
// 	__logger.debug('starting block script');
// 	async.waterfall([

// 		],
// 		function(err,result){

// 		});
// }
function watcher(){
	__logger.debug('starting block script');
	db.redis.check_token('eth_blocks_crawled',function(err,res){
		if(err){
			__logger.error('error in redis conn::::');
		}
		else{
			var current_block_height = web3.eth.blockNumber;
			var crawled_block_height = parseInt(res);
			var block_array = [];
			// var new_blocks = current_block_height - res;
			for(var i=crawled_block_height + 1;i<=current_block_height;i++){
				block_array.push(i);
			}
			// console.log(block_array);
			block_array.forEach(function(block_number){
				__logger.info('getting confirmations for previous transactions of block::: ',block_number);
				async.series(
					[
						// function(next){
						// 	crawl_pct(next);
						// },
						// function(next){
						// 	crawl_zct(next);
						// },
						// function(next){
						// 	block_crawler(block_number,next);
						// }
						crawl_pct(),
						crawl_zct(),
						block_crawler(block_number)
					],
					function(err,res){
						if(err){
							__logger.error('error running watcher::: ',err);
						}
						else{
							__logger.debug('running watcher:::: ',res);
						}
					}
				)
			})
			
		}
	});
}

				