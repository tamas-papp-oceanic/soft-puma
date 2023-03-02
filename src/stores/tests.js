import { writable } from 'svelte/store';
import { platform } from '../stores/user.js';

const testURL = platform.toLowerCase().includes('windows') ? 'http://192.168.16.52:8080' : 'http://localhost:8080';

const _scriptData = writable({});
const _steps = writable({});
const _actions = writable({});
const _events = writable({});
const _current = writable(0);
const _runState = writable({});

export { testURL, _scriptData, _steps, _actions, _events, _current, _runState }
