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
        return { min: Number.MIN_VALUE, max: Number.MIN_VALUE };
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

function nextIncremetal(def, dif) {
  let res = def.value !== null ? def.value : 0;
  let lim = minmax(def);
  let rng = ranges(def);
  if (rng != null) {
    if ((res < rng.min) || (res > rng.max)) {
      res = rng.min;
    }
  }
  if ((def.multiplier != null) && (def.multiplier < 1)) {
    res = Math.round(res / def.multiplier);
  }
  if (lim != null) {
    if ((res < lim.min) || (res > lim.max)) {
      res = lim.min;
    }
  }
  res += dif;
  if (lim != null) {
    if (res > lim.max) {
      res = lim.min;
    }
  }
  if ((def.multiplier != null) && (def.multiplier < 1)) {
    let dec = Math.floor(def.multiplier) !== def.multiplier ? def.multiplier.toString().split('.')[1].length || 0 : 0;
    res = parseFloat((res * def.multiplier).toFixed(dec));
  }
  return res;
};

function nextDecremetal(def, dif) {
  let res = def.value != null ? def.value : 0;
  let lim = minmax(def);
  let rng = ranges(def);
  if (rng != null) {
    if ((res < rng.min) || (res > rng.max)) {
      res = rng.max;
    }
  }
  if ((def.multiplier != null) && (def.multiplier < 1)) {
    res = Math.round(res / def.multiplier);
  }
  if (lim != null) {
    if ((res < lim.min) || (res > lim.max)) {
      res = lim.max;
    }
  }
  res -= dif;
  if (lim != null) {
    if (res < lim.min) {
      res = lim.max;
    }
  }
  if ((def.multiplier != null) && (def.multiplier < 1)) {
    let dec = Math.floor(def.multiplier) !== def.multiplier ? def.multiplier.toString().split('.')[1].length || 0 : 0;
    res = parseFloat((res * def.multiplier).toFixed(dec));
  }
  return res;
};

function nextNatural(def, dif) {
  let res = def.value != null ? def.value : 0;
  let lim = minmax(def);
  let rng = ranges(def);
  if (rng != null) {
    if ((res < rng.min) || (res > rng.max)) {
      res = rng.min;
    }
  }
  if ((def.multiplier != null) && (def.multiplier < 1)) {
    res = Math.round(res / def.multiplier);
  }
  if (lim != null) {
    if ((res < lim.min) || (res > lim.max)) {
      res = lim.min;
    }
  }
  if (Math.random() < 0.5) {
    res -= dif;
  } else {
    res += dif;
  }
  if (lim != null) {
    if (res < lim.min) {
      res = lim.min;
    } else if (res > lim.max) {
      res = lim.max;
    }
  }
  if ((def.multiplier != null) && (def.multiplier < 1)) {
    let dec = Math.floor(def.multiplier) !== def.multiplier ? def.multiplier.toString().split('.')[1].length || 0 : 0;
    res = parseFloat((res * def.multiplier).toFixed(dec));
  }
  return res;
};

function nextRandom(def) {
  let lim = minmax(def);
  let rng = ranges(def);
  let res = 0;
  if (rng != null) {
    res = (Math.random() * (rng.max - rng.min)) + rng.min;
    if ((def.multiplier != null) && (def.multiplier < 1)) {
      res = res / def.multiplier;
    }
    if (lim != null) {
      if ((res < lim.min) || (res > lim.max)) {
        res = lim.min;
      }
    }
  } else {
    res = (Math.random() * (lim.max - lim.min)) + lim.min;
  }
  if ((def.multiplier != null) && (def.multiplier < 1)) {
    let dec = Math.floor(def.multiplier) !== def.multiplier ? def.multiplier.toString().split('.')[1].length || 0 : 0;
    res = parseFloat((Math.round(res) * def.multiplier).toFixed(dec));
  } else {
    res = Math.round(res);
  }
  return res;
};

export { minmax, ranges, nextIncremetal, nextDecremetal, nextNatural, nextRandom };
