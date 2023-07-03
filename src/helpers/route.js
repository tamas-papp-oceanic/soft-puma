import { get } from 'svelte/store';
import { routeGuard } from './guard.js';
import { name, device, allRoutes } from "../stores/data.js";
import { getdev } from '../config/devices.js';

// Check if route exists in route table
function isRoute(prf, src) {
  if (routeGuard({ location: prf })) {
    switch (prf) {
    case '/details':
    case '/messages':
    case '/monitor':
    case '/program':
      break;
    default:
      try {
        let nms = get(name);
        let dev = get(device);
        let nam = nms[dev][src];
        dev = getdev(nam.modelVersion);
        prf += '/' + nam.modelVersion + '/:instance';
        if ((dev != null) && dev.fluid) {
          prf += '/:fluid';
        }
      } catch (err) {
        // console.log(err);
        return false;
      }
      break;
    }
    let ros = get(allRoutes)
    for (let rou of ros) {
      if (rou.startsWith(prf)) {
        return true;
      }
    }
  }
  return false;
};

export { isRoute };