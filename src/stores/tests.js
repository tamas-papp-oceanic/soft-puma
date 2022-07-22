import { writable, derived } from 'svelte/store';

const _scriptData = writable({});
const _steps = writable({});
const _actions = writable({});
const _current = writable(0);
const _runState = writable({});

export { _scriptData, _steps, _actions, _current, _runState }
