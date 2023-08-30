function minmax(pro, def) {
  let res = null;
  if (def['type'] !== null) {
    if (def.unit === '%') {
      res = { min: 0, max: 100 };
      if ((def.multiplier != null) && (def.multiplier < 1)) {
        res.min = Math.round(res.min / def.multiplier);
        res.max = Math.round(res.max / def.multiplier);
      }
    } else if (def.unit == 'deg') {
      res = { min: -180, max: 180 };
      if ((def.multiplier != null) && (def.multiplier < 1)) {
        res.min = Math.round(res.min / def.multiplier);
        res.max = Math.round(res.max / def.multiplier);
      }
    } else if (def.unit == 'rad') {
      if (def['type'].startsWith('int')) {
        res = { min: -Math.PI, max: Math.PI };
      } else {
        res = { min: 0, max: 2 * Math.PI };
      }
      if ((def.multiplier != null) && (def.multiplier < 1)) {
        res.min = Math.round(res.min / def.multiplier);
        res.max = Math.round(res.max / def.multiplier);
        let num = def.multiplier.toString().split('.')[1].length || 0;
        if (Number.isInteger(num)) {
          res.min = parseFloat(res.min.toFixed(num));
          res.max = parseFloat(res.max.toFixed(num));
        }
      }
    } else if (def['type'].startsWith('bit(')) {
      let num = parseInt(def['type'].replace('bit(', '').replace(')', ''));
      if (Number.isInteger(num)) {
        res = { min: 0, max: Math.pow(2, num) - 1 };
        if ((pro === 'j1939') && (def.offset !== null) && (def.offset !== 0)) {
          res.min += def.offset;
          res.max += def.offset;
        }
      }
    } else if (def['type'].startsWith('int') || def['type'].startsWith('uint')) {
      let num = parseInt(def['type'].replace('uint', '').replace('int', ''));
      if (Number.isInteger(num)) {
        if (def['type'].startsWith('int')) {
          res = { min: -Math.pow(2, num - 1), max: Math.pow(2, num - 1) - 1 };
        } else {
          res = { min: 0, max: Math.pow(2, num) - 1 };
        }
        if ((pro === 'j1939') && (def.offset !== null) && (def.offset !== 0)) {
          res.max += def.offset;
          res.min += def.offset;
        }
      }
    } else if (def['type'].startsWith('float')) {
      let num = parseInt(def['type'].replace('float', ''));
      if (num === 32) {
        res = { min: -3.40282347e+38, max: 3.40282347e+38 };
      } else if (num === 64) {
        res = { min: Number.MIN_VALUE, max: Number.MAX_VALUE };
      }
      if ((pro === 'j1939') && (def.offset !== null) && (def.offset !== 0)) {
        res.min += def.offset;
        res.max += def.offset;
      }
    }
  }
  return res;
};

function limits(def) {
  let lim = def.limits;
  if (def.ranges !== null) {
    lim = { min: def.ranges.min, max: def.ranges.max };
    if ((def.multiplier != null) && (def.multiplier < 1)) {
      lim.min = Math.round(lim.min / def.multiplier);
      lim.max = Math.round(lim.max / def.multiplier);
    }
  }
  return lim;
};

function decode(def, lim) {
  let res = (def.sival !== null) ? def.sival : 0;
  if ((def.multiplier !== null) && (def.multiplier < 1)) {
    res /= def.multiplier;
  }
  if (lim != null) {
    if (res < lim.min) {
      res = lim.min;
    } else if (res > lim.max) {
      res = lim.max;
    }
  }
  return res;
};


function limit(lim, typ, val) {
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
  return val;
};

function encode1(def, val) {
  val = Math.round(val);
  if ((def.multiplier != null) && (def.multiplier < 1)) {
    let dec = 0;
    if (("" + def.multiplier).toLowerCase().indexOf('e') !== -1) {
      dec = Math.abs(parseInt(("" + def.multiplier).toLowerCase().split('e')[1]))
    } else {
      dec = def.multiplier.toString().split('.')[1].length;
    }
    val = parseFloat((val * def.multiplier).toFixed(Math.min(dec, 5)));
  }
  return val;
};

function encode2(def, val) {
  if ((def.multiplier != null) && (def.multiplier < 1)) {
    val *= def.multiplier;
  }
  return val;
};

function nextIncremental(def, rat) {
  let lim = limits(def);
  let res = decode(def, lim);
  let dif = (lim.max - lim.min) * rat / 100;
  res += dif;
  res = limit(lim, 1, res);
  return { value: encode1(def, res), sival: encode2(def, res) };
};

function nextDecremental(def, rat) {
  let lim = limits(def);
  let res = decode(def, lim);
  let dif = Math.round((lim.max - lim.min) * rat / 100);
  res -= dif;
  res = limit(lim, 2, res);
  return { value: encode1(def, res), sival: encode2(def, res) };
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
  res = limit(lim, 3, res);
  return { value: encode1(def, res), sival: encode2(def, res) };
};

function nextRandom(def) {
  let lim = limits(def);
  let res = Math.round((Math.random() * (lim.max - lim.min)) + lim.min);
  res = limit(lim, 3, res);
  return { value: encode1(def, res), sival: encode2(def, res) };
};

export { minmax, nextIncremental, nextDecremental, nextNatural, nextRandom };
