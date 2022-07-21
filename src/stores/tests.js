import { writable, derived } from 'svelte/store';

const scriptData = writable({});
const steps = writable({});
const actions = writable({});
const current = writable(0);
const runState = writable({});

export { scriptData, steps, actions, current, runState }
