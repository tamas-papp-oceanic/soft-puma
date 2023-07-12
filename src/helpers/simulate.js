function minmax(def) {
  if (def['type'] !== null) {
    if (def['type'].startsWith('bit(')) {
      let num = parseInt(def['type'].replace('bit(', '').replace(')', ''));
      if (Number.isInteger(num)) {
        return { min: 0, max: Math.pow(2, num) - 1 };
      }
    } else if (def['type'].startsWith('int') || def['type'].startsWith('uint')) {
      let num = parseInt(def['type'].replace('uint', '').replace('int', ''));
      if (Number.isInteger(num)) {
        return { min: def['type'].startsWith('uint') ? 0 : -Math.pow(2, num - 1), max: def['type'].startsWith('uint') ? Math.pow(2, num) : Math.pow(2, num - 1) - 1 };
      }
    } else if (def['type'].startsWith('float')) {
      let num = parseInt(def['type'].replace('float', ''));
      if (num === 32) {
        return { min: -3.40282347e+38, max: 3.40282347e+38 };
      } else if (num === 64) {
        return { min: Number.MIN_VALUE, max: Number.MAX_VALUE };
      }
    }
  }
  return null;
};

function ranges(def) {
  if (def['unit'] !== null) {
    if (def['unit'] === '%') {
      return { min: 0, max: 100 };
    } else if (def['unit'] == 'deg') {
      return { min: -180, max: 180 };
    } else if (def['unit'] == 'rad') {
      let max = 2 * Math.PI;
      if ((def.multiplier != null) && (def.multiplier < 1)) {
        let dec = Math.floor(def.multiplier) !== def.multiplier ? def.multiplier.toString().split('.')[1].length || 0 : 0;
        max = max.toFixed(dec);
      }
      return { min: 0, max: max };
    }
  }
  return typeof def.ranges !== 'undefined' ? def.ranges : null;
};

function limits(def) {
  let lim = minmax(def);
  let rng = ranges(def);
  if (rng != null) {
    lim = { min: rng.min, max: rng.max };
    if ((def.multiplier != null) && (def.multiplier < 1)) {
      lim.min = Math.round(lim.min / def.multiplier);
      lim.max = Math.round(lim.max / def.multiplier);
    }
  }
  return lim;
};

function decode(def, lim) {
  let res = def.value !== null ? def.value : 0;
  if ((def.multiplier != null) && (def.multiplier < 1)) {
    res = Math.round(res / def.multiplier);
  }
  if (res < lim.min) {
    res = lim.min;
  } else if (res > lim.max) {
    res = lim.max;
  }
return res;
};

function encode(def, lim, typ, val) {
  if (lim != null) {
    if (typ === 1) {
      if (val > lim.max) {
        val = lim.min;
      }
    } else if (typ === 2) {
      if (val < lim.min) {
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
  if ((def.multiplier != null) && (def.multiplier < 1)) {
    let dec = Math.floor(def.multiplier) !== def.multiplier ? def.multiplier.toString().split('.')[1].length || 0 : 0;
    val = parseFloat((val * def.multiplier).toFixed(dec));
  }
  return val;
};

function nextIncremetal(def, rat) {
  let lim = limits(def);
  let res = decode(def, lim);
  let dif = Math.round((lim.max - lim.min) * rat / 100);
  res += dif;
  return encode(def, lim, 1, res);
};

function nextDecremetal(def, rat) {
  let lim = limits(def);
  let res = decode(def, lim);
  let dif = Math.round((lim.max - lim.min) * rat / 100);
  res -= dif;
  return encode(def, lim, 2, res);
};

function nextNatural(def, rat) {
  let lim = limits(def);
  let res = decode(def, lim);
  let dif = Math.round((lim.max - lim.min) * rat / 100);
  if (Math.random() < 0.5) {
    res -= dif;
  } else {
    res += dif;
  }
  return encode(def, lim, 3, res);
};

function nextRandom(def) {
  let lim = limits(def);
  let res = Math.round((Math.random() * (lim.max - lim.min)) + lim.min);
  return encode(def, lim, 3, res);
};

export { minmax, ranges, nextIncremetal, nextDecremetal, nextNatural, nextRandom };
