import { Ethereum } from "../services/ethereum.js";
import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/debounce.jsx";
import PropTypes from 'prop-types';
import {JamonSwapClient} from "../services/JamonClient/JamonClient.ts";

const Sepolia = 11155111;
const Eth = new Ethereum('https://rpc2.sepolia.org', Sepolia);
const DEFAULT_GAS = '250000000000000'

// Seller
export function BuyerView({ props: { setStatus, wallet, JAMON_SWAP_CONTRACT_ID } }) {

  const [receiver, setReceiver] = useState("0xe0f3B7e68151E9306727104973752A415c2bcbEb");
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("request");
  const [signedTransaction, setSignedTransaction] = useState(null);
  const [senderAddress, setSenderAddress] = useState("")
  const [transactionHashHack, setTransactionHashHack] = useState("")
  const [offerId, setOfferId] = useState("")
  const [derivedAddress, setDerivedAddress] = useState("")
  const [derivedAddressBalance, setDerivedAddressBalance] = useState("")
  const [addressTo, setAddressTo] = useState("")
  const [amountToDepositForOfferAccept, setAmountToDepositForOfferAccept] = useState("")



  const [derivation, setDerivation] = useState("cross-contract-jamon5.testnet");
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

  const handleTransactionHashHack = (event) => {
    setTransactionHashHack(event.target.value);
  }

  async function handleCheckDeposit() {
      console.log('[handleCheckDeposit]...')
      setLoading(true);
      const client = new JamonSwapClient(wallet);
      // TODO: fetch amount from offer to check more.
      try {
        const balance = await client.getBalanceOnTargetChain(offerId)
        const serializeBalance = client.serializeWeiToEth(balance)
        setDerivedAddressBalance(serializeBalance)
        setDerivedAddress(await client.getDerivedEthAddress(offerId))
        if (balance.toString() === "0") {
            throw new Error("Seller did not deposit the Eth")
        }
        setStatus(`✅ Successful: Seller deposited ${serializeBalance} Eth`);
      } catch (e) {
        setStatus(`❌ Error: ${e.message}`);
      }
      setLoading(false);
  }


  const handleAcceptOffer = async () => {
    setLoading(true);
    console.log(`[handleAcceptOffer] offerId: ${offerId}, addressTo: ${addressTo}, amount: ${amount}...`)
    setStatus(`Call ${JAMON_SWAP_CONTRACT_ID} contract & transfer Eth...`)
    const client = new JamonSwapClient(wallet);
    if (amountToDepositForOfferAccept == "" || amount == "" || addressTo == "") {
        throw new Error('Validation error: amountToDepositForOfferAccept, amount, addressTo are required')
    }
    try{
      const request = await client.acceptOffer({
            offerId: offerId, buyerEthAddress: addressTo, amountEth: amount, amountDepositNear: amountToDepositForOfferAccept,
        })
      setStatus(`✅ Successful: TODO: transaction hash.`);
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
    }
    setLoading(false);
  }

  return (
      <>
          <div className="row mb-3">Swap your Near (testnet) on Eth (Sepolia)</div>
          <p className="small">
              You need to deal about offer details with Seller through custom channel.
              After you have the deal - you ask Seller to creat Offer and to send to you **offerId**.
              It is expected that Seller will deposit required amount of Eth to address controlled by Jamon Swap
              Contract.<br/>
              Check that the Seller deposited the Eth before you accept the Offer below!
          </p>

          <div className="row mb-3">
              <label className="col-sm-2 col-form-label col-form-label-sm">OfferId:</label>
              <div className="col-sm-10">
                  <input type="text" className="form-control form-control-sm" value={offerId} disabled={loading}
                         onChange={(e) => setOfferId(e.target.value)}/>
                  <div className="form-text" id="eth-sender"> Offer Id in the Jamon Swap Contract</div>
              </div>
          </div>

          <div className="text-center">
              <button className="btn btn-primary text-center" onClick={handleCheckDeposit}
                      disabled={loading || offerId === ""}> Check Seller Deposit
              </button>
          </div>

          <br/>
          <div className="row mb-3">Submit acceptance & Receive Eth (Sepolia)</div>
          <p className="small">
              After you ensured that Seller sent Eth (Sepolia) to the address controlled by Jamon Swap Contract below,
              you could accept the Offer and unlock Near for Seller.<br/>
              The Accept Offer transaction is atomic: it gets Near from you, compile signature of transaction to
              transfer Eth from the address you checked to address mentioned by you below.
          </p>
          <div className="row mb-3">
              <label className="col-sm-3 col-form-label col-form-label-sm">AddressFrom:</label>
              <div className="col-sm-9">
                  <input type="text" className="form-control form-control-sm" value={derivedAddress} disabled={true}/>
                  <div className="form-text" id="eth-sender"> Current
                      balance {derivedAddressBalance == "" ? 0 : derivedAddressBalance} Eth.
                  </div>
              </div>
          </div>

          <div className="row mb-3">
              <label className="col-sm-3 col-form-label col-form-label-sm">Address To Receive:</label>
              <div className="col-sm-9">
                  <input type="text" className="form-control form-control-sm" value={addressTo} disabled={loading}
                         onChange={(e) => setAddressTo(e.target.value)}/>
                  <div className="form-text" id="eth-sender"> Specify address to receive the Eth (Sepolia).
                  </div>
              </div>
              <label className="col-sm-3 col-form-label col-form-label-sm">Amount To Receive:</label>
              <div className="col-sm-9">
                  <input type="text" className="form-control form-control-sm" value={amount} disabled={loading}
                         onChange={(e) => setAmount(e.target.value)}/>
                  <div className="form-text" id="eth-sender"> Specify amount to transfer to you (remember that
                      transaction requires gas).
                  </div>
              </div>
              <label className="col-sm-3 col-form-label col-form-label-sm">Amount To Send:</label>
              <div className="col-sm-9">
                  <input type="text" className="form-control form-control-sm" value={amountToDepositForOfferAccept}
                         disabled={loading}
                         onChange={(e) => setAmountToDepositForOfferAccept(e.target.value)}/>
                  <div className="form-text" id="eth-sender"> Specify amount to deposit (Near) (TODO: get from
                      contract).
                  </div>
              </div>
          </div>


          <div className="text-center">
              <button className="btn btn-primary text-center" onClick={handleAcceptOffer}
                      disabled={loading}> Accept Offer
              </button>
          </div>

      </>
  )
}

BuyerView.propTypes = {
    props: PropTypes.shape({
        setStatus: PropTypes.func.isRequired,
        wallet: PropTypes.object.isRequired,
        JAMON_SWAP_CONTRACT_ID: PropTypes.string.isRequired,
    }).isRequired
};
