// How to get near testnet account from private key example.
// import * as nearAPI from 'near-api-js';
// const { Near, Account, keyStores, KeyPair } = nearAPI;
//
// // TODO: init account in upper levels.
// const NEAR_ACCOUNT_ID = import.meta.env.VITE_NEAR_ACCOUNT_ID ?? "";
// const NEAR_PRIVATE_KEY = import.meta.env.VITE_NEAR_PRIVATE_KEY ?? "";
//
// const accountId = NEAR_ACCOUNT_ID;
// const privateKey = NEAR_PRIVATE_KEY;
// const keyStore = new keyStores.InMemoryKeyStore();
// keyStore.setKey('testnet', accountId, KeyPair.fromString(privateKey));
//
// console.log('Near Chain Signature (NCS) call details:');
// console.log('Near accountId', accountId);
//
// const config = {
//   networkId: 'testnet',
//   keyStore: keyStore,
//   nodeUrl: 'https://rpc.testnet.near.org',
//   walletUrl: 'https://testnet.mynearwallet.com/',
//   helperUrl: 'https://helper.testnet.near.org',
//   explorerUrl: 'https://testnet.nearblocks.io',
// };
// export const near = new Near(config);
// export const account = new Account(near.connection, accountId);