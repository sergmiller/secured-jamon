import {
    NearBindgen,
    near,
    call,
    NearPromise,
    includeBytes,
    view,
    bytes,
    UnorderedMap,
    assert,
    AccountId, initialize, PromiseIndex
} from 'near-sdk-js'


const MIN_STORAGE: bigint = BigInt("1100000000000000000000000"); // 1.1Ⓝ
const FIVE_TGAS = BigInt("100000000000000");
const NO_DEPOSIT = BigInt("0");
const NO_ARGS = JSON.stringify({});

// @NearBindgen({requireInit: true})
@NearBindgen({requireInit: true})
class Contract {
    offer_author = "";
    offer_value = BigInt("0");
    derived_path = "";
    can_withdraw = false;
    withdraw_address = "";

    gas_to_use: BigInt = FIVE_TGAS;
    mtc_contract: AccountId = "multichain-testnet-2.testnet";

    @view({})
    get_gas_to_use(): BigInt {
        return this.gas_to_use;
    }

    @view({})
    get_mtc_contract(): AccountId {
        return this.mtc_contract;
    }

    @call({})
    set_offer({ offer_value }: { offer_value: bigint }): void {
        this.offer_author = near.currentAccountId();
        this.offer_value = offer_value;
        this.derived_path = "derived";
        this.can_withdraw = false;
        near.log(`Saving offer ${near.currentAccountId()} with ${this.offer_value}`);
    }

    @call({payableFunction:true})
    accept_offer({withdraw_address}: {withdraw_address: string}): void {
        assert(this.offer_author != "", "Offer is not initialized");
        near.log(`Accepting offer & transfer to ${this.offer_author}, ${this.offer_value}`);
        NearPromise.new(this.offer_author).transfer(this.offer_value);
        this.offer_author = "";
        near.log("Allow call to transfer from derived account")
        this.can_withdraw = true;
        this.withdraw_address = withdraw_address;
    }

    @call({})
    withdraw(): NearPromise {
        assert(this.can_withdraw, "Can not withdraw");
        near.log(`Withdrawing ${this.offer_value}`);
        const payload = {
            amount: this.offer_value.toString(),
            to: this.withdraw_address
        }
        return this.sign_via_mpc({ payload: JSON.stringify(payload), path: this.derived_path });
    }

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
