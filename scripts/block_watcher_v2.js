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
var forEach = require('async-foreach').forEach;
var each = require('async-each-series');

//var web3 = new Web3( new Web3.providers.HttpProvider('http://139.59.213.205:7007'));

var web3 = new Web3( new Web3.providers.HttpProvider('http://localhost:8545'));

// process.on('uncaughtException', function (err) {
// 	console.log('qw123');
// 	db.redis.add_json('mutex','1',function(err,res){
// 		if(err){
// 			__logger.error('error in redis conn:::',err);
// 		}
// 		else{
// 			__logger.error('exception occured:::, setting mutex to 1 ');
// 		}
// 	})
// });

// var web3 = new Web3( new Web3.providers.HttpProvider('http://localhost:8545'));
db.initialize(function (err) {
    if (err) {
        process.exit(1);
    }
    else {
        __logger.info('started all databases');
        setInterval(watcher,3000);
    }
});


function crawl_pct(current_block_height,__callback){
	db.redis.add_json('mutex',2,function(err,res){

	})
	try{
		__logger.debug('start crawling pct:::: ');
		db.redis.__get_all_elements_in_set('eth_pct_set',function(err,res){
			if(err){
				__logger.error('error crawling pct::: ',err)
				__callback(err);
			}
			else{
				var tx_list = res;
				if(tx_list.length == 0){
					__callback(null,res);
				}
				else{
					var last_pct = tx_list[tx_list.length - 1];
					async.eachSeries(tx_list,function(txid,__cb){
						db.redis.add_json('mutex',2,function(err,res){
		
						})
						try{
							var transaction_details = web3.eth.getTransaction(txid);
							var pct_block_number = transaction_details['blockNumber'];
							// current_block_height = web3.eth.blockNumber;
							var confirmations = current_block_height - pct_block_number;
							__logger.debug('zzxzxzxzxzxzxzxzx  :::::   ',current_block_height,pct_block_number);
							if(confirmations <= 3){
								db.mysql.__increment('transaction_details',{'txid':txid},'conformations',function(err,res){
									if(err){
										__callback(err);
									}
									else{
										__logger.info('incremented confirmations of txid:: ',txid);
										db.mysql.__find('transaction_details',{'txid':txid},function(err,result){
											if(err){
												__callback(err);
											}
											else{
												try{
													var address = result[0]['to_address'];
													db.mysql.__find('address_master',{'address':address},function(err,res){
														if(err){
															__callback(err);
														}
														else{
															try{
																var user = res[0]['user'];
																db.mysql.__find('user_master',{'user_name':user},function(err,res){
																	if(err){
																		__callback(err);
																	}
																	else{
																		try{
																			var send_dict = {
																				'from_address':result[0]['from_address'],
																				'to_address':result[0]['to_address'],
																				'txid':txid,
																				'value':result[0]['value'],
																				'confirmations':parseInt(result[0]['conformations'])
																			}
																			var notification_url = res[0]['notification_url'];
																			var options = {
																				'uri':notification_url,
																				'method':'POST',
																				'json': send_dict
																			}
																			request.post(options,function(err,response,body){
																				try{
																					__logger.debug('notification sent to::: ', notification_url, ' data:: ');
																					if(err){
																						__logger.error('error in sending response::: ',err);
																						__callback(err);
																					}
																					if(response.statusCode == 200){
																						__logger.debug('response received::: ', body);
																						__cb(null);
																						if(txid == last_pct){
																							return __callback(null,res);
																						}
																					}
																				}
																				catch(error){
																					__logger.error('exception in crawl_pct 6::::');
																					db.redis.add_json('mutex','1',function(err,res){
																						if(err){
																							__logger.error('error in redis conn:::',err);
																						}
																						else{
																							__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
																							__cb(null);
																							if(txid == last_pct){
																								return __callback(null,res);
																							}
																						}
																					})
																				}																				
																			});
																		}
																		catch(error){
																			__logger.error('exception in crawl_pct 5::::');
																			db.redis.add_json('mutex','1',function(err,res){
																				if(err){
																					__logger.error('error in redis conn:::',err);
																				}
																				else{
																					__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
																					__cb(null);
																					if(txid == last_pct){
																						return __callback(null,res);
																					}
																				}
																			})
																		}
																	}
																});
															}
															catch(error){
																__logger.error('exception in crawl_pct 4::::');
																			db.redis.add_json('mutex','1',function(err,res){
																				if(err){
																					__logger.error('error in redis conn:::',err);
																				}
																				else{
																					__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
																					__cb(null);
																					if(txid == last_pct){
																						return __callback(null,res);
																					}
																				}
																			})
															}
														}
													});
												}
												catch(error){
													__logger.error('exception in crawl_pct 3::::');
													db.redis.add_json('mutex','1',function(err,res){
														if(err){
															__logger.error('error in redis conn:::',err);
														}
														else{
															__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
															__cb(null);
															if(txid == last_pct){
																return __callback(null,res);
															}
														}
													})
												}
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
										return __callback(null,res);
										// crawl_zct(block_number);
									}
									__cb(null);
								})
							}
						}						
						catch(error){
							__logger.error('exception in crawl_pct 2::::');
							db.redis.add_json('mutex','1',function(err,res){
								if(err){
									__logger.error('error in redis conn:::',err);
								}
								else{
									__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
									__cb(null);
									if(txid == last_pct){
										return __callback(null,res);
									}
								}
							})
						}
					})
				}
				
			}
		})
	}
	catch(error){
		db.redis.add_json('mutex','1',function(err,res){
			__logger.error('exception in crawl_pct 1::::');
			if(err){
				__logger.error('error in redis conn:::',err);
			}
			else{
				__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
				__callback(null,1);
			}
		})
	}	
}


function crawl_zct(block_number,__callback){
	db.redis.add_json('mutex',2,function(err,res){
		
	})
	try{
		db.redis.__get_all_elements_in_set('eth_zct_set',function(err,res){
			try{
				__logger.debug('start crawling zct:::: ', block_number);
				console.log('ppp',err,res,block_number);
				if(err){
					__callback(err);
				}
				else{
					try{
						var zct_tx_list = res;
						__logger.info('zct elemets:::: ',zct_tx_list);
						if(zct_tx_list.length == 0){
							__callback(null,res);
						}
						else{
							var last_zct = zct_tx_list[zct_tx_list.length - 1]
							async.eachSeries(zct_tx_list,function(zct_txid,__cb){
								db.redis.add_json('mutex',2,function(err,res){
		
								})
								try{
									var zct_tx_detail = web3.eth.getTransaction(zct_txid);
									var zct_block_number = zct_tx_detail['blockNumber'];
									if(zct_block_number != null){
										db.redis.__move_to_set('eth_zct_set','eth_pct_set',zct_txid,function(err,res){
											if(err){
												__callback(err);
											}
											else{
												db.mysql.__increment('transaction_details',{'txid':zct_txid},'conformations',function(err,res){
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
																var result = result;
																try{
																	var address = result[0]['to_address'];
																	db.mysql.__find('address_master',{'address':address},function(err,res){
																		if(err){
																			__callback(err);
																		}
																		else{
																			try{
																				var user = res[0]['user'];
																				db.mysql.__find('user_master',{'user_name':user},function(err,res){
																					if(err){
																						__callback(err);
																					}
																					else{
																						try{
																							var send_dict = {
																								'from_address':result[0]['from_address'],
																								'to_address':result[0]['to_address'],
																								'txid':zct_txid,
																								'value':result[0]['value'],
																								'confirmations':1
																							}
																							var notification_url = res[0]['notification_url'];
																							var options = {
																								'uri':notification_url,
																								'method':'POST',
																								'json': send_dict
																							}
																							request.post(options,function(err,response,body){
																								try{
																									__logger.debug('notification sent to::: ', notification_url, ' data:: ');
																									if(err){
																										__logger.error('error in sending response::: ',err);
																										__callback(err);
																									}
																									if(response.statusCode == 200){
																										__logger.debug('bresponse received::: ', body);
																										__cb(null);
																										if(zct_txid == last_zct){
																											return __callback(null,res);
																										}
																									}
																								}
																								catch(error){
																									__logger.error('exception in crawl_zct 8::::');
																									db.redis.add_json('mutex','1',function(err,res){
																										if(err){
																											__logger.error('error in redis conn:::',err);
																										}
																										else{
																											__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
																											__cb(null);
																											if(zct_txid == last_zct){
																												return __callback(null,res);
																											}
																										}
																									})
																								}																								
																							});
																						}
																						catch(err){
																							__logger.error('exception in crawl_zct 7::::');
																							db.redis.add_json('mutex','1',function(err,res){
																								if(err){
																									__logger.error('error in redis conn:::',err);
																								}
																								else{
																									__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
																									__cb(null);
																									if(zct_txid == last_zct){
																										return __callback(null,res);
																									}
																								}
																							})
																						}
																						
																					}
																				})
																			}
																			catch(error){
																				__logger.error('exception in crawl_zct 6::::');
																				db.redis.add_json('mutex','1',function(err,res){
																					if(err){
																						__logger.error('error in redis conn:::',err);
																					}
																					else{
																						__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
																						__cb(null);
																						if(zct_txid == last_zct){
																							return __callback(null,res);
																						}
																					}
																				})
																			}													
																			
																		}
																	})
																}
																catch(error){
																	__logger.error('exception in crawl_zct 5::::');
																	db.redis.add_json('mutex','1',function(err,res){
																		if(err){
																			__logger.error('error in redis conn:::',err);
																		}
																		else{
																			__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
																			__cb(null);
																			if(zct_txid == last_zct){
																				return __callback(null,res);
																			}
																		}
																	})
																}
															}
														})
													}
												})
											}
										});
									}
									else{
										return __callback(null,res);
										__cb(null);
									}
								}
								catch(error){
									__logger.error('exception in crawl_zct 4::::');
									db.redis.add_json('mutex','1',function(err,res){
										if(err){
											__logger.error('error in redis conn:::',err);
										}
										else{
											__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
											__cb(null);
											if(zct_txid == last_zct){
												return __callback(null,res);
											}
										}
									})
								}
							});
						}
					}
					catch(error){
						__logger.error('exception in crawl_zct 3::::')
						db.redis.add_json('mutex','1',function(err,res){
							if(err){
								__logger.error('error in redis conn:::',err);
							}
							else{
								__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
								__callback(null,1);
							}
						})
					}					
				}
			}
			catch(error){
				__logger.error('exception in crawl_zct 2::::')
				db.redis.add_json('mutex','1',function(err,res){
					if(err){
						__logger.error('error in redis conn:::',err);
					}
					else{
						__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
						__callback(null,1);
					}
				})
			}
		})
	}
	catch(error){
		__logger.error('exception in crawl_zct 1::::')
		db.redis.add_json('mutex','1',function(err,res){
			if(err){
				__logger.error('error in redis conn:::',err);
			}
			else{
				__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
				__callback(null,1);
			}
		})
	}
		
}

function block_crawler(block_number,__callback){
	db.redis.add_json('mutex',2,function(err,res){
		
	})
	try{
		__logger.debug('starting to crawl block number::::: ', block_number);
		var block_details = web3.eth.getBlock(block_number);
		var transation_list = block_details['transactions'];
		async.eachSeries(transation_list,function(txid,__cb){
			try{
				db.redis.__remove_from_set('eth_vmp_set',txid,function(err,res){
					console.log('popopop',err,res);
					if(err){
						// __callback(err);
					}
					else{
						// __callback(null,res);
					}
					__cb(null);
				});
			}
			catch(error){
				__logger.error('exception in block_crawler 2:::: ',error);
				db.redis.add_json('mutex','1',function(err,res){
					if(err){
						__logger.error('error in redis conn:::',err);
					}
					else{
						__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
						__cb(null);
					}
				})
				// __cb(null);
			}
			
			// __cb(null);
		});
		try{
			db.redis.__incr('eth_blocks_crawled',function(err,res){
				if(err){
					__callback(err);
				}
				else{
					__logger.info('incremeted block_number in redis::: ');
					__callback(null,res);			
				}
			})	
		}
		catch(error){
			__logger.error('exception in block_crawler 3:::: ',error);
			db.redis.add_json('mutex','1',function(err,res){
				if(err){
					__logger.error('error in redis conn:::',err);
				}
				else{
					__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
					__callback(null,1);
				}
			})
			// __callback(error);
		}
		
	}
	catch(error){
		__logger.error('exception in block_crawler 1:::: ',error)
		db.redis.add_json('mutex','1',function(err,res){
			if(err){
				__logger.error('error in redis conn:::',err);
			}
			else{
				__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
				__callback(null,1);
			}
		})
	}
	
}

function open_block(current_block_height,block_number,__callback){
	db.redis.add_json('mutex',2,function(err,res){
		
	})
	try{
		__logger.debug('opening block number::::: ', block_number);
		var block_details = web3.eth.getBlock(block_number);
		var transation_list = block_details['transactions'];
		console.log('ttttt',transation_list);
		if(transation_list.length == 0){
			__callback(null,1)
		}
		last_transaction = transation_list[transation_list.length - 1]
		// console.log('oooo',transation_list);
		async.eachSeries(transation_list,function(txid,__cb){
			db.redis.add_json('mutex',2,function(err,res){
		
			})
			try{
				__logger.debug('opening txid:: ',txid);
				var transaction_details = web3.eth.getTransaction(txid);
				var tx_hash = transaction_details['hash'];
				var reciepient = transaction_details['to'];
				var sender = transaction_details['from'];
				var value = transaction_details['value'];
				db.redis.__find_in_set('eth_vmp_set',tx_hash,function(err,res){
					if(err){
						__logger.error('error in redis con::: ',err);
						__callback(err);
					}
					else{
						if(res == 0){
							db.redis.__find_in_set('eth_aw_set',reciepient,function(err,res){
								if(err){
									__logger.error('error in redis con::: ',err);
									__callback(err);
								}
								else{
									if(res == 1){
										__logger.debug('address found in eth_aw_set:::')
										db.redis.__find_in_set('eth_pct_set',txid,function(err,res){
											if(err){
												__logger.error('error in redis con::: ',err);
												__callback(err);
											}
											else{
												if(res == 1){
													try{
														__logger.debug('transaction found in pct set::: ');
														__callback(null,res);
													}
													catch(error){
														__logger.error('exception in open block 1:::: ',error);
														db.redis.add_json('mutex','1',function(err,res){
															if(err){
																__logger.error('error in redis conn:::',err);
															}
															else{
																__logger.error('exception occured:::, setting mutex to 1 ');
															}
															__cb(null);
															if(txid == last_transaction){
																__callback(null,1);
															}
														})
													}
													
												}
												else{
													__logger.debug('transaction not found in pct::: ', txid);
													db.redis.add_to_set('eth_pct_set',txid,function(err,res){
														if(err){
															__logger.error('error in redis conn::: ');
															__callback(err);
														}
														else{
															try{
																__logger.debug('added txid:: ',txid,'to eth_pct_set');
																var insert_dict = {
																	'flag':'incoming',
																	'from_address':sender,
																	'to_address':reciepient,//reciepient
																	'txid':tx_hash,
																	'conformations':(parseInt(current_block_height) - parseInt(block_number)).toString(),
																	'value':value,
																	'timestamp':Math.floor(new Date() / 1000).toString()
																}
																db.mysql.__insert('transaction_details',insert_dict,function(err,res){
																	if(err){
																		__logger.error('error in mysql conn::: ',err);
																		__callback(err);
																	}
																	else{
																		db.mysql.__find('address_master',{'address':reciepient},function(err,res){
																			if(err){
																				__logger.error('error in mysql conn:: ');
																				__callback(err);
																			}
																			else{
																				try{
																					__logger.info('found address in address_master,details:: ',reciepient,res[0],typeof(res[0]));
																					var send_dict = {
																						'from_address':sender,
																						'to_address':reciepient,
																						'txid':tx_hash,
																						'value':value,
																						'confirmations':(parseInt(current_block_height) - parseInt(block_number))
																					};
																					db.mysql.__find('user_master',{'user_name':res[0]['user']},function(err,res){
																						var notification_url = res[0]['notification_url'];
																						var options = {
																							'uri':notification_url,
																							'method':'POST',
																							'json': send_dict
																						}
																						request.post(options,function(err,response,body){
																							try{
																								__logger.debug('notification sent to::: ', notification_url, ' data:: ');
																								if(err){
																									__logger.error('error in sending response::: ',err);
																									__callback(err);
																								}
																								if(response.statusCode == 200){
																									__logger.debug('response received::: ', body);
																									__cb(null);
																									if(txid == last_transaction){
																										__callback(null,res);
																									}
																								}
																							}
																							catch(error){
																								__logger.error('exception in open block 3:::: ',error)
																								db.redis.add_json('mutex','1',function(err,res){
																									if(err){
																										__logger.error('error in redis conn:::',err);
																									}
																									else{
																										__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
																									}
																								})
																								__cb(null);
																								if(txid == last_transaction){
																									__callback(null,1);
																								}
																							}
																							// }																
																						})
																					})
																				}
																				catch(error){
																					__logger.error('exception in open block 3:::: ',error)
																					db.redis.add_json('mutex','1',function(err,res){
																						if(err){
																							__logger.error('error in redis conn:::',err);
																						}
																						else{
																							__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
																						}
																					})	
																					__cb(null);
																					if(txid == last_transaction){
																						__callback(null,1);
																					}				
																				}
																			}
																		})
																	}
																})												
															}
															catch(error){
																db.redis.add_json('mutex','1',function(err,res){
																	__logger.error('exception in open block 6:::: ',error)
																	if(err){
																		__logger.error('error in redis conn:::',err);
																	}
																	else{
																		__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
																	}
																})
																__cb(null);
																if(txid == last_transaction){
																	__callback(null,1);
																}
															}

														}
													})
												}
											}
										})
									}
									else{
										__logger.debug('address not found in eth_aw_set:::: ');
										__cb(null);
										if(txid == last_transaction){
											__callback(null,res);
										}
									}
								}
							})
						}
						else{
							db.redis.add_json('mutex','1',function(err,res){
								if(err){
									__logger.error('error in redis conn:::',err);
								}
								else{
									__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
								}
							})
							__cb(null);
							if(txid == last_transaction){
								__callback(null,1);
							}
						}
					}
				})	
			}
			catch(error){
				db.redis.add_json('mutex','1',function(err,res){
					__logger.error('exception in open block 4:::: ',error)
					if(err){
						__logger.error('error in redis conn:::',err);
						__callback(err);
					}
					else{
						__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
						__callback(null,1)
					}
				})
			}
		});
	}
	catch(error){
		db.redis.add_json('mutex','1',function(err,res){
			__logger.error('exception in open block 5:::: ',error)
			if(err){
				__logger.error('error in redis conn:::',err);
				__callback(err);
			}
			else{
				__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
				__callback(null,1)
			}
		})
	}
}

function watcher(){
	db.redis.check_token('mutex',function(err,res){
		if(err){
			__logger.error('error in redisss con::: ',err);
		}
		else{
			if(res=='1'){
				__logger.debug('mutex 1::');
				__logger.debug('starting block script');
				try{
					db.redis.add_json('mutex','2',function(err,res){
						if (err){
							__logger.error('error in redis conn:: ');
						}
						else{
							__logger.debug('setting mutex to 2');
							db.redis.check_token('eth_blocks_crawled',function(err,res){
								if(err){
									__logger.error('error in redis conn::::');
								}
								else{
									try{
										var current_block_height = web3.eth.blockNumber;
										var crawled_block_height = parseInt(res);
										var block_array = [];
										for(var i=crawled_block_height + 1;i<=current_block_height;i++){
											block_array.push(i);
											console.log('iiiii ',i);
										}
										var last_block_number = block_array[block_array.length - 1];
										async.eachSeries(block_array,function(block_number,__callback){
											__logger.info('getting confirmations for previous transactions of block::: ',block_number);
											crawl_pct(current_block_height,function(err,res){
												if(err){
													__logger.error('error crawling pct::: ',err);
												}
												else{
													__logger.debug('successfully crawled pct after block::: ', block_number);
													crawl_zct(block_number,function(err,res){
														if(err){
															__logger.error('error crawling zct::: ',err);
														}
														else{
															__logger.debug('successfully crawled zct after block::: ', block_number);
															open_block(current_block_height,block_number,function(err,res){
																if(err){
																	__logger.error('error opening block::: ');
																}
																else{
																	block_crawler(block_number,function(err,res){
																		if(err){
																			__logger.error('error crawling block::: ',block_number,err);
																		}
																		else{
																			__logger.debug('successfully crawled block_number:: ',block_number);
																			__logger.debug('completed script::: ',block_number,last_block_number);
																			if(block_number == last_block_number){
																				db.redis.add_json('mutex','1',function(err,res){
																					if(err){
																						__logger.error('error in redis conn:::',err);
																					}
																					else{
																						__logger.info('script finished,resetting mutex to 1::::: ');
																					}
																				})
																			}
																			return __callback(null);
																		}
																		
																	});
																}
															})
														}
													})
												}
											})				
										})
										if(block_array.length == 0){
											db.redis.add_json('mutex','1',function(err,res){
												if(err){
													__logger.error('error in redis conn:::',err);
												}
												else{
													__logger.info('script finished and no of blocks = 0 ,resetting mutex to 1::::: ');
												}
											})
										}
									}
									catch(error){
										__logger.error('error in watcher 2 ::::');
										db.redis.add_json('mutex','1',function(err,res){
											if(err){
												__logger.error('error in redis conn:::',err);
											}
											else{
												__logger.error('exception occured:::, setting mutex to 1 ');
											}
										})
									}
								}
							});
						}
					})
				}
				catch(error){
					__logger.error('error in watcher 1 ::::');
					db.redis.add_json('mutex','1',function(err,res){
						if(err){
							__logger.error('error in redis conn:::',err);
						}
						else{
							__logger.error('exception occured:::, setting mutex to 1 ');
						}
					})
				}
			}
			else{
				__logger.debug('mutex 2::: , not starting');
			}
		}
	})
}