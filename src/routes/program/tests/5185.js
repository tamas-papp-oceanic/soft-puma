import { runScript, enableNext, getStoreValue } from './runner.js';
import { findProduct } from '../../../stores/data.js';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Sets serial number
async function setSerial(ser) {

  console.log(ser);

};
// Starts tests
export async function start(script) {
  enableNext();
};
// Scans network(s) for device
export async function scanDevice(script) {
  // window.pumaAPI.send('n2k-scan');
  // await sleep(script.timeout);
  // let pro = findProduct(script['product-code']);
  // if (pro != null) {
    let suc = script.onSuccess;
    if (typeof suc !== 'undefined') {
      await runScript(suc);
      let res = await getStoreValue({ variable: 'detected' });
      if (res == true) {
        enableNext();
      }
    }
  // }
};
// Scans S/N label
export async function scanSerial(script) {
  // let ser = scan();
  // if (ser != null) {
    let suc = script.onSuccess;
    if (typeof suc !== 'undefined') {
      suc.value = "SCANNED";
      await runScript(suc);
      let res = await getStoreValue({ variable: 'serial' });
      if (res == "SCANNED") {
        await setSerial("SCANNED");
        enableNext();
      }
    }
  // }
};
// Receives screen touch test result
window.pumaAPI.recv('touch-done', (e) => {
  window.pumaAPI.send('n2k-touch', false);
  enableNext();
});
// Runs screen touch test
export async function touchTest(script) {
  window.pumaAPI.send('n2k-touch', true);
};
// Receives screen brightness test result
window.pumaAPI.recv('bright-done', (e) => {
  window.pumaAPI.send('n2k-bright', false);
  enableNext();
});
// Runs screen brightness test
export async function brightTest(script) {
  window.pumaAPI.send('n2k-bright', true);
};
