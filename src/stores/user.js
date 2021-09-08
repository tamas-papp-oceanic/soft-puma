import { writable, derived } from 'svelte/store';

const userData = writable({});
const accessToken = writable();
const refreshToken = writable();
const loggedIn = writable(false);
export { userData, accessToken, refreshToken, loggedIn }
