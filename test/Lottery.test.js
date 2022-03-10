const assert = require('assert');
const ganache = require('ganache-cli');
const { it } = require('mocha');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { abi, evm } = require('../compile');

let accounts;
let lottery;

beforeEach(async () => {
    // Get list of accounts
    accounts = await web3.eth.getAccounts();

    // use an account to deploy a contract
    lottery = await new web3.eth.Contract(abi)
        .deploy({ data: evm.bytecode.object })
        .send({ from: accounts[0], gas: '1000000' });
});

describe('Lottery', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('allows an account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.2', 'ether')
        });
        const players = await lottery.methods
            .getPlayers()
            .call({ from: accounts[0] });

        assert.equal(1, players.length);
        assert.equal(accounts[0], players[0]);
    });

    it('allows multiple accounts to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.2', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.2', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.2', 'ether')
        });

        const players = await lottery.methods
            .getPlayers()
            .call({ from: accounts[0] });

        assert.equal(3, players.length);
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
    });

    it('should throw an error if minimum not satisfied', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 1
            });
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it('only manager can call pick winner', async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            });
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it('should pick a winner and reset the players array', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        });

        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({ from: accounts[0] });
        const updatedBalance = await web3.eth.getBalance(accounts[0]);
        const difference = updatedBalance - initialBalance;

        assert(difference > web3.utils.toWei('1.8', 'ether'));

        const players = await lottery.methods
            .getPlayers()
            .call({ from: accounts[0] });

        assert.equal(0, players.length);
    });
});
