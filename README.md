# secured-jamon
project for ETHdam: atomic cross chain asset transfer manageable from NEAR


## Structure

### [protocol contract](https://github.com/sergmiller/secured-jamon/blob/main/research/hamon-contract/src/contract.ts)
there are following stages:
1. create_offer
2. accept_offer
3. withdraw (includes call of NEAR MPC)

### [frontend](https://github.com/sergmiller/secured-jamon/tree/main/frontend)
based on near multichain example

other parts just hello world code.


### Pitch:

Today cross-chain bridging is not without its challenges. Let me highlight the most important:

1) notoriously vulnerable to hacks

2) lack of support for non-EVM chains

3) there is no consistency in bridge interfaces nor common standard

With help of NEAR Programmable MPC it's possible to avoid bridges at least for multi-chain assets swapping. SecuredJamon protocol is mvp to show it. It allows to users to make atomic swap between their assets in between NEAR and any other chain (even with not evm-compatible).

SecuredJamon protocol exchange consists on following stages:

1) seller who wants to exchange his asset at any chain (i.e. DAI at Etherium) to tokens in NEAR(i.e USDC) creates offer with our market contract

2) in time of offer creation market contract publish unique derived address for this offer (Derived market address)

3) seller put his DAI to Derived market address at Etherium network (for now these money controlled only by original market contract on NEAR via MPC)

4) buyer put his USDC to market contract to accept offer. In this single transaction NEAR USDC goes to seller and market contract unlock possibility to sign withdraw from Derived market address in Etherium

5) seller (and only him) may call market contract any time to create signature to withdraw money from Derived market address at ETH via NEAR MPC.


