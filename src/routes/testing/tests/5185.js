import { runScript, enableNext } from "./runner.js";
import { findProduct } from "../../../stores/data.js";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Starts scan for device
export async function scanDevice(script) {
  window.pumaAPI.send('bus-scan');
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
