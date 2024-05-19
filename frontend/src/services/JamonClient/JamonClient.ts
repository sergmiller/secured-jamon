// TODO
import {generateAddress} from "./chainsig/kdf";
import ethereum from "./chainsig/ethereum";
import {sendNearTransaction} from "./chainsig/utils";

const MPC_CONTRACT_ID = import.meta.env.VITE_MPC_CONTRACT_ID ?? "";
const MPC_PUBLIC_KEY = import.meta.env.VITE_MPC_PUBLIC_KEY ?? "";

const NEAR_ACCOUNT_ID = import.meta.env.VITE_NEAR_ACCOUNT_ID ?? "";

const NEAR_PROXY_ACCOUNT_ID = import.meta.env.VITE_NEAR_PROXY_ACCOUNT_ID ?? "";
// TODO: assert on all envs.
console.log(MPC_PUBLIC_KEY)

export class JamonSwapClient {
    // Kinda engine for Near chain transaction {custom wallet, near account}.
    private account: any;
    constructor(wallet) {
        this.account = wallet;
    }

    // Generate Derived Address in the Ethereum Network
    // It is aka Offer Id.
    // TODO: add ethereum desired address as salt.
    async getDerivedEthAddress(mpcPath) {
        const {address} = await generateAddress({
            publicKey: MPC_PUBLIC_KEY,
            accountId: NEAR_PROXY_ACCOUNT_ID,
            path: mpcPath,
            chain: "ethereum",
          });
        return address;
    }

    // Create Offer on Near chain: exchange N Eth on Eth chain on M Near on Near chain.
    async createOffer({offerSalt, expectedAmount}) {
        const derivedAddress = await this.getDerivedEthAddress(offerSalt);
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
    async depositOfferEth() {}

    // Check if Seller deposited Eth on Eth chain for the Offer.
    async checkDepositEth() {}

    // Buyer Withdraw his Eth via MPC contract.
    // TODO: separate logic from acceptOffer.
    async withdrawByBuyer() {
        throw new Error("Not implemented.");
    }

    // Seller withdraw his Near after Buyer accepted the Offer.
    async withdrawBySeller({offerSalt}) {
        const derivedAddress = await this.getDerivedEthAddress(offerSalt);
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

    // The Buyer knew that Seller deposited on derived account Eth himself (or currently it fails with InsufficientFundsOnTargetChainError)!
    //  Thus, he is ready to accept the Offer:
    // Deposit Near on Near chain, and receive Eth from derived account for his address on Ethereum chain.
    // It is supposed that the buyer knew balance to transfer. TODO: relocate this logic inside.
    async acceptOffer({offerSalt, buyerEthAddress, amountEth}) {
        const derivedAddress = await this.getDerivedEthAddress(offerSalt);

        // TODO: calculate amount to simplify the flow...

        await ethereum.send(
            {
            from: derivedAddress,
            to: buyerEthAddress,
            amount: amountEth,
            mpcPath: offerSalt,
            nearAccount: this.account,
            nearContractId: NEAR_PROXY_ACCOUNT_ID,
            derivedAddress,
        });
    }
}