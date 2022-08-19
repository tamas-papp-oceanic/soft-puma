import { writable } from 'svelte/store';

const update = writable(false);
const updmsg = writable('');

export { update, updmsg };