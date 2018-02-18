"use strict";



// Import the third-party libraries

const Promise = require("bluebird");



// Import the local libraries and customize the web3 environment

const addEvmFunctions = require("../utils/evmFunctions.js");



addEvmFunctions(web3);



if (typeof web3.eth.getBlockPromise !== "function") {

    Promise.promisifyAll(web3.eth, { suffix: "Promise" });

}

if (typeof web3.evm.increaseTimePromise !== "function") {

    Promise.promisifyAll(web3.evm, { suffix: "Promise" });

}

if (typeof web3.version.getNodePromise !== "function") {

    Promise.promisifyAll(web3.version, { suffix: "Promise" });

}


web3.eth.expectedExceptionPromise = require("../utils/expectedExceptionPromise.js");
web3.eth.expectedOkPromise = require("../utils/expectedOkPromise.js");
web3.eth.getPastTimestamp = require("../utils/getPastTimestamp.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
web3.eth.makeSureHasAtLeast = require("../utils/makeSureHasAtLeast.js");
web3.eth.makeSureAreUnlocked = require("../utils/makeSureAreUnlocked.js");

// Import the smart contracts
const Balance = artifacts.require("./contracts/Balance.sol");

contract('Balance', function(accounts) {
    const MAX_GAS = 2000000;
    const TESTRPC_SLOW_DURATION = 1000;
    const GETH_SLOW_DURATION = 15000;
    const AMOUNT = web3.toWei(0.009, 'ether');

    let isTestRPC, isGeth, slowDuration;
    before("should identify node", function() {
        return web3.version.getNodePromise()
            .then(function(node) {
                isTestRPC = node.indexOf("EthereumJS TestRPC") >= 0;
                isGeth = node.indexOf("Geth") >= 0;
                slowDuration = isTestRPC ? TESTRPC_SLOW_DURATION : GETH_SLOW_DURATION;
            });
    });


    let coinbase, owner, payer, beneficiary1, beneficiary2;
    before("should check accounts", function() {
        assert.isAtLeast(accounts.length, 5, "not enough accounts");

        return web3.eth.getCoinbasePromise()
            .then(function (_coinbase) {
                coinbase = _coinbase;
                // Coinbase gets the rewards, making calculations difficult.
                const coinbaseIndex = accounts.indexOf(coinbase);
                if (coinbaseIndex > -1) {
                    accounts.splice(coinbaseIndex, 1);
                }
                [owner, payer, beneficiary1, beneficiary2] = accounts;
                return web3.eth.makeSureAreUnlocked(accounts);
            })
            .then(function() {
                const initial_balance = web3.toWei(1, 'ether');
                return web3.eth.makeSureHasAtLeast(coinbase, [owner, payer, beneficiary1, beneficiary2], initial_balance)
                    .then(txObj => web3.eth.getTransactionReceiptMined(txObj));
            });
    });

    let instance;
    beforeEach("should deploy a Balance instance", function() {
        return Balance.new({ from: owner, gas: MAX_GAS })
//        return Balance.new()
            .then(function(_instance) {
                instance = _instance;
            });
    });

   
    describe("#Balance()", function() {
    	
        it("should be owned by expected owner", function() {
            this.slow(slowDuration);

            return instance.owner()
                .then(realOwner => assert.strictEqual(owner, realOwner, "not owned by expected owner"));
        });

        it("should have emitted LogCreation event", function() {
            this.slow(slowDuration);

            return web3.eth.getTransactionReceiptMined(instance.transactionHash)
                .then(function(receipt) {
                    const EXPECTED_TOPIC_LENGTH = 2;
                    assert.equal(receipt.logs.length, 1); // just 1 LogCreation event

                    const logEvent = receipt.logs[0];
                    assert.equal(logEvent.topics[0], web3.sha3("LogCreation(address)"));
                    assert.equal(logEvent.topics.length, EXPECTED_TOPIC_LENGTH);

                    const formattedEvent = instance.LogCreation().formatter(logEvent);
                    const name = formattedEvent.event;
                    const ownerArg = formattedEvent.args.owner;
                    assert.equal(name, "LogCreation", "LogCreation name is wrong");
                    assert.equal(ownerArg, owner, "LogCreation arg owner is wrong: " + ownerArg);
                    assert.equal(Object.keys(formattedEvent.args).length + 1, EXPECTED_TOPIC_LENGTH);
                });
        });
    }); 

     before("should verify is mining is in progress", function() {
        return web3.eth.isMining()
            .then(function(mining) {
            	assert.equal(mining, true, "Node not mining");

            });
    });

    describe("#()", function() {
        it("should fail whenever is called", function() {
            this.slow(slowDuration);

            return web3.eth.expectedExceptionPromise(
                function() {
                    return instance.sendTransaction({ from: payer, gas: MAX_GAS, value: 2*AMOUNT });
                },
                MAX_GAS
            );
        });
    });
});
