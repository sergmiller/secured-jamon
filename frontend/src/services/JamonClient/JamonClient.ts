import {generateAddress} from "./chainsig/kdf";
import ethereum from "./chainsig/ethereum";
import {sendNearTransaction} from "./chainsig/utils";
import * as nearAPI from "near-api-js";
import {tokenValueToRounded, valueToTokenValue} from "./utils";

// Needed to generate derived account.
const MPC_CONTRACT_ID = import.meta.env.VITE_MPC_CONTRACT_ID ?? "";
const MPC_PUBLIC_KEY = import.meta.env.VITE_MPC_PUBLIC_KEY ?? "";
// Our Target Contract.
const NEAR_PROXY_ACCOUNT_ID = import.meta.env.VITE_NEAR_PROXY_ACCOUNT_ID ?? "";
const BLOCKSCOUT_ENDPOINT = ""
// TODO: assert on all envs.
console.log(MPC_PUBLIC_KEY)

export class JamonSwapClient {
    // Kinda engine for Near chain transaction {custom wallet, near account}.
    private account: any;
    constructor(wallet) {
        this.account = wallet;
    }

    generateOfferId(currentUserAddress) {
        return `offerId${currentUserAddress}.${Date.now()}`;
    }

    serializeNearToWei(amountNear) {
        return nearAPI.utils.format.parseNearAmount(amountNear)
    }

    serializeWeiToEth(amountWei) {
        return tokenValueToRounded(amountWei, 18);
    }

    serializeEthToWei(amountEth) {
        return valueToTokenValue(amountEth, 18);
    }

    // Generate Derived Address in the Ethereum Network
    // It is aka Offer Id.
    // TODO: add ethereum desired address as salt.
    async getDerivedEthAddress(offerId) {
        const {address} = await generateAddress({
            publicKey: MPC_PUBLIC_KEY,
            accountId: NEAR_PROXY_ACCOUNT_ID,
            path: offerId,
            chain: "ethereum",
          });
        return address.toLowerCase();
    }

    // Create Offer on Near chain: exchange N Eth on Eth chain on M Near on Near chain.
    async createOffer({offerId, expectedAmount}) {
        const derivedAddress = await this.getDerivedEthAddress(offerId);
        const res = await sendNearTransaction({
            nearSigner: this.account,
            contractId: NEAR_PROXY_ACCOUNT_ID,
            method: 'create_offer',
            args: {
                derivedAddress,
                expectedAmount,
            },
            attachedDeposit: 0,
        })
        console.log(`[createOffer] Sent transaction: got ${res}`)
    }

    // Deposit Eth on Eth chain for the Offer.
    // TODO.
    async depositBySellerOnTargetChain() {}

    // Check if Seller deposited Eth on Eth chain for the Offer. Buyer checks it himself.
    async getBalanceOnTargetChain(offerId) {
        const address = await this.getDerivedEthAddress(offerId)
        console.log(`[getBalanceOnTargetChain] Getting balance for ${address}`)
        return await ethereum.getBalance({address});
    }

    // Buyer Withdraw his Eth via MPC contract.
    // TODO: separate logic from acceptOffer.
    async withdrawByBuyer() {
        throw new Error("Not implemented.");
    }

    // Seller withdraw his Near after Buyer accepted the Offer.
    async withdrawBySeller({offerId}) {
        const derivedAddress = await this.getDerivedEthAddress(offerId);
        const res = await sendNearTransaction({
            nearSigner: this.account,
            contractId: NEAR_PROXY_ACCOUNT_ID,
            method: 'withdrawBySeller',
            args: {
                derivedAddress,
            },
            attachedDeposit: 0,
        })
        console.log(`[withdrawBySeller] Sent transaction: got ${res}`)
    }

    // TODO: remove
    async test_deposit(amountNear) {
        const res = await sendNearTransaction({
            nearSigner: this.account,
            contractId: NEAR_PROXY_ACCOUNT_ID,
            method: 'test_deposit',
            args: {
            },
            attachedDeposit: this.serializeNearToWei(amountNear),
        })
    }

    // The Buyer knew that Seller deposited on derived account Eth himself (or currently it fails with InsufficientFundsOnTargetChainError)!
    //  Thus, he is ready to accept the Offer:
    // Deposit Near on Near chain, and receive Eth from derived account for his address on Ethereum chain.
    // It is supposed that the buyer knew balance to transfer. TODO: relocate this logic inside.
    async acceptOffer({offerId, buyerEthAddress, amountEth, amountDepositNear}) {
        const derivedAddress = await this.getDerivedEthAddress(offerId);

        // TODO: calculate amount to simplify the flow...

        await ethereum.send(
            {
            from: derivedAddress,
            to: buyerEthAddress,
            amount: amountEth.toString(),
            mpcPath: offerId,
            nearAccount: this.account,
            nearContractId: NEAR_PROXY_ACCOUNT_ID,
            derivedAddress,
            attachedDepositNear: amountDepositNear,
        });
    }
}