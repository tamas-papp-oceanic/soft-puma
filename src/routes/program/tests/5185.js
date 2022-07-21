import { runScript, enableNext, getStoreValue } from './runner.js';
import { findProduct } from '../../../stores/data.js';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Starts tests
export async function start(script) {
  enableNext();
}
// Scans network(s) for device
export async function scanDevice(script) {
  window.pumaAPI.send('n2k-scan');
  await sleep(script.timeout);
  let pro = findProduct(script['product-code']);
  if (pro != null) {
    let suc = script.onSuccess;
    if (typeof suc !== 'undefined') {
      await runScript(suc);
      let res = await getStoreValue({ variable: 'detected' });
      if (res == true) {
        enableNext();
      }
    }
  }
};
// Scans S/N label
export async function scanSerial(script) {
  // window.pumaAPI.send('n2k-scan');
  // await sleep(script.timeout);
  // let pro = findProduct(script['product-code']);
  // if (pro != null) {
    let suc = script.onSuccess;
    if (typeof suc !== 'undefined') {
      suc.value = "SCANNED";
      await runScript(suc);
      let res = await getStoreValue({ variable: 'serial' });
      if (res == "SCANNED") {
        enableNext();
      }
    }
  // }
};

export async function doEthernetTest(){}

export async function doTouchTest(){}

export async function doBrightnessTest(){}

export async function setSerialNumber(){}
