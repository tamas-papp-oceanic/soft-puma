import { get } from "svelte/store";
import jwt_decode from "jwt-decode";
import { authURL, userData, accessToken, refreshToken, loggedIn,
  permissions } from '../stores/user.js';

async function refreshLogin() {
  let token = get(refreshToken);
  let res = await afetch(authURL + '/refresh', {
    method: 'POST',
    body: JSON.stringify({
      'refresh_token': token,
    }),
  });
  const json = await res.json();
  if (res.status != 201) {
    loggedIn.set(false);
    console.log("Refresh failed");
    return false;
  } else {
    console.log("Refresh Success");
    accessToken.set(json.access_token);
    refreshToken.set(json.refresh_token);
    loggedIn.set(true);
    let dec = jwt_decode(json.access_token);
    userData.set(dec);
    return true;
  }
}

async function getPerms() {
  let res = await afetch(authURL + '/roles', {method: 'GET'})
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
  const res = await fetch(authURL + '/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password
    })
  });
  if (res.status == 200) {
    const json = await res.json();
    console.log("Login Success");
    accessToken.set(json.access_token);
    refreshToken.set(json.refresh_token);
    loggedIn.set(true);
    let dec = jwt_decode(json.access_token);
    userData.set(dec);
    await getPerms();
    return true;
  }
  console.log("Login failed");
  return false;
}

async function logout() {
  let res = await afetch(authURL + '/logout', {method: 'POST'})
  if (res.status == 200) {
    console.log("Logout Success");
    userData.set({});
    accessToken.set("");
    refreshToken.set("");
    loggedIn.set(false);
    return true;
  }
  console.log("Logout failed");
  return false;
}

async function afetch(url, options) {
  // add logic to add auth header here.
  if (get(loggedIn) === true) {
    let token = get(accessToken)
    let bearer = "bearer " + token
    options["withCredentials"] = true
    options["credentials"] = "include"
    options["headers"] = {'Authorization': bearer, "Content-Type":"application/json" }
  }
  try {
    const res = await fetch(url, options);
    if (get(loggedIn) && (res.status == 401)) {
      // refreshLogin will set LoggedIn to false if it fails, so we only do one loop
      console.log("Suspect access expired. Try to refresh")
      let rfl = await refreshLogin();
      if(rfl == true){
        // success refresh
        const res2 = await afetch(url, options);
        return res2
      }
    }
    return res
  } catch (err) {
    return {status: 500};
  }
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
