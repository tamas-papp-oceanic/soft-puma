import { writable, derived } from 'svelte/store';

const scriptData = writable({});
const runState = writable({});

export { scriptData, runState }
