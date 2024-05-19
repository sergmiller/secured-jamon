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
    const offerId = "random.foo.testnet"
    const client = new JamonSwapClient(
        account,
    )
    const derivedAddress = await client.getDerivedEthAddress(offerId)
    console.log('Got Derived address: ', derivedAddress)

    await client.createOffer(
        {
            offerSalt: offerId,
            expectedAmount: 1,
        }
    )

    // TODO: check that Eth for derived account exists.

    await client.acceptOffer(
    {
        offerSalt: offerId,
        buyerEthAddress: "0x460b414B401c5560a59784b7e71850890C28B213",
        amountEth: "0.0002",
    })

    await client.withdrawBySeller(
        {offerSalt: offerId}
    )
}, INTEGRATION_TEST_TIMEOUT);
