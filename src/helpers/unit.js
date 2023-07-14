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

allMeasures['levelOfPowerIntensity'] = {
  "systems": {
    "SI": {
      "B": {
        name: {
          singular: 'Bel',
          plural: 'Bels',
        },
        to_anchor: 1,
      },
      "dB": {
        name: {
          singular: 'Decibel',
          plural: 'Decibels',
        },
        to_anchor: 10,
      },
    },
  },
};

// NMEA2000 standard units
let units = {
   "sec":   "s",
   "day":   "d",
   "deg":   "deg",
   "rad":   "rad",
   "m/s":   "m/s",
   "m":     "m",
   "rad/s": "rad/s",
   "RPM":   "rpm",
   "Pa":    "Pa",
   "%":     "%",
   "K":     "K",
   "V":     "V",
   "m3/h":  "m3/h",
   "m3":    "m3",
   "A":     "A",
   "Hz":    "Hz",
   "W":     "W",
   "VAR":   "VAR",
   "min":   "min",
   "C":     "C",
   "degs":  "arcsec",
   "dB":    "dB",
   "Pa/h":  "Pa/h",
   "kg":    "kg",
   "ppm":   "ppm",
   "kPa":   "kPa",
   "Ah":    "Ah",
   "vol":   "dB",
};

for (const [key, val] of Object.entries(units)) {
  try {
    let pos = convert().from(val).possibilities();
    console.log(key, pos); 
  } catch (err) {
    // console.log(err)
    console.log(key, []); 
  }
}
console.log(units);

function test() {
  console.log(convert(1).from('dB').to('B'));
}

export { test };
