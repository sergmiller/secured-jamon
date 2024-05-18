// TODO
import {generateAddress} from "./chainsig/kdf";
import ethereum from "./chainsig/ethereum";
import {sendNearTransaction} from "./chainsig/utils";

const MPC_CONTRACT_ID = import.meta.env.VITE_MPC_CONTRACT_ID ?? "";
const MPC_PUBLIC_KEY = import.meta.env.VITE_MPC_PUBLIC_KEY ?? "";

const NEAR_ACCOUNT_ID = import.meta.env.VITE_NEAR_ACCOUNT_ID ?? "";

const NEAR_PROXY_ACCOUNT_ID = import.meta.env.VITE_NEAR_PROXY_ACCOUNT_ID ?? "";
// TODO: it should not be hardhcoded as it is salt.
const MPC_PATH = import.meta.env.VITE_MPC_PATH ?? "";
// TODO: assert on all envs.
console.log(MPC_PUBLIC_KEY, MPC_PATH)

export class JamonSwapClient {
    // Kinda engine for Near chain transaction {custom wallet, near account}.
    private account: any;
    constructor(wallet) {
        this.account = wallet;
    }

    // Generate Derived Address in the Ethereum Network
    // It is aka Offer Id.
    // TODO: add ethereum desired address as salt.
    async getDerivedEthAddress() {
        const {address} = await generateAddress({
            publicKey: MPC_PUBLIC_KEY,
            accountId: NEAR_PROXY_ACCOUNT_ID,
            path: MPC_PATH,
            chain: "ethereum",
          });
        return address;
    }

    // Create Offer on Near chain: exchange N Eth on Eth chain on M Near on Near chain.
    async createOffer({derivedAddress, expectedAmount}) {
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
    async withdrawEth() {}

    // Seller Withdraw his Near.
    async withdrawNear() {}

    // The Buyer knew that Seller deposited on derived account Eth himself (or currently it fails with InsufficientFundsOnTargetChain)!
    //  Thus, he is ready to accept the Offer:
    // Deposit Near on Near chain, and receive Eth from derived account for his address on Ethereum chain.
    // It is supposed that the buyer knew balance to transfer. TODO: relocate this logic inside.
    async acceptOffer({derivedAddress, buyerEthAddress, amountEth}) {
        await ethereum.send(
            {
            from: derivedAddress,
            to: buyerEthAddress,
            amount: amountEth,
            mpcPath: MPC_PATH,
            nearAccount: this.account,
            nearContractId: NEAR_PROXY_ACCOUNT_ID,
            derivedAddress,
        });
    }

    // async createDeal() {
    //     // TODO: Generate address on eth to deposit money.
    //     // Use NEAR_PROXY_ACCOUNT_ID == our deployed contract that proxies requests to Jamon contract.
    //     const generatedAddress = await generateAddress({
    //         publicKey: "publicKey",
    //         accountId: jamonContractAccountId,
    //         path: "path",
    //     })
    //     console.log()
    //
    //
    //
    // }

}