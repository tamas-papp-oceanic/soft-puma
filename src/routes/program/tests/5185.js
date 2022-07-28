import { get } from "svelte/store";
import { _scriptData } from "../../../stores/tests.js";
import { runScript, enableNext, getStoreValue, setStoreValue } from "./runner.js";
import { findProduct } from "../../../stores/data.js";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Sets serial number
async function setSerial(ser) {

  console.log(ser);

};
// Starts processing
export async function start(script) {
  enableNext(true);
};
// Starts scan for device
export async function scanDevice(script) {
  window.pumaAPI.send('n2k-scan');
};
// Waits for device scan to finish
export async function waitDevice(script) {
  await sleep(script.timeout);
  // let pro = findProduct(script['product-code']);
  // if (pro != null) {
    let suc = script.onSuccess;
    if (typeof suc !== 'undefined') {
      await runScript(suc);
      let res = await getStoreValue({ variable: 'detected' });
      enableNext(res);
    }
  // }
};
// Starts form processing
export async function startForm(script) {
  let wrp = document.getElementById('serial');
  wrp.focus();
  enableNext(true);
};
  // Sets device in test mode
export async function startTests(script) {
  window.pumaAPI.send('n2k-test', 0x80);
};

let success = null;

// Starts device's test
export async function startTest(script) {
  window.pumaAPI.send('n2k-test', script.testCode);
};
// Test result processing
async function testResult(e, args) {
  if (success != null) {
    await runScript(success);
    success = null;
  }


  console.log(args)
  enableNext(true);
  
  // Remove listener
  window.pumaAPI.reml('n2k-test');
}
// Waits for device's test to finish
export async function waitTest(script) {
  if (typeof script.onSuccess !== 'undefined') {
    success = script.onSuccess;
  }
  // Receives device's test result
  window.pumaAPI.recv('n2k-test', testResult);
};
// Sets device in normal mode
export async function stopTests(script) {
  window.pumaAPI.send('n2k-test', 0);
};
// Starts device update
export async function startUpdate(script) {
  window.pumaAPI.send('n2k-update', true);
};
// Waits for device update to finish
export async function waitUpdate(script) {
  // Receives update result
  window.pumaAPI.recv('update-done', (e) => {
    enableNext(true);
  });
};
// Logs test results
export async function logResult(script) {

  let tmp = get(_scriptData);
  console.log(tmp)

  enableNext(true);
};
