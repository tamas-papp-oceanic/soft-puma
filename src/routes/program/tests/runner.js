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
import { scriptData } from '../../../stores/tests.js';

let steps;
let actions;
let current;

export function initRun(stps, acts) {
  steps = stps;
  for (const [key, val] of Object.entries(steps)) {
    steps[key].next = false;
  }
  actions = {
    'set-var': setStoreValue,
    'get-var': getStoreValue,
  };
  actions = Object.assign(actions, acts);
  current = 1;
  return currStep();
};

export function currStep() {
  if ((typeof steps !== 'undefined') && (typeof steps[current] !== 'undefined')) {
    return steps[current];
  }
  return null;
};

export async function nextStep() {
  current++;
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
  let act = actions[script.action];
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
  if ((typeof steps !== 'undefined') && (typeof steps[current] !== 'undefined')) {
    if (Object.keys(steps).length > current) {
      steps[current].next = true;
    }
  }
};

// createWarning(title, text, failure=false) {};

// addToLog(entry) {};

// submitResult() {};
