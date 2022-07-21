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
import { scriptData, steps, actions, current } from '../../../stores/tests.js';

export function initRun(stps, acts) {
  for (const [key, val] of Object.entries(stps)) {
    stps[key].next = false;
  }
  steps.set(stps);
  acts = Object.assign({
    'set-var': setStoreValue,
    'get-var': getStoreValue,
  }, acts);
  actions.set(acts);
  current.set(1);
};

export function currStep() {
  let sts = get(steps);
  let cur = get(current);
  if ((typeof sts !== 'undefined') && (typeof sts[cur] !== 'undefined')) {
    return sts[cur];
  }
  return null;
};

export async function nextStep() {
  let cur = get(current);
  cur++;
  current.set(cur);
  let step = currStep();
  if (step != null) {
    if (typeof step.variables !== 'undefined') {
      for (const [key, val] of Object.entries(step.variables)) {
        await setStoreValue({ variable: key, value: val });
      }
    }
  }
  return step;
};

export async function runStep() {
  let step = currStep();
  if (step != null) {
    if (typeof step.scripts !== "undefined") {
      for (const [key, val] of Object.entries(step.scripts)) {
        await runScript(val)
      }
    }
  }
};

export async function runScript(script) {
  let acs = get(actions);
  let act = acs[script.action];
  if (typeof act !== "undefined") {
    await act(script);
  }
};

export async function getStoreValue(script) {
  if (typeof script.variable === 'string') {
    let dat = get(scriptData);
    return dat[script.variable];
  }
  return null;
};
  
export async function setStoreValue(script) {
  if ((typeof script.variable === 'string') &&
    (typeof script.value !== 'undefined')) {
    let dat = get(scriptData);
    dat[script.variable] = script.value;
    scriptData.set(dat);
  }
};

export function enableNext() {
  let sts = get(steps);
  let cur = get(current);
  if ((typeof sts !== 'undefined') && (typeof sts[cur] !== 'undefined')) {
    if (Object.keys(sts).length > cur) {
      sts[cur].next = true;
      steps.set(sts);
    }
  }
};

// createWarning(title, text, failure=false) {};

// addToLog(entry) {};

// submitResult() {};
