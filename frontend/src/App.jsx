import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx"
import { Wallet } from "./services/near-wallet.js";
import { SellerView } from "./components/SellerView.jsx";
import { BuyerView } from "./components/BuyerView.jsx";

// CONSTANTS
// const MPC_CONTRACT = 'multichain-testnet-2.testnet';
const MARKET_CONTRACT = 'cross-contract-jamon8.testnet';
// I.e. Market Contract.
const NEAR_PROXY_ACCOUNT_ID = import.meta.env.VITE_NEAR_PROXY_ACCOUNT_ID ?? "";
const JAMON_SWAP_CONTRACT_ID = NEAR_PROXY_ACCOUNT_ID

// NEAR WALLET
const wallet = new Wallet({ network: 'testnet', createAccessKeyFor: NEAR_PROXY_ACCOUNT_ID });

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [status, setStatus] = useState(""); // before: Please login to request a signature
  const [chain, setChain] = useState('eth');

  useEffect(() => {
    const initFunction = async () => {
      const isSignedIn = await wallet.startUp();
      setIsSignedIn(isSignedIn);
    }

    initFunction();
  }, []);

  return (
    <>
      <Navbar wallet={wallet} isSignedIn={isSignedIn}></Navbar>
      <div className="container">
        <h4> 🔗 Jamon Swap </h4>
        <div className="text-center">
          <div className="text-center">
            Securely Swap tokens from Different Chains (in progress) via Secured Jamon protocol.<br/>
          </div>
        </div>

        {isSignedIn &&
            <div style={{width: '50%', minWidth: '400px'}}>

              <div className="input-group input-group-sm mt-3 mb-3">
                <input className="form-control text-center" type="text"
                       value={`Jamon Swap Contract: ${NEAR_PROXY_ACCOUNT_ID}`}
                       disabled/>
              </div>

              <div className="input-group input-group-sm mt-3 mb-3">
                <input className="form-control text-center" type="text"
                       value={`Swap of Near (testnet) on Eth (Sepolia)`}
                       disabled/>
              </div>

              <div className="text-center">
                <div className="text-center">
                  You need to choose role:<br/>
                  - Buyer if you have Near (testnet) to exchange on Eth (Sepolia).<br/>
                  - Seller if you have Eth (Sepolia) to exchange on Near (testnet).
                </div>
              </div>

              <div className="input-group input-group-sm my-2 mb-4">
                <span className="text-primary input-group-text" id="chain">Role</span>
                <select className="form-select" aria-describedby="chain" value={chain}
                        onChange={e => setChain(e.target.value)}>
                  <option value="eth"> Ξ Seller (want Near)</option>
                  <option value="btc"> Buyer (want Eth)</option>
                </select>
              </div>

              {chain === 'eth' && <SellerView props={{setStatus, wallet, JAMON_SWAP_CONTRACT_ID}}/>}
              {chain === 'btc' && <BuyerView props={{setStatus, wallet, JAMON_SWAP_CONTRACT_ID}}/>}
            </div>
        }

        <div className="mt-3 small text-center">
          <span> {status} </span>
        </div>
      </div>
    </>
  )
}

export default App
