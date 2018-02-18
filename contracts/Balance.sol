pragma solidity ^0.4.17;

contract Balance {
    event LogCreation(address indexed owner);
    event LogClosed(address indexed caller);
    event LogSplitted(address indexed first, address indexed second, uint256 indexed amount);
    event LogWithdraw(address indexed beneficiary, uint256 indexed amount);
    event LogDeposit(address indexed sender, uint256 indexed amount);

  address public owner;
  mapping (address => uint256) public accounts;

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  function Balance() public {
    owner = msg.sender;
    LogCreation(owner);
  }


  function getVal() public pure returns (uint256)  {
     return 4;
  }
 

  function setBalance(address addr, uint256 amounts) public  {
      accounts[addr] += amounts;
  
  }

  function transfer(address from, address to, uint256 amounts) public {
     if (accounts[from] < amounts)
        return;
      accounts[from] -= amounts;
      accounts[to] += amounts;

  }

  function () public payable {
        revert();
    }
}
