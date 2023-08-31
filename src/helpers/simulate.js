import { encode, decode } from '../services/convert.js';

function minmax(def) {
  let res = null;
  if (def['type'] !== null) {
    if (def.unit === '%') {
      res = { min: 0, max: 100 };
    } else if (def.unit == 'deg') {
      res = { min: -180, max: 180 };
    } else if (def.unit == 'rad') {
      if (def['type'].startsWith('int')) {
        res = { min: -parseFloat(Math.PI.toFixed(5)), max: parseFloat(Math.PI.toFixed(5)) };
      } else {
        res = { min: 0, max: 2 * parseFloat(Math.PI.toFixed(5)) };
      }
    } else {
      if (def['type'].startsWith('bit(')) {
        let num = parseInt(def['type'].replace('bit(', '').replace(')', ''));
        if (Number.isInteger(num)) {
          res = { min: 0, max: Math.pow(2, num) - 1 };
        }
      } else if (def['type'].startsWith('int') || def['type'].startsWith('uint')) {
        let num = parseInt(def['type'].replace('uint', '').replace('int', ''));
        if (Number.isInteger(num)) {
          if (def['type'].startsWith('int')) {
            res = { min: -Math.pow(2, num - 1), max: Math.pow(2, num - 1) - 1 };
          } else {
            res = { min: 0, max: Math.pow(2, num) - 1 };
          }
        }
      } else if (def['type'].startsWith('float')) {
        let num = parseInt(def['type'].replace('float', ''));
        if (num === 32) {
          res = { min: -3.40282347e+38, max: 3.40282347e+38 };
        } else if (num === 64) {
          res = { min: Number.MIN_VALUE, max: Number.MAX_VALUE };
        }
      }
      if (res !== null) {
        if ((typeof def.multiplier !== 'undefined') && (def.multiplier !== null)) {
          res.min = res.min * def.multiplier;
          res.max = res.max * def.multiplier;
        }
        if ((typeof def.offset !== 'undefined') && (def.offset !== null)) {
          res.min += def.offset;
          res.max += def.offset;
        }
        res.min = parseFloat(res.min.toFixed(5));
        res.max = parseFloat(res.max.toFixed(5));
      }
    }
  }
  return res;
};

function limits(def) {
  let lim = def.limits;
  if ((typeof def.ranges !== 'undefined') && (def.ranges !== null)) {
    lim = { min: def.ranges.min, max: def.ranges.max };
  }
  return lim;
};

function limit(lim, typ, val) {
  if (lim != null) {
    if (typ === 1) {
      if (val < lim.min) {
        val = lim.min;
      } else if (val > lim.max) {
        val = lim.min;
      }
    } else if (typ === 2) {
      if (val < lim.min) {
        val = lim.max;
      } else if (val > lim.max) {
        val = lim.max;
      }
    } else if (typ === 3) {
      if (val < lim.min) {
        val = lim.min;
      } else if (val > lim.max) {
        val = lim.max;
      }
    }
  }
  return val;
};

function adjust(def, val) {
  if (def['type'].startsWith('bit(') || def['type'].startsWith('int') || def['type'].startsWith('uint')) {
    let tmp = encode(def, val);
    if (tmp !== Math.round(tmp)) {
      tmp = Math.round(tmp);
      val = decode(def, tmp);
    }    
  }
  return parseFloat(val.toFixed(5));
};

function nextIncremental(def, rat) {
  let lim = limits(def);
  let res = (def.sival !== null) ? def.sival : 0;
  let dif = (lim.max - lim.min) * rat / 100;
  res += dif;
  res = limit(lim, 1, res);
  return { value: adjust(def, res), sival: res };
};

function nextDecremental(def, rat) {
  let lim = limits(def);
  let res = (def.sival !== null) ? def.sival : 0;
  let dif = (lim.max - lim.min) * rat / 100;
  res -= dif;
  res = limit(lim, 2, res);
  return { value: adjust(def, res), sival: res };
};

function nextNatural(def, rat) {
  let lim = limits(def);
  let res = (def.sival !== null) ? def.sival : 0;
  let dif = (lim.max - lim.min) * rat / 100;
  if (Math.random() < 0.5) {
    res -= dif;
  } else {
    res += dif;
  }
  res = limit(lim, 3, res);
  return { value: adjust(def, res), sival: res };
};

function nextRandom(def) {
  let lim = limits(def);
  let res = (Math.random() * (lim.max - lim.min)) + lim.min;
  res = limit(lim, 3, res);
  return { value: adjust(def, res), sival: res };
};

export { minmax, nextIncremental, nextDecremental, nextNatural, nextRandom };
