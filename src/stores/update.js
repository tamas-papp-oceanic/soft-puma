import { writable } from 'svelte/store';

const result = writable({});
const update = writable(false);
const updmsg = writable('');
const download = writable(false);
const progress = writable({});

export { update, updmsg, download, progress };