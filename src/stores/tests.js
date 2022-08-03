import { writable, derived } from 'svelte/store';

const testURL = 'http://localhost:8080';
const _scriptData = writable({});
const _steps = writable({});
const _actions = writable({});
const _events = writable({});
const _current = writable(0);
const _runState = writable({});

export { testURL, _scriptData, _steps, _actions, _events, _current, _runState }
