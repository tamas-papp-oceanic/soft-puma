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
import { testURL, _scriptData, _steps, _actions, _events, _current } from '../../../stores/tests.js';
import { userData } from '../../../stores/user.js';
import { afetch } from '../../../auth/auth.js';

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
    'set-var': setStoreValue,
    'get-var': getStoreValue,
    'add-log': addToLog,
  }, acts);
  _actions.set(acts);
  _events.set(evts);
  if (typeof vari !== 'undefined') {
    let scr = get(_scriptData);
    scr.variant = vari;
    _scriptData.set(scr);
  }
  _current.set(1);
};

export function currStep() {
  let sts = get(_steps);
  let cur = get(_current);
  if ((typeof sts !== 'undefined') && (typeof sts[cur] !== 'undefined')) {
    return sts[cur];
  }
  return null;
};

export async function nextStep() {
  let cur = get(_current);
  cur++;
  _current.set(cur);
};

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

export async function runScript(script) {
  let acs = get(_actions);
  let act = acs[script.action];
  if (typeof act !== "undefined") {
    await act(script);
  }
};

export async function getStoreValue(script) {
  if (typeof script.variable === 'string') {
    let dat = get(_scriptData);
    return dat[script.variable];
  }
  return null;
};
  
export async function setStoreValue(script) {
  if ((typeof script.variable === 'string') &&
    (typeof script.value !== 'undefined')) {
    let dat = get(_scriptData);
    dat[script.variable] = script.value;
    _scriptData.set(dat);
  }
};

export function enableNext(val) {
  let sts = get(_steps);
  let cur = get(_current);
  if ((typeof sts !== 'undefined') && (typeof sts[cur] !== 'undefined')) {
    sts[cur].next = val;
    _steps.set(sts);
  }
};

// createWarning(title, text, failure=false) {};

export async function addToLog(script) {
  let tmp = get(_scriptData);
  let usr = get(userData);
  const res = await afetch(testURL + '/test', {
    method: 'POST',
    body: JSON.stringify({
      user: parseInt(usr.user_id),
      product: tmp.variant && tmp.variant == 'Honda' ? tmp.product.modelVersion + '-H' : tmp.product.modelVersion,
      serial: tmp.serial,
      test: script.testCode,
      result: script.testValue,
    }),
  });
  const json = await res.json();
  if (res.status != 200) {
    console.log("Logging test failed");
  }
};

// submitResult() {};
