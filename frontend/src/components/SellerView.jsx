import { Ethereum } from "../services/ethereum.js";
import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/debounce.jsx";
import PropTypes from 'prop-types';
import {JamonSwapClient} from "../services/JamonClient/JamonClient.ts";

const Sepolia = 11155111;
const Eth = new Ethereum('https://rpc2.sepolia.org', Sepolia);
const DEFAULT_GAS = '250000000000000'

// Seller
export function SellerView({ props: { setStatus, wallet, MPC_CONTRACT, JAMON_SWAP_CONTRACT_ID } }) {

  const [receiver, setReceiver] = useState("0xe0f3B7e68151E9306727104973752A415c2bcbEb");
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("request");
  const [signedTransaction, setSignedTransaction] = useState(null);
  const [senderAddress, setSenderAddress] = useState("")
  const [transactionHashHack, setTransactionHashHack] = useState("")
  const [payloadPrepared, setPayloadPrepared] = useState("")
  const [transactionRaw, setTransactionRaw] = useState("")
  // TODO: new code.
  const [createdDeal, setCreatedDeal] = useState("")
  const [sellerDepositToEthResult, setSellerDepositToEthResult] = useState("")

  const [derivation, setDerivation] = useState("cross-contract-jamon5.testnet");
  const [offerId, setOfferId] = useState("")
  const [derivedAddress, setDerivedAddress] = useState("")
  const derivationPath = useDebounce(derivation, 1000);

  // useEffect(() => { setEthAddress(derivationPath) }, [derivationPath]);

  // async function setEthAddress() {
  //   setStatus('Querying your address and balance');
  //   setSenderAddress('Deriving address...');
  //
  //   const { address } = await Eth.deriveAddress(wallet.accountId, derivationPath);
  //   const balance = await Eth.getBalance(address);
  //
  //   setSenderAddress(address);
  //   setStatus(`Your Ethereum address is: ${address}, balance: ${balance} ETH`);
  // }

  async function chainSignature() {
    setStatus('🏗️ Creating transaction');
    const { transaction, payload } = await Eth.createPayload(senderAddress, receiver, amount);
    console.log("TODODODOODO debug transaction: ", JSON.stringify(transaction))

    setStatus(`🕒 Asking ${MPC_CONTRACT} to sign the transaction, this might take a while`);
    try {
      const signedTransaction = await Eth.requestSignatureToMPC(wallet, MPC_CONTRACT, derivationPath, payload, transaction, senderAddress);
      setSignedTransaction(signedTransaction);
      console.log(`TODO debug signedTransaction: ${JSON.stringify(signedTransaction)}`)
      setStatus(`✅ Signed payload ready to be relayed to the Ethereum network`);
      setStep('relay');
    } catch(e) {
      setStatus(`❌ Error: ${e.message}`);
      setLoading(false);
    }
  }

  const handleDerivationChange = (event) => {
    setStatus('Derivation path changed');
    setSenderAddress('Waiting for you to stop typing...');
    setDerivation(event.target.value);
  }

  const handleTransactionHashHack = (event) => {
    setTransactionHashHack(event.target.value);
  }

  async function handleCreateOffer() {
    console.log('[handleCreateOffer]...')
    setLoading(true);
    // TODO: set status

    const client = new JamonSwapClient(
        wallet,
    )
    const _offerId = client.generateOfferId(wallet.accountId)
    setOfferId(_offerId)
    setDerivedAddress(await client.getDerivedEthAddress(_offerId))

    console.log(`[handleCreateOffer] Create offer with amount: ${amount} and offerId; ${_offerId}`, )
    const res = await client.createOffer({
        offerId: _offerId,
        expectedAmount: amount,
    })
    setLoading(false);
  }

  const UIChainSignature = async () => {
    setLoading(true);
    await chainSignature();
    setLoading(false);
  }

  const handleWithdraw = async () => {
    setLoading(true);
    setStatus(`Call ${JAMON_SWAP_CONTRACT_ID}...`)
    const client = new JamonSwapClient(wallet)
    try{
      const request = await client.withdrawBySeller(offerId)
      setStatus(`✅ Successful: TODO: transaction hash.`);
      // setCreatedDeal(`https://sepolia.etherscan.io/tx/${request.transaction.hash}`)
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
    }
    setLoading(false);
  }

  return (
      <>
        <div className="row mb-3">Create Offer to sell your Eth (Sepolia)</div>
        <p className="small">
          You need to deal about offer details with Buyer through custom channel. After you have a Deal - you submit you
          requirements to the Jamon Swap Contract.
        </p>
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label col-form-label-sm">Amount:</label>
          <div className="col-sm-10">
            <input type="number" className="form-control form-control-sm" value={amount}
                   onChange={(e) => setAmount(e.target.value)} step="1" disabled={loading}/>
            <div className="form-text"> Near units</div>
          </div>
        </div>
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label col-form-label-sm">OfferId:</label>
          <div className="col-sm-10">
            <input type="text" className="form-control form-control-sm" value={offerId} disabled={true}/>
            <div className="form-text" id="eth-sender"> Offer Id in the Jamon Swap Contract</div>
          </div>
        </div>

        <div className="text-center">
          <button className="btn btn-primary text-center" onClick={handleCreateOffer}
                  disabled={loading}> Create Offer
          </button>
        </div>

        <br/>

        <div className="row mb-3">Deposit Eth to Jamon Swap derived Address</div>
        <p className="small">
          Now you need to deposit Eth (Sepolia testnet) to the derived address controlled by the Jamon Swap Contract
          (check below).
          Buyer will ensure that you deposited to this address before he will accept the Offer.
        </p>
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label col-form-label-sm">Address:</label>
          <div className="col-sm-10">
            <input type="text" className="form-control form-control-sm" value={derivedAddress} disabled={true}/>
            <div className="form-text" id="eth-sender"> Derived Address controlled by Jamon Swap.</div>
          </div>
        </div>

        <div className="text-center">
          <button className="btn btn-primary text-center" onClick={null}
                  disabled={true}> TODO: Deposit Eth
          </button>
        </div>

        <br/>
        <div className="row mb-3">Withdraw Near</div>
        <p className="small">
          After Buyer Deposited Near to Jamon Contract you are free to withdraw your Near (testnet) from the contract.
          <br/>
          TODO: check that buyer deposited.
        </p>
        <div className="text-center">
          <button className="btn btn-primary text-center" onClick={handleWithdraw}
                  disabled={loading}> Withdraw
          </button>
        </div>

        <br/>
        <div className="row mb-3">Cancel Offer</div>
        <p className="small">
          If you decided to cancel the Offer. Your deposited value will be returned to you (minus gas on Sepolia).<br/>
          TODO: implement.
        </p>
        <div className="text-center">
          <button className="btn btn-primary text-center" onClick={null}
                  disabled={true}> Cancel Offer
          </button>
        </div>
      </>
  )
}

SellerView.propTypes = {
  props: PropTypes.shape({
    setStatus: PropTypes.func.isRequired,
    wallet: PropTypes.object.isRequired,
    MPC_CONTRACT: PropTypes.string.isRequired,
    JAMON_SWAP_CONTRACT_ID: PropTypes.string.isRequired,
  }).isRequired
};
