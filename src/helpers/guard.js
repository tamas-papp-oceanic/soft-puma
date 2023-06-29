// This file is the route guard that prevents access to unauthorised resources

// Skippng implementation for funtionality first

import { get } from "svelte/store";
import { userData, accessToken, refreshToken, loggedIn,
  permissions } from '../stores/user.js';
import guard from '../config/guard.json';
  
// function routeGuard
// accepts detail.route and returns true if authorised or false if unauthorised

function routeGuard(location) {
  let dep = 'Guest';
  let usr = get(userData);
  try {
    dep = usr.department;
  } catch (err) {
    // console.log(err)
  }
  if (guard[dep][location.substring(1)]) {
    return true;
  }
  return false;
}

export { routeGuard }