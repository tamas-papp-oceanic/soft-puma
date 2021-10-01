import { writable, derived } from 'svelte/store';

const userData = writable({});
const permissions = writable({});
const accessToken = writable();
const refreshToken = writable();
const loggedIn = writable(false);
export { userData, accessToken, refreshToken, loggedIn, permissions }
//TODO save this data to filesystem so that you can work somewhat offline
