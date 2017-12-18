const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const ethers = require("ethers");
var request = require('request');
var moment = require('moment');
var _config = require('../../config');
var db = require('../../lib/db');
var __logger = require('../../lib/logger');
var __res = require('../response_handler');
// var uuid = require('uuid/v4');
var jwt = require('jsonwebtoken');
var secureRandom = require('secure-random');
var bitcore = require('../../node_modules/ethereum-bip44/node_modules/bitcore-lib');
var EthereumBip44 = require('ethereum-bip44');

var staging = _config.staging;
var web3 = new Web3( new Web3.providers.HttpProvider('http://localhost:8545'));
var methods = {};

methods.get_eth_address = function(req, res, next){
	__logger.info('generating etherium address::::::: ');
	var user = req.query.user;
	var token = req.query.token;
	db.mysql.__find('user_master',{'user_name':user,'token':token},function(err,result){
		if(err){
			__logger.debug('error while finding user::: ',err);
			new __res.ERROR('error_finding_user').send (res);
		}
		else{
			console.log('rrrrr ',result.length);
			if(result.length == 12){
				__logger.debug('error while finding user::: ',err);
				new __res.AUTH_FAILED('invalid_user_or_token').send(res);
			}
			else{
				__logger.info('user found generating address ');
				var priv_key_arr = secureRandom(10);
				var priv_key_str = '';
				for(var i=0;i<priv_key_arr.length;i++){
					priv_key_str += Math.pow(priv_key_arr[i],2).toString();
				}
	            console.log('prprp  ',priv_key_str);
	            var privatekey = web3.sha3(priv_key_str);
	            var wallet = new ethers.Wallet(privatekey);
	            __logger.debug('generated privatekey & address ::::::: ',privatekey,wallet.address.toLowerCase());
	            var insert_dict = {
	            	'address':wallet.address.toLowerCase(),
	            	'priv_key':privatekey,
	            	'user':user
	            }
	            db.mysql.__insert('address_master',insert_dict,function(err,result){
	            	if(err){
	            		__logger.debug('error in inserting generateed address');
	            		new __res.ERROR('error_generating_address').send(res);
	            	}
	            	else{
	            		__logger.info('generated and inserted new address ::::: ');
	            		__logger.info('inserting address in redis eth_aw_set:::: ', wallet.address.toLowerCase());
	            		db.redis.add_to_set('eth_aw_set',wallet.address.toLowerCase(),function(err,result){
	            			if(err){
	            				__logger.debug('error in inserting generateed address');
	            				new __res.ERROR('error_generating_address').send(res);
	            			}
	            			else{
	            				__logger.info('inserted address in redis eth_aw_set:::: ', wallet.address.toLowerCase());
	            				new __res.SUCCESS({'address':wallet.address.toLowerCase()}).send(res);
	            			}
	            		});
	            		
	            	}
	            });
			}
		}
	})
}

methods.get_hd_address = function(req,response,next){
	var user = req.query.user;
	db.mongo.__findOne('hd_key_details',{user:user},function(err,res){
		if(err){
			//
		}
		else{
			if(res){
				console.log('old user::: ', res);
				var key = res.key;
				var index = res.current_index + 1;
				var wallet = EthereumBip44.fromPrivateSeed(key);
				var hd_address = wallet.getAddress(index);
                // var tmp = wallet.getPrivate(index);
                // console.log('tttt ',tmp);
				var priv_key = '0x' + wallet.getPrivateKey(index).toString();
				console.log('qw1::: ',priv_key.toString());

				// console.log('pp ',JSON.stringify(priv_key),JSON.parse(JSON.stringify(priv_key))['data'].length);
				// var priv_key_arr = JSON.parse(JSON.stringify(priv_key))['data']
				// var priv_key_str = '';
				// for(var i=0;i<priv_key_arr.length;i++){
				// 	priv_key_str += Math.pow(priv_key_arr[i],6).toString();
				// 	// priv_key_str += priv_key_arr[i].toString();
				// }
	   //          console.log('prprp  ',priv_key_str);
	   //          var privatekey = web3.sha3(priv_key_str);
	   //          console.log('p1p1p1 ',privatekey);
	            // var wallet1 = new ethers.Wallet('0x' + priv_key);
	            // console.log('aaasasas ',wallet1.address.toLowerCase())
				insert_dict = {
					user:user,
					index:index,
					address:hd_address,
					priv_key:priv_key
				}
				db.mongo.__insert('hd_address_details',insert_dict,function(err,res){
					if(err){

					}
					else{
						var upd_find = {user:user}
						var upd_params = {$inc:{current_index:1}}
						db.mongo.__update('hd_key_details',upd_find,upd_params,function(err,res){
							if(err){

							}
							else{
								new __res.SUCCESS({'address':hd_address}).send(response);
							}
						})
					}
				})
			}
			else{
				console.log('new user:: ');
				var key = bitcore.HDPrivateKey();
				// console.log('kkk ',key.toString(),typeof(key));
				var wallet = new EthereumBip44(key);
				var index = 0;
				var hd_address = wallet.getAddress(index);
				var priv_key = '0x' + wallet.getPrivateKey(index).toString();
				insert_dict = {
					user:user,
					key:key.toString(),
					current_index:index,
				}
				console.log('iiii ',insert_dict);
				db.mongo.__insert('hd_key_details',insert_dict,function(err,res){
					if(err){

					}
					else{
						insert_params = {
							user:user,
							address:hd_address,
							index:index,
							priv_key:priv_key
						}
						db.mongo.__insert('hd_address_details',insert_params,function(err,res){
							if(err){

							}
							else{
								new __res.SUCCESS({'address':hd_address}).send(response);
							}
						})
					}
				})
			}
		}
	})
}

methods.forward_eth= function(req,res,next){
	var from_address = req.body.from_address;
	var to_address = req.body.to_address;
    var ethers_to_send = req.body.ethers;
    db.mongo.__findOne('hd_address_details',{address:from_address},function(err,res){
    	console.log('1213eeee ',err,result,typeof(result));
		if(!err){
			var privatekey = result[0]['priv_key'];
			var ethers = parseFloat(web3.fromWei(web3.eth.getBalance(from_address), "ether"));  //how may ether u have
			var gp= web3.fromWei((web3.eth.gasPrice*21000),"ether");
			__logger.info('request recieved for transaction from:: ', from_address, " to:: ", to_address,"value is ",ethers_to_send);
			var req_ethers =  parseFloat(ethers_to_send)+ parseFloat(gp);
			if(ethers < req_ethers){
				__logger.info('insufficient funds in ', from_address, " funds is ", ethers);
				new __res.ERROR('insufficent_funds').send(res);
			}
			else{
				var pk = new Buffer(privatekey.slice(2, privatekey.length), "hex")
				var rawTx = {
					"nonce": web3.toHex(web3.eth.getTransactionCount(from_address)),
					"gasPrice": web3.toHex(web3.eth.gasPrice),
					"gasLimit": web3.toHex(21000),
					"to": to_address,
					"value": web3.toHex(web3.toWei(ethers_to_send, "ether")),
					chainId: web3.toHex(3)
				}
				var tx = new Tx(rawTx);
			    tx.sign(pk);
	    		var serializedTx = tx.serialize();
				web3.eth.sendRawTransaction("0x" + serializedTx.toString('hex'), function(err, hash) {
					console.log('asasasasasasas' ,err,hash);
			    if (err)
			    {
					// console.log("error in sending transaction  "+err);
					__logger.error('couldnot send funds ', from_address, "to address ",to_address,"because of error::",err);
					new __res.ERROR('error in sending transaction').send(res);
				}
			    else{
			      // console.log("sucessful transction!!!! hash is"+hash);
				   	var timestamp = (Math.floor(Date.now() / 1000)).toString();
					var insert_dict = {
						'txid':hash,
						'from_address':from_address,
						'to_address':to_address,
						'value':web3.toWei(req_ethers,'ether'),    //ether with fee included
						'timestamp':timestamp,
						'conformations':"0",
						'flag':"outgoing"
 				    };
					db.mysql.__insert('transaction_details',insert_dict,function(err,result){
						// console.log('ttttt',err,result);
						if(!err){
							__logger.info('funds of ::',req_ethers,'transferred sucessful',"from address:: ", from_address, "to address:: ",to_address,"with hash of ::",hash);
							new __res.SUCCESS({'sucessful_transction':true,"transaction_hash":hash,"time":timestamp,"responce":result}).send(res);
						}
						else{
							__logger.info('couldnot insert in mysql ', from_address, "to address ",to_address,"because of error::",err);
							new __res.ERROR('error in mysql insertion').send(res);
						}
					});

					}

				});

			}
		}
		else{
			__logger.info('Error:: ',err);
			new __res.ERROR('no_address_found').send(res);
		}
	});
}



module.exports = methods;