import { get, writable } from "svelte/store";
import jwt_decode from "jwt-decode";
import { userData, accessToken, refreshToken, loggedIn, permissions } from '../stores/user.js';

const authURL = writable('http://puma.osukl.com:80');

window.pumaAPI.recv('auth-url', (e, val) => {
  authURL.set(val);
});

async function refreshLogin() {
  let token = get(refreshToken);
  let res = await fetch(get(authURL) + '/refresh', {
    method: 'POST',
    body: JSON.stringify({
      'refresh_token': token,
    }),
  });
  if (res.status == 201) {
    const json = await res.json();
    accessToken.set(json.access_token);
    refreshToken.set(json.refresh_token);
    let dec = jwt_decode(json.access_token);
    userData.set(dec);
    loggedIn.set(true);
    console.log("Refresh Success");
    return true;
  } else {
    loggedIn.set(false);
    console.log("Refresh failed");
    return false;
  }
}

async function getPerms() {
  let res = await afetch(get(authURL) + '/roles', {method: 'GET'});
  if (res.status == 200) {
    let perms = await res.json();
    let permsObject= {};
    for (let i = 0; i < perms.length; i++) {
      if(typeof permsObject[perms[i][1]] === 'undefined') {
        permsObject[perms[i][1]] = {};
      }
      permsObject[perms[i][1]][perms[i][2]] = true;
    }
    permissions.set(permsObject);
  }
}

async function login(username, password) {
  const res = await fetch(get(authURL) + '/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password
    })
  });
  if (res.status == 200) {
    const json = await res.json();
    accessToken.set(json.access_token);
    refreshToken.set(json.refresh_token);
    let dec = jwt_decode(json.access_token);
    userData.set(dec);
    loggedIn.set(true);
    await getPerms();
    console.log("Login Success");
    return true;
  }
  console.log("Login failed");
  return false;
}

async function logout() {
  const res = await afetch(get(authURL) + '/logout', {method: 'POST'})
  if (res.status == 200) {
    permissions.set({});
    userData.set({});
    accessToken.set("");
    refreshToken.set("");
    loggedIn.set(false);
    console.log("Logout Success");
    return true;
  }
  console.log("Logout failed");
  return false;
}

async function afetch(url, options) {
  // add logic to add auth header here.
  let lin = get(loggedIn);
  if (lin) {
    let token = get(accessToken)
    let bearer = "bearer " + token
    options["withCredentials"] = true
    options["credentials"] = "include"
    options["headers"] = {'Authorization': bearer, "Content-Type":"application/json" }
  }
  try {
    let lin = get(loggedIn);
    const res = await fetch(url, options);
    if (lin && (res.status == 401)) {
      // refreshLogin will set LoggedIn to false if it fails, so we only do one loop
      console.log("Suspect access expired. Try to refresh")
      let rfl = await refreshLogin();
      if (rfl == true) {
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
async function checkAccess(route, type) {
  await getPerms();
  let prm = get(permissions);
  if ((prm != null) && (typeof prm[route] !== 'undefined') &&
    (typeof prm[route][type] !== 'undefined')) {
    return prm[route][type];
  }
  return false;
}

export {
  authURL,
  login,
  logout,
  afetch,
  checkAccess,
}
