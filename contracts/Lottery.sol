// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Lottery {
    address public manager;
    address payable[] private players;

    constructor() {
        manager = msg.sender;
    }

    function enter() public payable {
        require(
            msg.value > 0.1 ether,
            "The minimum amount of ETH to enter is 0.1"
        );
        players.push(payable(msg.sender));
    }

    function random() private view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encode(block.difficulty, block.timestamp, players)
                )
            );
    }

    function pickWinner() public restricted {
        uint256 index = random() % players.length;

        address payable winnerAddress = players[index];
        uint256 contractBalance = address(this).balance;

        winnerAddress.transfer(contractBalance);
        players = new address payable[](0);
    }

    modifier restricted() {
        require(
            msg.sender == manager,
            "Only manager can trigger the winner calculation"
        );
        _;
    }

    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }
}
