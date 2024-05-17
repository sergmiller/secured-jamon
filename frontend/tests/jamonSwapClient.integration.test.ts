// For integration tests on Near testnet with deployed contract via account (wallet) from private key from env.
import { expect, test } from "vitest";
import {JamonSwapClient} from "../src/services/JamonClient/JamonClient";

import * as nearAPI from 'near-api-js';
const { Near, Account, keyStores, KeyPair } = nearAPI;

const INTEGRATION_TEST_TIMEOUT = 300000000;

// TODO: init account in upper levels.
const NEAR_ACCOUNT_ID = import.meta.env.VITE_NEAR_ACCOUNT_ID ?? "";
const NEAR_PRIVATE_KEY = import.meta.env.VITE_NEAR_PRIVATE_KEY ?? "";

const accountId = NEAR_ACCOUNT_ID;
const privateKey = NEAR_PRIVATE_KEY;
const keyStore = new keyStores.InMemoryKeyStore();
keyStore.setKey('testnet', accountId, KeyPair.fromString(privateKey));

console.log('Near Chain Signature (NCS) call details:');
console.log('Near accountId', accountId);

const config = {
  networkId: 'testnet',
  keyStore: keyStore,
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://testnet.mynearwallet.com/',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://testnet.nearblocks.io',
};
export const near = new Near(config);
export const account = new Account(near.connection, accountId);


test("#jamonSwapClient", async () => {
    const client = new JamonSwapClient(
        account,
    )
    const address = await client.getDerivedEthAddress()
    console.log('Got Derived address: ', address)

    await client.acceptDeal(
    {
        buyerEthAddress: "0x460b414B401c5560a59784b7e71850890C28B213", amountEth: "0.0002"
    })



  // TODO: not sure if have to support local env in git!
  // expect(await getDeployment("local")).toEqual({
  //   core: "0x09635F643e140090A9A8Dcd712eD6285858ceBef",
  //   flt: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  //   usdc: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  //   chainId: 31337,
  // });
}, INTEGRATION_TEST_TIMEOUT);
