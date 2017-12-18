var Tx = require('ethereumjs-tx');
var Web3 = require('web3');
var ethers = require('ethers');
var web3 = new Web3( new Web3.providers.HttpProvider('http://localhost:8545'));

var privatekey = '0x4154dfd42503aea2ede87896aaa21a4c82610f2218f9208b3de979a136a9a406';
var wallet = new ethers.Wallet(privatekey);
var Tx = require('ethereumjs-tx');

console.log(wallet);

var pk = new Buffer(privatekey.slice(2, privatekey.length), "hex")


var account= "0x0077a8770f7725ea02f8b38ec49486c6be6aaa4b";
var rawTx = {
  nonce: web3.toHex(web3.eth.getTransactionCount(account)),
  gasPrice: web3.toHex(web3.eth.gasPrice),
  gasLimit: web3.toHex(21000),
  to: '0x7a395a8cc36e4949e55fa802f656b6e2bb387693',
  value: web3.toHex(web3.toWei(0.001, "ether"))
}

console.log("from       ==>>>",account);
console.log("to       ==>>>",rawTx.to);

var tx = new Tx(rawTx);
console.log("sign is =======> "+tx.sign(pk));

var serializedTx = tx.serialize();
console.log("seriliazed trans is ======>"+serializedTx)

web3.eth.sendRawTransaction("0x" + serializedTx.toString('hex'), function(err, hash) {
  if (err)
    {console.log("error is "+err);}
    else{
      console.log("hash is"+hash);
    }

});