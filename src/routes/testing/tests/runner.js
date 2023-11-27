/*
  Read in JSON file

  Work through each step.
  Step refers to each screen shown to the user

  Step can have background instructions

  dynamically create store values for running the script
  we put these in stores so that we can view the values on screen and also Recover
  the results at the end of the test.
 */
import { get } from 'svelte/store';
import { _scriptData, _steps, _actions, _events, _current } from '../../../stores/tests.js';
import { authURL, userData } from '../../../stores/user.js';
import { afetch } from '../../../auth/auth.js';
import { device } from '../../../stores/data.js';

let timer = null;

// Initializes test
export function initRun(stps, acts, evts, vari) {
  for (const [key, val] of Object.entries(stps)) {
    stps[key].next = false;
    if (typeof val.testCode !== 'undefined') {
      for (let i in stps[key].scripts) {
        stps[key].scripts[i].testCode = val.testCode;
      }
    }
  }
  _steps.set(stps);
  acts = Object.assign({
    'next': enableNext,
    'set-var': setStoreValue,
    'get-var': getStoreValue,
    "start-tests": startTests,
    "start-test": startTest,
    "wait-test": waitTest,
    "stop-tests": stopTests,
    "start-update": startUpdate,
    'result': result,
    'add-log': addToLog,
    'print-label': printLabel,
  }, acts);
  _actions.set(acts);
  _events.set(evts);
  if (vari != null) {
    let scr = get(_scriptData);
    scr.variant = vari;
    _scriptData.set(scr);
  }
  _current.set(1);
};
// Gets current step
export function currStep() {
  let sts = get(_steps);
  let cur = get(_current);
  if ((typeof sts !== 'undefined') && (typeof sts[cur] !== 'undefined')) {
    return sts[cur];
  }
  return null;
};
// Performs next step
export async function nextStep() {
  let cur = get(_current);
  cur++;
  _current.set(cur);
};
// Performs last step
export async function lastStep() {
  let sts = get(_steps);
  const res = Object.keys(sts)[Object.keys(sts).length-1];
  _current.set(res);
};
// Runs current step
export async function runStep() {
  let step = currStep();
  if (step != null) {
    if (typeof step.variables !== 'undefined') {
      for (const [key, val] of Object.entries(step.variables)) {
        await setStoreValue({ variable: key, value: val });
      }
    }
    let evs = get(_events);
    if (typeof step.inputs !== 'undefined') {
      for (let i in step.inputs) {
        if (typeof step.inputs[i].handler !== "undefined") {
          step.inputs[i].handler = evs[step.inputs[i].handler];
        }
      }
    }
    if (typeof step.scripts !== "undefined") {
      for (const [key, val] of Object.entries(step.scripts)) {
        await runScript(val)
      }
    }
  }
};
// Runs test script
export async function runScript(script) {
  let acs = get(_actions);
  let act = acs[script.action];
  if (typeof act !== "undefined") {
    await act(script);
  }
};
// Enable next button
export function enableNext(val) {
  let sts = get(_steps);
  let cur = get(_current);
  if ((typeof sts !== 'undefined') && (typeof sts[cur] !== 'undefined')) {
    sts[cur].next = val;
    _steps.set(sts);
  }
};
// Gets store value
export async function getStoreValue(script) {
  if (typeof script.variable === 'string') {
    let dat = get(_scriptData);
    return dat[script.variable];
  }
  return null;
};
// Sets store value
export async function setStoreValue(script) {
  if ((typeof script.variable === 'string') &&
    (typeof script.value !== 'undefined')) {
    let dat = get(_scriptData);
    dat[script.variable] = script.value;
    _scriptData.set(dat);
  }
};
// Sets device in test mode
export async function startTests(script) {
  let dev = get(device);
  window.pumaAPI.send('test-data', [dev, 0x80]);
};
// Starts device's test
export async function startTest(script) {
  if (typeof script.testCode !== 'undefined') {
    let dev = get(device);
    window.pumaAPI.send('test-data', [dev, script.testCode, script.testParam]);
  }
};
// Waits for device's test to finish
export async function waitTest(script) {
  if (typeof script.timeout !== 'undefined') {
    timer = setTimeout(() => {
      clearTimeout(timer);
      timer = null;
      // Remove listener
      window.pumaAPI.reml('test-data');
    }, script.timeout);
  }
  // Receives device's test result
  window.pumaAPI.recv('test-data', () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    enableNext(true);
    // Remove listener
    window.pumaAPI.reml('test-data');
  });
};
// Sets device in normal mode
export async function stopTests() {
  let dev = get(device);
  window.pumaAPI.send('test-data', [dev, 0]);
};
// Starts device update
export async function startUpdate(script) {
  enableNext(true);
};
// Processes test reult
export async function result() {
  let sts = get(_steps);
  let cur = get(_current);
  if ((typeof sts !== 'undefined') && (typeof sts[cur] !== 'undefined')) {
    const res = await getStoreValue({ variable: 'result' });
    sts[cur].result = res;
    _steps.set(sts);
  }
};
// Add record to log
export async function addToLog(script) {
  let tmp = get(_scriptData);
  let usr = get(userData);
  const res = await afetch(get(authURL) + '/test', {
    method: 'POST',
    body: JSON.stringify({
      user: parseInt(usr.user_id),
      product: tmp.product.modelVersion + (tmp.variant ? '-' + tmp.variant : ''),
      serial: tmp.serial,
      test: script.testCode,
      result: script.testValue,
    }),
  });
  if (res.status == 200) {
    const json = await res.json();
  } else {
    console.log("Logging test failed");
  }
};
// Prints device box label
export async function printLabel(script) {
  const code = await getStoreValue({ variable: 'serial' });
  window.pumaAPI.send('bar-code', [code]);
};
// createWarning(title, text, failure=false) {};
// submitResult() {};
