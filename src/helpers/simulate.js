function minmax(def) {
  if (def['unit'] == '%') {
    return { min: 0, max: 100 };
  } else if (def['unit'] == 'deg') {
    return { min: -180, max: 180 };
  } else if (def['unit'] == 'rad') {
    return { min: 0, max: 360 };
  } else if (def['type'].startsWith('bit(')) {
    let num = parseInt(def['type'].replace('bit(', '').replace(')', ''));
    if (Number.isInteger(num)) {
      return { min: 0, max: Math.pow(2, num) };
    }
  } else if (def['type'].startsWith('int') || def['type'].startsWith('uint')) {
    let num = parseInt(def['type'].replace('uint', '').replace('int', ''));
    if (Number.isInteger(num)) {
      return { min: def['type'].startsWith('uint') ? 0 : -Math.pow(2, num - 1), max: def['type'].startsWith('uint') ? Math.pow(2, num) : Math.pow(2, num - 1) - 1 };
    }
  }
  return null;
};

function nextIncremetal(def) {
  let res = def.value != null ? def.value : 0;
  let lim = minmax(def);
  if (def.multiplier != null) {
    res /= def.multiplier;
  }
  res++;
  if (def.multiplier != null) {
    res *= def.multiplier;
  }
  if (lim != null) {
    if (res > lim.max) {
      res = lim.min;
    }
  }
  return res;
};

function nextDecremetal(def) {
  let res = def.value != null ? def.value : 0;
  let lim = minmax(def);
  if (def.multiplier != null) {
    res /= def.multiplier;
  }
  res--;
  if (def.multiplier != null) {
    res *= def.multiplier;
  }
  if (lim != null) {
    if (res < lim.min) {
      res = lim.max;
    }
  }
  return res;
};

function nextNatural(def) {
  let res = def.value != null ? def.value : 0;
  let lim = minmax(def);
  let rnd = Math.random();
  if (def.multiplier != null) {
    res /= def.multiplier;
  }
  if (rnd < 0.5) {
    res--;
  } else {
    res++;
  }
  if (def.multiplier != null) {
    res *= def.multiplier;
  }
  if (res < lim.min) {
    res = lim.min;
  } else if (res > lim.max) {
    res = lim.max;
  }
  return res;
};

function nextRandom(def) {
  let res = def.value != null ? def.value : 0;
  let lim = minmax(def);
  let rnd = Math.random();
  res = Math.round((rnd * (lim.max - lim.min)) + lim.min);
  if (res < lim.min) {
    res = lim.min;
  } else if (res > lim.max) {
    res = lim.max;
  }
  return res;
};

export { nextIncremetal, nextDecremetal, nextNatural, nextRandom };
