import * as nearAPI from 'near-api-js';
import {sendNearTransaction} from "./utils";

export async function sign(payload, path, nearAccount, contractId, derivedAddress, attachedDepositNear) {
  const args = {
    payload,
    path,
    key_version: 0,
    rlp_payload: undefined,
    derivedAddress,
  };

  // if (process.env.NEAR_PROXY_CONTRACT === 'true') {
  delete args.payload;
  args.rlp_payload = payload.substring(2);
  const attachedDeposit = nearAPI.utils.format.parseNearAmount(attachedDepositNear);
  // } else {
  //   // reverse payload required by MPC contract
  //   payload.reverse();
  // }

  console.log(
    'sign payload',
    payload.length > 200 ? payload.length : payload.toString(),
  );
  console.log('with path', path);
  console.log('this may take approx. 30 seconds to complete');

  let res;
  // Support account with private key for tests, and custom wallet account for frontend.
  try {
    console.log('nearAccount.callMethod', nearAccount.callMethod)
    console.log('nearAccount.functionCall', nearAccount.functionCall)
    res = await sendNearTransaction({
        nearSigner: nearAccount,
        contractId,
        method: 'sign',
        args,
        attachedDeposit,
    });

  } catch (e) {
    return console.log('error signing', JSON.stringify(e));
  }

  console.log('Check status...')

  // parse result into signature values we need r, s but we don't need first 2 bytes of r (y-parity)
  if ('SuccessValue' in (res.status as any)) {
    const successValue = (res.status as any).SuccessValue;
    const decodedValue = Buffer.from(successValue, 'base64').toString('utf-8');
    const parsedJSON = JSON.parse(decodedValue) as [string, string];

    return {
      r: parsedJSON[0].slice(2),
      s: parsedJSON[1],
    };
  } else {
    return console.log('error signing', JSON.stringify(res));
  }
}
