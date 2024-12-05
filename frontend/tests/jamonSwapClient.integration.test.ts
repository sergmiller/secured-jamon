// For integration tests on Near testnet with deployed contract via account (wallet) from private key from env.
import { expect, test } from "vitest";
import {JamonSwapClient} from "../src/services/JamonClient/JamonClient";

import * as nearAPI from 'near-api-js';
const { Near, Account, keyStores, KeyPair } = nearAPI;

const INTEGRATION_TEST_TIMEOUT = 300000000;

// TODO: init account in upper levels.
const NEAR_ACCOUNT_ID_SELLER = import.meta.env.VITE_NEAR_ACCOUNT_ID ?? "";
const NEAR_PRIVATE_KEY_SELLER = import.meta.env.VITE_NEAR_PRIVATE_KEY ?? "";

const NEAR_ACCOUNT_ID_BUYER= import.meta.env.VITE_NEAR_ACCOUNT_ID_TEST_BUYER ?? "";
const NEAR_PRIVATE_KEY_BUYER= import.meta.env.VITE_NEAR_PRIVATE_KEY_TEST_BUYER ?? "";

const keyStore = new keyStores.InMemoryKeyStore();
keyStore.setKey('testnet', NEAR_ACCOUNT_ID_SELLER, KeyPair.fromString(NEAR_PRIVATE_KEY_SELLER));
keyStore.setKey('testnet', NEAR_ACCOUNT_ID_BUYER, KeyPair.fromString(NEAR_PRIVATE_KEY_BUYER));

console.log('Near Chain Signature (NCS) call details:');
console.log('Near Seller accountId', NEAR_ACCOUNT_ID_SELLER);

const config = {
  networkId: 'testnet',
  keyStore: keyStore,
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://testnet.mynearwallet.com/',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://testnet.nearblocks.io',
};
export const near = new Near(config);
const accountSeller = new Account(near.connection, NEAR_ACCOUNT_ID_SELLER);
const accountBuyer = new Account(near.connection, NEAR_ACCOUNT_ID_BUYER);


test("#jamonSwapClient", async () => {
    const clientSeller = new JamonSwapClient(
        accountSeller,
    )
    const clientBuyer = new JamonSwapClient(
        accountBuyer,
    )
    const offerId = "offerIdnear-phd-again.testnet.1716153474750"//client.generateOfferId(NEAR_ACCOUNT_ID)
    console.log('Generate offerId', offerId)

    const derivedAddress = await clientSeller.getDerivedEthAddress(offerId)
    console.log('Got Derived address: ', derivedAddress)

    await clientSeller.createOffer(
        {
            offerId,
            expectedAmount: 2,
        }
    )

    // TODO: check that Eth for derived account exists.

    await clientBuyer.acceptOffer(
    {
        offerId,
        buyerEthAddress: "0x460b414B401c5560a59784b7e71850890C28B213",
        amountEth: "0.0002",
        amountDepositNear: "2",
    })

    await clientSeller.withdrawBySeller(
        {offerId}
    )
}, INTEGRATION_TEST_TIMEOUT);
