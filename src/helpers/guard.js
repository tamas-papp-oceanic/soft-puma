// This file is the route guard that prevents access to unauthorised resources

// Skippng implementation for funtionality first

import { get } from "svelte/store";
import { userData, loggedIn } from '../stores/user.js';
import guard from '../config/guard.json';
  
// function routeGuard
// accepts detail.route and returns true if authorised or false if unauthorised
function routeGuard(det) {
  let prm = 'Basic';
  let loc = "";
  let usr = get(userData);
  try {
    if ((usr !== null) && usr.hasOwnProperty("permission")) {
      prm = usr.permission;
    }
    if (det.hasOwnProperty("location")) {
      let logged = get(loggedIn);
      if (det.location == "/") {
        loc = "analyse";
      } else {
        let spl = det.location.split('/');
        if (spl.length > 1) {
          loc = spl[1];
        }
      }
      switch (loc) { 
      case 'messages':
      case 'monitor':
        loc = "analyse";
        break;
      case 'details':
        return false;
      case 'login':
        return !logged;
      case 'welcome':
        return logged;
      default:
        break;
      }
    }
  } catch (err) {
    // console.log(err)
    return false;
  }
  return guard[prm][loc];
}

export { routeGuard }