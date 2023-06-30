// This file is the route guard that prevents access to unauthorised resources

// Skippng implementation for funtionality first

import { get } from "svelte/store";
import { userData, accessToken, refreshToken, loggedIn,
  permissions } from '../stores/user.js';
import guard from '../config/guard.json';
  
// function routeGuard
// accepts detail.route and returns true if authorised or false if unauthorised

function routeGuard(det) {
  let dep = 'Guest';
  let loc = 'dummy';
  let usr = get(userData);
  try {
    if (typeof usr.department !== 'undefined') {
      dep = usr.department;
    }
    if (typeof det.location !== 'undefined') {
      let spl = det.location.split('/');
      if (spl.length > 1) {
        loc = det.location.split('/')[1];
      }
    }
  } catch (err) {
    // console.log(err)
  }
  return guard[dep][loc];
}

export { routeGuard }