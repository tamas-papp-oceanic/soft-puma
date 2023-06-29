// This file is the route guard that prevents access to unauthorised resources

// Skippng implementation for funtionality first

import { get } from "svelte/store";
import { userData, accessToken, refreshToken, loggedIn,
  permissions } from '../stores/user.js';

// function routeGuard
// accepts detail.route and returns true if authorised or false if unauthorised

function routeGuard(location) {

}
