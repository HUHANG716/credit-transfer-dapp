### pre-requisites

- nodejs
- truffle
- ganache-cli/ganache-gui
- metamask
- Infura account for IPFS service

### truffle

- `npm install -g truffle`

### ganache

- make sure you have `ganache-cli` or `ganache-gui` running on port 8545 and network id 5777
- if you want to use a different port/different network id, you will need to update the `truffle-config.js` file in directory `smart-contracts` and `.env` file in directory `fe`
  `
- choose 'MERGE' for 'HARDFORK' options in ganache settings

### metamask

- make sure you have metamask installed and connected to the ganache network
- import some accounts from ganache into metamask

### infura

- go to [infura](https://infura.io/)
- create an infura account
- you may need to bind a credit card to use the service but you will not be charged in the free tier
- create a new api key
- copy the api key and api private key and paste them into the `.env` file

### deploy the smart contracts

- `cd` into the `smart-contracts` directory
- open `oracle.config.js` and set the public key of an account for `oracle_addr`
- run `npm run migrate` and wait for the contracts to be deployed on the ganache network
- you will see contract artifact files in the `fe/src/contracts` directory and `be/src/contracts` after the migration is complete
- you should set a dedicated gateway with a custom subdomain like below
  ![Alt text](1688546791919.png)
- copy the gateway url and paste it into the `.env` file
  the format is like: `https://xxx.infura-ipfs.io/ipfs`

### install and start backend dependencies

- `cd` into the `be` directory
- set the private key of the account you choose as an oracle for `ORACLE_PRIVATE_KEY` in the `.env` file
- run `npm install` to install the dependencies
- run `npm start` to start the backend server
- the server will start on port `3001`


### install frontend dependencies and start the app

- `cd` into the `fe` directory
- run `npm install` to install the dependencies
- run `npm start` to start the app
- the app should open in your browser at `http://localhost:3000`
