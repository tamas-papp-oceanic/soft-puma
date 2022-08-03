import { writable, derived } from 'svelte/store';

const authURL = 'http://localhost:8080';
const user = JSON.parse(localStorage.getItem('userData'));
const userData = writable(user);
userData.subscribe((val) =>{
  localStorage.setItem('userData', JSON.stringify(val));
});
const perm = JSON.parse(localStorage.getItem('permissions'));
const permissions = writable(perm);
permissions.subscribe((val) =>{
  localStorage.setItem('permissions', JSON.stringify(val));
});
const acce = JSON.parse(localStorage.getItem('accessToken'));
const accessToken = writable(acce);
accessToken.subscribe((val) =>{
  localStorage.setItem('accessToken', JSON.stringify(val));
});
const refr = JSON.parse(localStorage.getItem('refreshToken'));
const refreshToken = writable(refr);
refreshToken.subscribe((val) =>{
  localStorage.setItem('refreshToken', JSON.stringify(val));
});
const logg = JSON.parse(localStorage.getItem('loggedIn'));
const loggedIn = writable(logg);
loggedIn.subscribe((val) =>{
  localStorage.setItem('loggedIn', JSON.stringify(val));
});
export { authURL, userData, accessToken, refreshToken, loggedIn, permissions }
//TODO save this data to filesystem so that you can work somewhat offline
