import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx"
import { Wallet } from "./services/near-wallet.js";
import { EthereumView } from "./components/Ethereum.jsx";
import { BitcoinView } from "./components/Bitcoin.jsx";

// CONSTANTS
const MPC_CONTRACT = 'multichain-testnet-2.testnet';
const MARKET_CONTRACT = 'cross-contract-jamon8.testnet';
// I.e. Market Contract.
const NEAR_PROXY_ACCOUNT_ID = import.meta.env.VITE_NEAR_PROXY_ACCOUNT_ID ?? "";

// NEAR WALLET
const wallet = new Wallet({ network: 'testnet', createAccessKeyFor: NEAR_PROXY_ACCOUNT_ID });

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [status, setStatus] = useState("Please login to request a signature");
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
        <p className="small">
          Safely swap ERC20 coins between Different Chains.<br/>
          DAI on Ethereum on USDC on Near.
        </p>

        {isSignedIn &&
            <div style={{width: '50%', minWidth: '400px'}}>

              <div className="input-group input-group-sm mt-3 mb-3">
                <input className="form-control text-center" type="text" value={`MPC Contract: ${MPC_CONTRACT}`}
                       disabled/>
              </div>

              <div className="input-group input-group-sm mt-3 mb-3">
                <input className="form-control text-center" type="text"
                       value={`Jamon Market Contract: ${MARKET_CONTRACT}`} disabled/>
              </div>

              <div className="input-group input-group-sm my-2 mb-4">
                <span className="text-primary input-group-text" id="chain">Role</span>
                <select className="form-select" aria-describedby="chain" value={chain}
                        onChange={e => setChain(e.target.value)}>
                  <option value="eth"> Ξ Seller</option>
                  <option value="btc"> Buyer</option>
                </select>
              </div>

              {chain === 'eth' && <EthereumView props={{setStatus, wallet, MPC_CONTRACT, MARKET_CONTRACT}}/>}
              {chain === 'btc' && <BitcoinView props={{setStatus, wallet, MPC_CONTRACT, MARKET_CONTRACT}}/>}
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
