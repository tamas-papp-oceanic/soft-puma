import configureMeasurements, { allMeasures } from 'convert-units';

const convert = configureMeasurements(allMeasures);

allMeasures.charge.systems.SI['Ah'] = {
  "name": {
    plural: "Ampere-hours",
    singular: "Ampere-hour"
  },
  "to_anchor": 60 * 60,
};

allMeasures['pressurePerTime'] = {
  "systems": {
    "SI": {
      "Pa/s": {
        name: {
          singular: 'Pascal per second',
          plural: 'Pascals per second',
        },
        to_anchor: 1,
      },
      "Pa/h": {
        name: {
          singular: 'Pascal per hour',
          plural: 'Pascals per hour',
        },
        to_anchor: 60 * 60,
      },
      "kPa/d": {
        name: {
          singular: 'Kilopascal per day',
          plural: 'Kilopascals per day',
        },
        to_anchor: 24 * 60 * 60 * 1000,
      },
      "kPa/h": {
        name: {
          singular: 'Kilopascal per hour',
          plural: 'Kilopascals per hour',
        },
        to_anchor: 60 * 60 * 1000,
      },
      "kPa/min": {
        name: {
          singular: 'Kilopascal per minute',
          plural: 'Kilopascals per minute',
        },
        to_anchor: 60 * 1000,
      },
      "MPa/h": {
        name: {
          singular: 'Megapascal per hour',
          plural: 'Megapascals per hour',
        },
        to_anchor: 60 * 60 * 1000 * 1000,
      },
      "atm/h": {
        name: {
          singular: 'Atmosphere per hour',
          plural: 'Atmospheres per hour',
        },
        to_anchor: 60 * 60 / 101300,
      },
      "bar/h": {
        name: {
          singular: 'Bar per hour',
          plural: 'Bars per hour',
        },
        to_anchor: 60 * 60 / 100000,
      },
      "psi/d": {
        name: {
          singular: 'Pound per square inch per day',
          plural: 'Pound per square inches per day',
        },
        to_anchor: 24 * 60 * 60 * 6895,
      },
      "psi/h": {
        name: {
          singular: 'Pound per square inch per hour',
          plural: 'Pound per square inches per hour',
        },
        to_anchor: 60 * 60 * 6895,
      },
      "psi/min": {
        name: {
          singular: 'Pound per square inch per minute',
          plural: 'Pound per square inches per minute',
        },
        to_anchor: 60 * 6895,
      },
      "psi/s": {
        name: {
          singular: 'Pound per square inch per second',
          plural: 'Pound per square inches per second',
        },
        to_anchor: 1 * 6895,
      },
    },
  },
};

// NMEA2000 standard units
let units = {
   "sec":   { unit: "s", default: "s"},
   "day":   { unit: "d", default: "d"},
   "deg":   { unit: "deg", default: "deg"},
   "rad":   { unit: "rad", default: "deg"},
   "m/s":   { unit: "m/s", default: "m/s"},
   "m":     { unit: "m", default: "m"},
   "rad/s": { unit: "rad/s", default: "deg/s"},
   "RPM":   { unit: "rpm", default: "rpm"},
   "Pa":    { unit: "Pa", default: "Pa"},
   "%":     { unit: "%", default: "%"},
   "K":     { unit: "K", default: "C"},
   "V":     { unit: "V", default: "V"},
   "m3/h":  { unit: "m3/h", default: "m3/h"},
   "m3":    { unit: "m3", default: "m3"},
   "A":     { unit: "A", default: "A"},
   "Hz":    { unit: "Hz", default: "Hz"},
   "W":     { unit: "W", default: "W"},
   "VAR":   { unit: "VAR", default: "VAR"},
   "min":   { unit: "min", default: "s"},
   "C":     { unit: "C", default: "C"},
   "degs":  { unit: "arcsec", default: "deg"},
   "dB":    { unit: "dB", default: "dB"},
   "Pa/h":  { unit: "Pa/h", default: "Pa/h"},
   "kg":    { unit: "kg", default: "kg"},
   "ppm":   { unit: "ppm", default: "ppm"},
   "kPa":   { unit: "kPa", default: "kPa"},
   "Ah":    { unit: "Ah", default: "Ah"},
   "vol":   { unit: "dB", default: "dB"},
};

function defValue(obj) {
  let ret = obj;
  try {
    let uni = units[obj.unit].unit;
    let def = units[obj.unit].default;
    try {
      ret  = { value: Math.round(convert(obj.value).from(uni).to(def) * 100000) / 100000, unit: def};
    } catch (err) {
      // console.log(err);
    }
  } catch (err) {
    // console.log(err);
  }
  return ret;
}

export { defValue };
