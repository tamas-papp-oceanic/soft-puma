// This file is the route guard that prevents access to unauthorised resources

// Skippng implementation for funtionality first

import { get } from "svelte/store";
import { userData } from '../stores/user.js';
import { loggedIn } from '../stores/user.js';
import guard from '../config/guard.json';
  
// function routeGuard
// accepts detail.route and returns true if authorised or false if unauthorised

function routeGuard(det) {
  let dep = 'Guest';
  let loc = 'dummy';
  let usr = get(userData);
  try {
    if ((usr !== null) && usr.hasOwnProperty("department")) {
      dep = usr.department;
    }
    if (typeof det.location !== 'undefined') {
      let logged = get(loggedIn);
      switch (det.location) { 
      case '/':
        loc = "analyse";
        break;
      case '/details':
        return false;
      case '/login':
        return !logged;
      case '/welcome':
        return logged;
      default:
        let spl = det.location.split('/');
        if (spl.length > 1) {
          loc = det.location.split('/')[1];
        }
        break;
      }
    }
  } catch (err) {
    // console.log(err)
    return false;
  }
  switch (loc) { 
  case 'messages':
  case 'monitor':
  case 'simulate':
    return true;
  }
  return guard[dep][loc];
}

export { routeGuard }