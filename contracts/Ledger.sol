// SPDX-License-Identifier: MIT

pragma solidity >= 0.5.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Ledger is Ownable {
    mapping(bytes32 => uint256) public records;

    function record(bytes32 id) public onlyOwner {
        require(records[id] != 0, "already in ledger");
        records[id] = block.number;
    }

    function contains(bytes32 id) public view returns (uint256) {
        return records[id];
    }
}