import BN from "bn.js";

export const fetchJson = async (url, params = {}, noWarnings = false) => {
  let res;
  try {
    res = await fetch(url, params);
    if (res.status !== 200) {
      if (noWarnings) return;
      console.log('res error');
      console.log(res);
      throw res;
    }
    return res.json();
  } catch (e) {
    if (noWarnings) return;
    console.log('fetchJson error', JSON.stringify(e));
  }
};


// Abstraction to send transaction via one of available engines: {nearAccount, custom wallet}.
export async function sendNearTransaction({nearSigner, contractId, method, args, attachedDeposit}) {
    let res;
    if (nearSigner.functionCall != undefined) {
        console.log('[sign] Sign from near account...')
        res = await nearSigner.functionCall({
            contractId,
            methodName: method,
            args,
            gas: new BN('300000000000000'),
            attachedDeposit,
        });
    } else {
        console.log('[sign] Sign from custom wallet account...')
        res = await nearSigner.callMethod({
            contractId,
            method: method,
            args,
            gas: new BN('300000000000000'),
            deposit: attachedDeposit,
        });
    }
    return nearTransactionParseResponse(res)
}

function nearTransactionParseResponse(res) {
    if ('SuccessValue' in (res.status as any)) {
        console.log(JSON.stringify(`Transaction succeeded, logs: ${JSON.stringify(res)}`))
        return res
    } else {
        console.log('Transaction failed with Error', JSON.stringify(res));
        return res
    }
}