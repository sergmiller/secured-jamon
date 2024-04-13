import {NearBindgen, initialize, call, near, NearPromise, PromiseIndex, view} from "near-sdk-js";
import { AccountId } from "near-sdk-js/lib/types";

const FIVE_TGAS = BigInt("100000000000000");
const NO_DEPOSIT = BigInt(0);
const NO_ARGS = JSON.stringify({});

@NearBindgen({})
class CrossContractCall {
  hello_account: AccountId = "near-jamon.testnet";
  gas_to_use: BigInt = FIVE_TGAS;
  mtc_contract: AccountId = "multichain-testnet-2.testnet";

  @initialize({})
  init({ mtc_contract }: { mtc_contract: AccountId }) {
    this.mtc_contract = mtc_contract
  }

  @view({})
  get_mtc_contract(): AccountId {
    return this.mtc_contract;
  }

  @call({}) // Set gas for cross contract call.
  set_gas({ gas_to_use }: { gas_to_use: BigInt }): void {
    near.log(`Saving gas_to_use ${gas_to_use}`);
    this.gas_to_use = gas_to_use;
  }

  // CHANGE
  @call({})  // payload from
  sign_via_mpc({ payload, path }: { payload: string, path: string}): NearPromise {
    const promise = NearPromise.new(this.mtc_contract)
        // call { contractId, method: 'sign', args: { payload, path, key_version: 0 }, gas: '250000000000000' })
        // @ts-ignore
    .functionCall("sign", JSON.stringify({ payload, path, key_version: 0 }), NO_DEPOSIT, this.gas_to_use)
    .then(
      NearPromise.new(near.currentAccountId())
          // @ts-ignore
      .functionCall("sign_via_mpc_callback", NO_ARGS, NO_DEPOSIT, this.gas_to_use)
    )

    return promise.asReturn();
  }

  @call({privateFunction: true})
  sign_via_mpc_callback(): String {
    let {result, success} = promiseResult()

    if (success) {
      near.log(`Success!`)
      // In order to recover the result you need to decode it from the resulting buffer.
      return result.substring(1, result.length-1);
    } else {
      near.log("Promise for sign_via_mpc failed...")
      return ""
    }
  }
}

function promiseResult(): {result: string, success: boolean}{
  let result, success;

  try{ result = near.promiseResult(0 as PromiseIndex); success = true }
  catch{ result = undefined; success = false }

  return {result, success}
}
