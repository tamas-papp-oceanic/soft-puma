// import { get } from "svelte/store";
// import { testURL, _scriptData } from "../../../stores/tests.js";
import { runScript, enableNext } from "./runner.js";
import { findProduct } from "../../../stores/data.js";
// import { afetch } from "../../../auth/auth.js";

// let succ = null;
let timer = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
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
// Test result processing
// async function testResult(e, args) {
//   if (timer != null) {
//     clearTimeout(timer);
//     timer = null
//   }
//   // let tmp = get(_scriptData);
//   // let usr = get(userData);
//   // const [dev, msg] = args;
//   // const res = await afetch(testURL + '/test', {
//   //   method: 'POST',
//   //   body: JSON.stringify({
//   //     user: parseInt(usr.user_id),
//   //     product: tmp.variant && tmp.variant == 'Honda' ? tmp.product.modelVersion + '-H' : tmp.product.modelVersion,
//   //     serial: tmp.serial,
//   //     test: msg.fields[4].value,
//   //     result: msg.fields[5].value,
//   //   }),
//   // });
//   // const json = await res.json();
//   // if (res.status != 200) {
//   //   console.log("Logging test failed");
//   // }
//   enableNext(true);
//   // Remove listener
//   window.pumaAPI.reml('n2k-test');
// }
// Waits for device's test to finish
export async function waitTest(script) {
  if (typeof script.timeout !== 'undefined') {
    timer = setTimeout(() => {
      clearTimeout(timer);
      timer = null;
      // Remove listener
      window.pumaAPI.reml('n2k-test');
      enableNext(true);
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
// export async function logResult(script) {
//   // let tmp = get(_scriptData);
//   // console.log(tmp)
// };
// Stops processing
// export async function stop(script) {
//   enableNext(true);
// };
