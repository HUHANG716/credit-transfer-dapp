import Web3 from "web3";
import dotenv from "dotenv";

dotenv.config();
const web3Provider = new Web3.providers.WebsocketProvider(process.env.WEB3_PROVIDER_URL || "ws://localhost:8545");
const web3 = new Web3(web3Provider);
const account = web3.eth.accounts.privateKeyToAccount(process.env.ORACLE_PRIVATE_KEY);
console.log(`[Oracle address] - ${account.address}`);

account && web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;
export default web3;
