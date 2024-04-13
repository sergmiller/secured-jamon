import {NearBindgen, near, call, NearPromise, includeBytes, view} from 'near-sdk-js'


const MIN_STORAGE: bigint = BigInt("1100000000000000000000000"); // 1.1Ⓝ


// @NearBindgen({requireInit: true})
@NearBindgen({})
class Contract {
  greeting: string = "Hell2";
  greeting2: string = "Hello";

  @view({}) // This method is read-only and can be called for free
  get_greeting(): string {
    return this.greeting;
  }

  @view({}) // This method is read-only and can be called for free
  get_greeting2(): string {
    return this.greeting2;
  }

  @call({}) // This method changes the state, for which it cost gas
  set_greeting({ greeting }: { greeting: string }): void {
    near.log(`Saving greeting ${greeting}`);
    this.greeting = greeting;
  }

  @call({payableFunction:true})
  create({prefix}:{prefix: String}) {
    const account_id = `${prefix}.${near.currentAccountId()}`

    near.log(`Creating a new contract account test: ${account_id}`);

    return NearPromise.new(account_id)
        .createAccount()
        .transfer(MIN_STORAGE)
        .deployContract(includeBytes("hello_near_copy.wasm"))
  }
}
