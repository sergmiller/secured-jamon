// TODO
import {generateAddress} from "./chainsig/kdf";
import ethereum from "./chainsig/ethereum";

const MPC_CONTRACT_ID = import.meta.env.VITE_MPC_CONTRACT_ID ?? "";
const MPC_PUBLIC_KEY = import.meta.env.VITE_MPC_PUBLIC_KEY ?? "";

const NEAR_ACCOUNT_ID = import.meta.env.VITE_NEAR_ACCOUNT_ID ?? "";

const NEAR_PROXY_ACCOUNT_ID = import.meta.env.VITE_NEAR_PROXY_ACCOUNT_ID ?? "";
// TODO: it should not be hardhcoded as it is salt.
const MPC_PATH = import.meta.env.VITE_MPC_PATH ?? "";
// TODO: assert on all envs.
console.log(MPC_PUBLIC_KEY, MPC_PATH)

export class JamonSwapClient {
    constructor() {
    }

    // Generate Derived Address in the Ethereum Network
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

    // The Buyer new that Seller deposited on derived account Eth himself!
    //  Thus he is ready to accept the Deal:
    // Deposit Near on Near chain, and receive Eth from derived account for his address on Ethereum chain.
    async acceptDeal({buyerEthAddress, amountEth}) {
        const derivedAddress = await this.getDerivedEthAddress();
        await ethereum.send({ from: derivedAddress, to: buyerEthAddress, amount: amountEth, mpcPath: MPC_PATH });
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