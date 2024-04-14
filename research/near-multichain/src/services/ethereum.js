import { Web3 } from "web3"
import { bytesToHex } from '@ethereumjs/util';
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import { deriveChildPublicKey, najPublicKeyStrToUncompressedHexPoint, uncompressedHexPointToEvmAddress } from '../services/kdf';
import { Common } from '@ethereumjs/common'


export class Ethereum {
  constructor(chain_rpc, chain_id) {
    this.web3 = new Web3(chain_rpc);
    this.chain_id = chain_id;
    this.queryGasPrice();
  }

  async deriveAddress(accountId, derivation_path) {
    const publicKey = await deriveChildPublicKey(najPublicKeyStrToUncompressedHexPoint(), accountId, derivation_path);
    const address = await uncompressedHexPointToEvmAddress(publicKey);
    return { publicKey: Buffer.from(publicKey, 'hex'), address };
  }

  async queryGasPrice() {
    const maxFeePerGas = await this.web3.eth.getGasPrice();
    const maxPriorityFeePerGas = await this.web3.eth.getMaxPriorityFeePerGas();
    return { maxFeePerGas, maxPriorityFeePerGas };
  }

  async getBalance(accountId) {
    const balance = await this.web3.eth.getBalance(accountId)
    const ONE_ETH = 1000000000000000000n;
    return Number(balance * 100n / ONE_ETH) / 100;
  }

  async createPayload(sender, receiver, amount) {
    const common = new Common({ chain: this.chain_id });

    // Get the nonce & gas price
    const nonce = await this.web3.eth.getTransactionCount(sender);
    console.log('[createPayload] nonce', nonce)
    // const { maxFeePerGas, maxPriorityFeePerGas } = await this.queryGasPrice();
    // console.log('maxFeePerGas', maxFeePerGas)
    // console.log('maxPriorityFeePerGas', maxPriorityFeePerGas)
    const maxFeePerGas = 5000434764n
    const maxPriorityFeePerGas = 1099968447n
    
    // Construct transaction
    const transactionData = {
      nonce,
      gasLimit: 21000,
      maxFeePerGas,
      maxPriorityFeePerGas,
      to: receiver,
      value: BigInt(this.web3.utils.toWei(amount, "ether")),
      chain: this.chain_id,
    };

    // Return the message hash
    const transaction = FeeMarketEIP1559Transaction.fromTxData(transactionData, { common });
    const payload = transaction.getHashedMessageToSign();
    return { transaction, payload };
  }

  // It duplicated methods.
  async prepareSignatureForEthFromPayloadData(
      // should be returned by contract.
      transactionHash,
      wallet,
      senderAddress,
      receiver,
      amount
  ) {
    const { transaction } = await this.createPayload(senderAddress, receiver, amount);
    console.log(`[prepareSignatureForEthFromPayloadData] transaction: ${JSON.stringify(transaction)}`)
    return await this.prepareSignatureForEth(
        transactionHash,
        // another wallet should be used (TODO :test).
        wallet,
        transaction,
        senderAddress,
    )
  }

  async prepareSignatureForEth(
      transactionHash,
      wallet,
      transaction,
      senderAddress,
  ) {
    console.log("[prepareSignatureForEth] transactionHash: ", transactionHash)
    console.log("[prepareSignatureForEth] wallet: ", wallet)
    console.log("[prepareSignatureForEth] transaction: ", JSON.stringify(transaction))
    console.log("[prepareSignatureForEth] senderAddress: ", senderAddress)
    const [big_r, big_s] = await wallet.getTransactionResult(transactionHash);
    console.log('[prepareSignatureForEth] awaited!')

    // reconstruct the signature
    const r = Buffer.from(big_r.substring(2), 'hex');
    const s = Buffer.from(big_s, 'hex');
    console.log(r)
    console.log(s)

    const candidates = [0n, 1n].map((v) => transaction.addSignature(v, r, s));
    const signature = candidates.find((c) => c.getSenderAddress().toString().toLowerCase() === senderAddress.toLowerCase());

    if (!signature) {
      throw new Error("Signature is not valid");
    }

    if (signature.getValidationErrors().length > 0) throw new Error("Transaction validation errors");
    if (!signature.verifySignature()) throw new Error("Signature is not valid");

    return signature;
  }

  async requestSignatureToMPC(wallet, contractId, path, ethPayload, transaction, sender) {
    // Ask the MPC to sign the payload
    const payload = Array.from(ethPayload.reverse());
    const payloadData = {data: payload}
    console.log(`[requestSignatureToMPC] payloadData: ${JSON.stringify(payloadData)}, type: ${typeof payload}`)
    console.log(`[requestSignatureToMPC] path: ${path}`)
    const request = await wallet.callMethod({ contractId, method: 'sign', args: { payload, path, key_version: 0 }, gas: '250000000000000' });
    return await this.prepareSignatureForEth(
      request.transaction.hash,
      wallet,
      transaction,
      sender);
  }

  // This code can be used to actually relay the transaction to the Ethereum network
  async relayTransaction(signedTransaction) {
    const serializedTx = bytesToHex(signedTransaction.serialize());
    const relayed = await this.web3.eth.sendSignedTransaction(serializedTx);
    return relayed.transactionHash
  }
}
