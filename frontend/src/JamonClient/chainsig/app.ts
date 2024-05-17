import { program } from 'commander';
import { generateAddress } from './kdf';
import { sign, account } from './near';
import dogecoin from './dogecoin';
import ethereum from './ethereum';
import bitcoin from './bitcoin';
import xrpLedger from './xrpLedger';

program
  .option('-p')
  .option('-ea')
  .option('-ba')
  .option('-da')
  .option('-ra')
  .option('-s')
  .option('-etx')
  .option('-btx')
  .option('-dtx')
  .option('-rtx')
  // EVM contracts
  .option('-d, -edc')
  .option('-v, -view')
  .option('-c, -call')
  .option('--amount <char>')
  .option('--to <char>')
  // EVM contracts
  .option('--path <char>')
  .option('--method <char>')
  .option('--args <char>')
  .option('--ret <char>');

program.parse();

// options
const options = Object.entries(program.opts())
  .map(([k, v]) => ({
    [k.toLowerCase()]: v,
  }))
  .reduce((a, c) => ({ ...a, ...c }), {});

const tryParse = (s) => {
  if (!s) return;
  try {
    return JSON.parse(s);
  } catch (e) {
    console.log('incorrectly formatted JSON:', s);
    return false;
  }
};

const {
  MPC_PUBLIC_KEY,
  NEAR_ACCOUNT_ID,
  MPC_PATH,
  MPC_CONTRACT_ID,
  NEAR_PROXY_ACCOUNT,
  NEAR_PROXY_CONTRACT,
  NEAR_PROXY_ACCOUNT_ID,
} = process.env;

let {
  p,
  ea,
  ba,
  da,
  ra,
  s,
  etx,
  btx,
  dtx,
  rtx,
  edc,
  view,
  call,
  to,
  amount,
  path,
  method,
  args,
  ret,
} = options;

export const genAddress = (chain) => {
  let accountId =
    NEAR_PROXY_ACCOUNT === 'true' ? NEAR_PROXY_ACCOUNT_ID : NEAR_ACCOUNT_ID;
  return generateAddress({
    publicKey: MPC_PUBLIC_KEY,
    accountId,
    path: MPC_PATH,
    chain,
  });
};

async function main() {
  // mpc public key
  if (p) {
    const public_key = await account.viewFunction({
      contractId: MPC_CONTRACT_ID,
      methodName: 'public_key',
    });
    console.log(public_key);
  }

  // addresses
  if (ea) {
    const { address } = await genAddress('ethereum');
    console.log(address);
  }
  if (ba) {
    const { address } = await genAddress('bitcoin');
    console.log(address);
  }
  if (da) {
    const { address } = await genAddress('dogecoin');
    console.log(address);
  }
  if (ra) {
    const { address } = await genAddress('xrpLedger');
    console.log(address);
  }

  // sample sign

  if (s) {
    const samplePayload = new Array(32);
    for (let i = 0; i < samplePayload.length; i++) {
      samplePayload[i] = Math.floor(Math.random() * 255);
    }
    const res = await sign(samplePayload, MPC_PATH);
    console.log('signature', res);
  }

  // send txs
  if (etx) {
    const { address } = await genAddress('ethereum');
    console.log(`Generated address: ${address}`)
    await ethereum.send({ from: address, to, amount });
  }
  if (btx) {
    const { address, publicKey } = await genAddress('bitcoin');
    await bitcoin.send({ from: address, publicKey, to, amount });
  }
  if (dtx) {
    const { address, publicKey } = await genAddress('dogecoin');
    await dogecoin.send({ from: address, publicKey, to, amount });
  }
  if (rtx) {
    const { address, publicKey } = await genAddress('xrpLedger');
    await xrpLedger.send({ from: address, publicKey, to, amount });
  }

  // contract deployment and interaction

  // default: deploys nft contract
  if (edc) {
    const { address } = await genAddress('ethereum');
    await ethereum.deployContract({ from: address, path });
  }

  args = tryParse(args);
  if (args === false) process.exit();
  ret = tryParse(ret);
  if (ret === false) process.exit();

  // default: gets nft balance for --args '{"address":"0x1234...."}'
  if (view) {
    await ethereum.view({ to, method, args, ret });
  }

  // default: mints (tokenId++) edition of nft to --args '{"address":"0x1234...."}'
  if (call) {
    const { address } = await genAddress('ethereum');
    await ethereum.call({ to, method, args, ret, from: address });
  }

  process.exit();
}

main();
