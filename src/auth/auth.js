import { get } from "svelte/store";
import jwt_decode from "jwt-decode";
import { userData, accessToken, refreshToken, loggedIn,
  permissions } from '../stores/user.js';

function refreshLogin() {
  return false; // because I need to do this later. TODO
}

async function getPerms(){
  let res = await afetch("http://localhost:8080/roles", {method: 'GET'})
  let perms = await res.json()
  let permsObject= {};
  for(let i = 0; i < perms.length; i++){
    if(typeof permsObject[perms[i][1]] === 'undefined') {
      permsObject[perms[i][1]] = {}
    }
    permsObject[perms[i][1]][perms[i][2]] = true
  }
  permissions.set(permsObject)
}

async function login(username, password) {
  const res = await fetch('http://localhost:8080/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password
    })
  });
  const status = res.status
  const json = await res.json()
  if (res.status != 200) {
    console.log("Login failed")
    return false
  } else {
    console.log("Login Success")
    accessToken.set(json.access_token)
    refreshToken.set(json.refresh_token)
    loggedIn.set(true)
    var decoded = jwt_decode(json.access_token)
    userData.set(decoded)
    await getPerms()
    return true
  }
}

async function logout() {
  let res = await afetch("http://localhost:8080/logout", {method: 'POST'})
  userData.set({})
  accessToken.set("")
  refreshToken.set("")
  loggedIn.set(false)
}

async function afetch(url, options) {
  // add logic to add auth header here.
  if(get(loggedIn) === true){
    let authCode = get(accessToken)
    let bearer = "bearer " + authCode
    options["withCredentials"] = true
    options["credentials"] = "include"
    options["headers"] = {'Authorization': bearer, "Content-Type":"application/json" }
  }
  const res = await fetch(url, options);
  if(get(loggedIn) && res.status==401){
    // refreshLogin will set LoggedIn to false if it fails, so we only do one loop
    console.log("Suspect access expired. Try to refresh")
    let refres = await refreshLogin();
    if(refres == true){
      // success refresh
      const res2 = await afetch(url, options);
      return res2
    }
  }
  return res
}
// route refers to a API route
// type = read write or delete
function checkAccess(route, type) {
  let prm = get(permissions);
  if (typeof prm[route] !== 'undefined') {
    return (prm[route].type == type);
  }
  return false;
}

export {
  login,
  logout,
  checkAccess,
  afetch
}
