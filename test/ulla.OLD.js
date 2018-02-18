var balanceTest = artifacts.require('./contracts/Balance.sol');

contract('Balance:getName', function(accounts) {

it("should return a correct string", function(done) {
    var balance_test = balanceTest.deployed();
    balance_test.then(function(contract) {
      return contract.getName.call(); // **IMPORTANT
    }).then(function(result){
      assert.isTrue(result === "Ciao");
      done();
    })
  });
});

