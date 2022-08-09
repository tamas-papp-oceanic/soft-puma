import { runScript, enableNext } from "./runner.js";
import { findProduct } from "../../../stores/data.js";

let timer = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Enable next processing
export async function next(script) {
  enableNext(true);
};
// Starts scan for device
export async function scanDevice(script) {
  window.pumaAPI.send('n2k-scan');
};
// Waits for device scan to finish
export async function waitDevice(script) {
  await sleep(script.timeout);
  let pro = findProduct(script['product-code']);
  if (pro != null) {
    let scr = { action: 'set-var', variable: 'product', value: pro.name }
    runScript(scr);
    enableNext(true);
  }
};
// Starts form processing
export async function startForm(script) {
  let wrp = document.getElementById('serial');
  wrp.focus();
  enableNext(true);
};
// Sets device in test mode
export async function startTests(script) {
  window.pumaAPI.send('n2k-test', [0x80]);
};

// Starts device's test
export async function startTest(script) {
  window.pumaAPI.send('n2k-test', [script.testCode, script.testParam]);
};
// Waits for device's test to finish
export async function waitTest(script) {
  if (typeof script.timeout !== 'undefined') {
    timer = setTimeout(() => {
      clearTimeout(timer);
      timer = null;
      // Remove listener
      window.pumaAPI.reml('n2k-test');
    }, script.timeout);
  }
  // Receives device's test result
  window.pumaAPI.recv('n2k-test', () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    enableNext(true);
    // Remove listener
    window.pumaAPI.reml('n2k-test');
  });
};
// Sets device in normal mode
export async function stopTests() {
  window.pumaAPI.send('n2k-test', [0]);
};
// Starts device update
export async function startUpdate(script) {
  enableNext(true);
};
