// Decodes data
function decode(def, val) {
  if ((typeof def.multiplier !== 'undefined') && (def.multiplier !== null)) {
    if (typeof val == 'bigint') {
      if (def.multiplier >= 1) {
        val *= BigInt(def.multiplier);
      } else {
        val /= BigInt(1 / def.multiplier);
      }
      val = Number(val);
    } else {
      val *= def.multiplier;
    }
  }
  if ((typeof def.offset !== 'undefined') && (def.offset !== null)) {
    val += def.offset;
  }
  return val;
}

// Encodes data
function encode(def, val) {
  if ((typeof def.offset !== 'undefined') && (def.offset !== null)) {
    val -= def.offset;
  }
  if ((typeof def.multiplier !== 'undefined') && (def.multiplier !== null)) {
    if (typeof val === 'bigint') {
      if (def.multiplier >= 1) {
        val /= BigInt(fld.multiplier);
      } else {
        val *= BigInt(1 / fld.multiplier);
      }
      val = Number(val);
    } else {
      val /= def.multiplier;
    }
  }
  if (def['type'].startsWith('bit(') || def['type'].startsWith('uint') || def['type'].startsWith('int')) {
    val = Math.round(val);
  }
  return val;
};

module.exports = {
  decode,
  encode,
};
