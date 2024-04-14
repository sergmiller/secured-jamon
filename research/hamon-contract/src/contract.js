var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { NearBindgen, near, call, NearPromise, view, assert, initialize } from 'near-sdk-js';
const MIN_STORAGE = BigInt("1100000000000000000000000"); // 1.1Ⓝ
const FIVE_TGAS = BigInt("100000000000000");
const NO_DEPOSIT = BigInt("0");
const NO_ARGS = JSON.stringify({});
// @NearBindgen({requireInit: true})
let Contract = class Contract {
    constructor() {
        this.offer_author = "";
        this.offer_value = BigInt("0");
        this.derived_path = "";
        this.can_withdraw = false;
        this.withdraw_address = "";
        this.gas_to_use = FIVE_TGAS;
        this.mtc_contract = "multichain-testnet-2.testnet";
    }
    init({ mtc_contract, gas_to_use }) {
        this.mtc_contract = mtc_contract;
        this.gas_to_use = gas_to_use;
    }
    get_gas_to_use() {
        return this.gas_to_use;
    }
    get_mtc_contract() {
        return this.mtc_contract;
    }
    set_offer({ offer_value }) {
        this.offer_author = near.currentAccountId();
        this.offer_value = offer_value;
        this.derived_path = "derived";
        this.can_withdraw = false;
        near.log(`Saving offer ${near.currentAccountId()} with ${this.offer_value}`);
    }
    accept_offer({ withdraw_address }) {
        assert(this.offer_author != "", "Offer is not initialized");
        near.log(`Accepting offer & transfer to ${this.offer_author}, ${this.offer_value}`);
        NearPromise.new(this.offer_author).transfer(this.offer_value);
        this.offer_author = "";
        near.log("Allow call to transfer from derived account");
        this.can_withdraw = true;
        this.withdraw_address = withdraw_address;
    }
    withdraw() {
        g;
        assert(this.can_withdraw, "Can not withdraw");
        near.log(`Withdrawing ${this.offer_value}`);
        const payload = {
            amount: this.offer_value.toString(),
            to: this.withdraw_address
        };
        return this.sign_via_mpc({ payload: JSON.stringify(payload), path: this.derived_path });
    }
    sign_via_mpc({ payload, path }) {
        const promise = NearPromise.new(this.mtc_contract)
            // call { contractId, method: 'sign', args: { payload, path, key_version: 0 }, gas: '250000000000000' })
            // @ts-ignore
            .functionCall("sign", JSON.stringify({ payload, path, key_version: 0 }), NO_DEPOSIT, this.gas_to_use)
            .then(NearPromise.new(near.currentAccountId())
            // @ts-ignore
            .functionCall("sign_via_mpc_callback", NO_ARGS, NO_DEPOSIT, this.gas_to_use));
        return promise.asReturn();
    }
    sign_via_mpc_callback() {
        let { result, success } = promiseResult();
        if (success) {
            near.log(`Success!`);
            // In order to recover the result you need to decode it from the resulting buffer.
            return result.substring(1, result.length - 1);
        }
        else {
            near.log("Promise for sign_via_mpc failed...");
            return "";
        }
    }
};
__decorate([
    initialize({})
], Contract.prototype, "init", null);
__decorate([
    view({})
], Contract.prototype, "get_gas_to_use", null);
__decorate([
    view({})
], Contract.prototype, "get_mtc_contract", null);
__decorate([
    call({})
], Contract.prototype, "set_offer", null);
__decorate([
    call({ payableFunction: true })
], Contract.prototype, "accept_offer", null);
__decorate([
    call({})
], Contract.prototype, "withdraw", null);
__decorate([
    call({}) // payload from
], Contract.prototype, "sign_via_mpc", null);
__decorate([
    call({ privateFunction: true })
], Contract.prototype, "sign_via_mpc_callback", null);
Contract = __decorate([
    NearBindgen({})
], Contract);
function promiseResult() {
    let result, success;
    try {
        result = near.promiseResult(0);
        success = true;
    }
    catch {
        result = undefined;
        success = false;
    }
    return { result, success };
}
