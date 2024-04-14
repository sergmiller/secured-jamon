import { Ethereum } from "../services/ethereum.js";
import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/debounce.jsx";
import PropTypes from 'prop-types';

const Sepolia = 11155111;
const Eth = new Ethereum('https://rpc2.sepolia.org', Sepolia);
const DEFAULT_GAS = '250000000000000'

// Seller
export function BitcoinView({ props: { setStatus, wallet, MPC_CONTRACT, MARKET_CONTRACT } }) {

  const [receiver, setReceiver] = useState("0xe0f3B7e68151E9306727104973752A415c2bcbEb");
  const [amount, setAmount] = useState(0.01);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("request");
  const [signedTransaction, setSignedTransaction] = useState(null);
  const [senderAddress, setSenderAddress] = useState("")
  const [transactionHashHack, setTransactionHashHack] = useState("")
  const [payloadPrepared, setPayloadPrepared] = useState("")
  const [transactionRaw, setTransactionRaw] = useState("")
  // TODO: new code.
  const [acceptDeal, setAcceptDeal] = useState("")
  const [sellerDepositToEthResult, setSellerDepositToEthResult] = useState("")
  const [withdrawAddress, setWithdrawAddress] = useState("")


  const [derivation, setDerivation] = useState("cross-contract-jamon5.testnet");
  const derivationPath = useDebounce(derivation, 1000);

  useEffect(() => { setEthAddress(derivationPath) }, [derivationPath]);

  async function setEthAddress() {
    setStatus('Querying your address and balance');
    setSenderAddress('Deriving address...');

    const { address } = await Eth.deriveAddress(wallet.accountId, derivationPath);
    const balance = await Eth.getBalance(address);

    setSenderAddress(address);
    setStatus(`Your Ethereum address is: ${address}, balance: ${balance} ETH`);
  }

  async function getSignatureForEth() {
    console.log(`TODO DEBUG, send transactionHashHack: ${transactionHashHack}`)
    const result = await Eth.prepareSignatureForEthFromPayloadData(
      transactionHashHack,
      wallet,
      senderAddress,
      receiver,
      amount
    );
    console.log(`getSignatureForEth result: ${JSON.stringify(result)}`)
  }

  async function chainSignature() {
    setStatus('🏗️ Creating transaction');
    const { transaction, payload } = await Eth.createPayload(senderAddress, receiver, amount);

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

  async function relayTransaction() {
    setLoading(true);
    setStatus('🔗 Relaying transaction to the Ethereum network... this might take a while');

    try{
      const txHash = await Eth.relayTransaction(signedTransaction);
      setStatus(`✅ Successful: https://sepolia.etherscan.io/tx/${txHash}`);
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
    }

    setStep('request');
    setLoading(false);
  }

  const handleWithdrawAddress = (event) => {
    setWithdrawAddress(event.target.value);
  }

  const handleTransactionHashHack = (event) => {
    setTransactionHashHack(event.target.value);
  }

  async function handleShowPayloadAndTransaction() {
    console.log('senderAddress', senderAddress)
    console.log('receiver', receiver)
    console.log('amount', amount)
    const { transaction, payload } = await Eth.createPayload(senderAddress, receiver, amount);
    setTransactionRaw(JSON.stringify(transaction));
    const payloadReversed = Array.from(payload.reverse());
    setPayloadPrepared(JSON.stringify({data: payloadReversed}));
  }

  const UIChainSignature = async () => {
    setLoading(true);
    await chainSignature();
    setLoading(false);
  }

  const handleAcceptDeal = async () => {
    setLoading(true);
    setStatus(`Call ${MARKET_CONTRACT} with accept_offer and withdraw_address: ${withdraw_address}...`)
    try{
      const request = await wallet.callMethod(
        { contractId: MARKET_CONTRACT, method: 'accept_offer', args: { withdraw_address: withdrawAddress }, gas: DEFAULT_GAS });
      setStatus(`✅ Successful: https://sepolia.etherscan.io/tx/${request.transaction.hash}`);
      setAcceptDeal(`https://sepolia.etherscan.io/tx/${request.transaction.hash}`)
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
    }
    setLoading(false);
  }

  return (
      <>
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label col-form-label-sm">From (Seller Near):</label>
          <div className="col-sm-10">
            <input type="text" className="form-control form-control-sm" value={derivation}
                   onChange={handleWithdrawAddress} disabled={loading}/>
            <div className="form-text" id="eth-sender"> {senderAddress} </div>
          </div>
        </div>
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label col-form-label-sm">To (Buyer):</label>
          <div className="col-sm-10">
            <input type="text" className="form-control form-control-sm" value={receiver}
                   onChange={(e) => setReceiver(e.target.value)} disabled={loading}/>
          </div>
        </div>
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label col-form-label-sm">Amount:</label>
          <div className="col-sm-10">
            <input type="number" className="form-control form-control-sm" value={amount}
                   onChange={(e) => setAmount(e.target.value)} step="0.01" disabled={loading}/>
            <div className="form-text"> Ethereum units</div>
          </div>
        </div>
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label col-form-label-sm">Eth Payload:</label>
          <div className="col-sm-10">
            <input type="text" className="form-control form-control-sm" value={payloadPrepared}
                   onChange={(e) => setReceiver(e.target.value)} disabled={true}/>
          </div>
        </div>

        <div className="text-center">
          <button className="btn btn-primary text-center" onClick={handleShowPayloadAndTransaction}
                  disabled={loading}> Show payload
          </button>
        </div>

        <br/>
        <div className="row mb-3">Accept Deal on Jamon Market Contract</div>
        <div className="text-center">
          <div className="text-center">To accept the Deal you ought to transfer required amount of USDC within the
            transaction. Note, accept the Deal only if you sure that TODO: derived market address deposited with
            ${amount}. of DAI.
          </div>
          {
              acceptDeal != "" &&
              <input type="text" className="form-control form-control-sm" value={acceptDeal} disabled={true}/>
          }
          {
              acceptDeal != "" &&
              <div className="text-center">You accepted the Deal</div>
          }
        </div>
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label col-form-label-sm">Eth Address:</label>
          <div className="col-sm-10">
            <input type="text" className="form-control form-control-sm" value={withdrawAddress}
                   onChange={handleWithdrawAddress} disabled={loading}/>
            <div className="form-text" id="eth-sender">Target Eth address to receive the DAI</div>
          </div>
        </div>
        <div className="text-center">
          <button className="btn btn-primary text-center" onClick={handleAcceptDeal}
                  disabled={loading}> Accept Deal
          </button>
        </div>

        <br/>

        <div className="row mb-3">Fetch Signed Eth Transaction from Jamon Market</div>
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label col-form-label-sm">transaction hash:</label>
          <div className="col-sm-10">
            <input type="text" className="form-control form-control-sm" value={transactionHashHack}
                   onChange={handleTransactionHashHack} disabled={loading}/>
          </div>
        </div>
        <div className="text-center">
          <button className="btn btn-primary text-center" onClick={getSignatureForEth}
                  disabled={loading}> getSignatureForEth
          </button>
        </div>

      </>
  )
}

BitcoinView.propTypes = {
  props: PropTypes.shape({
    setStatus: PropTypes.func.isRequired,
    wallet: PropTypes.object.isRequired,
    MPC_CONTRACT: PropTypes.string.isRequired,
    MARKET_CONTRACT: PropTypes.string.isRequired,
  }).isRequired
};
