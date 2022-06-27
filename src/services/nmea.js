/* NMEA2000 messages

    key = nmea2000/{pgn}/{function}/{manufacturer}/{industry}

    Single-frame Proprietary
      061184          - addressable
      065280 - 065535 - global

    Fast-packet Proprietary
      12720           - addressable
      130816 - 131071 - global

    Proprietary required fields:
      1. Manufacturer   11 bit
      2. Reserved        2 bit
      3. Industry Group  3 bit
 */ 
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

let nmeadefs = {};
let nmeaconv = {};
let fastbuff = {};

function init() {
  let nde = path.join(app.getAppPath(), 'src/config/nmeadefs.json');
  let nco = path.join(app.getAppPath(), 'src/config/nmeaconv.json');
  try {
    if (fs.existsSync(nde)) {
      nmeadefs = JSON.parse(fs.readFileSync(nde, 'utf8'));
    }
    if (fs.existsSync(nco)) {
      nmeaconv = JSON.parse(fs.readFileSync(nco, 'utf8'));
    }
  } catch(err) {
    console.log(err);
  }
}

// Convert can frame to message
function fromCanFrame(frm) {
  let tmp = (frm.id & 0x1FFFF00) >> 8;
	if (((tmp >> 8) & 0xFF) < 0xF0)
	{
		tmp &= 0x1FF00;
	}
  let pgn = tmp.toString().padStart(6, '0');
  let key = "nmea2000/" + pgn;
  if (typeof nmeaconv[key] !== "undefined") {

  } else {
    key += "/-/-/-";
  }
  let out = {};
  if (typeof nmeadefs[key] !== "undefined") {
    let def = nmeadefs[key];

    if (def.single) {

    } else {
      let fky = frm.id.toString().padStart(6, '0');
      if (typeof fastbuff[fky] === "undefined") {
        let cnt = Number("0x" + frm.data[0]);
        let len = Number("0x" + frm.data[1]);
        let fap = {
          length: len,
          sequence: cnt >> 5,
          counter: cnt & 0x1F,
          expected: 1,
          index: 0,
          timeout: (750 / 20) + 1,
          finished: false,
          corrupted: (cnt & 0x1F) != 0,
          data: Buffer.alloc(len),
        };
        let dat = Buffer.alloc(8);
        dat.fill(0xFF);
        // Copy first part of data
        for (let i = 0; i < Math.min(fap.length, 6); i++) {
          dat[fap.index++] = frm.data[i + 2];
        }
        dat.copy(fap.data);
        fap.finished = (fap.index >= fap.length);
        fastbuff[fky] = fap;
      } else {
        let fap = fastbuff[fky];
        let cnt = Number("0x" + frm.data[0]);
        if (!fap.corrupted) {
          if (fap.sequence != (cnt >> 5)) {
            fap.corrupted = true;
          }
        }
        if (!fap.corrupted) {
          if (fap.expected != (cnt & 0x1F)) {
            fap.corrupted = true;
          }
        }
        if (!fap.corrupted) {
          let start = fap.start
          let end = Date.Now();
          if ((end - start) > (fap.timeout * 1000)) {
            fap.corrupted = true;
          }
        }
        if (!fap.Corrupted) {
          let min = Math.min(7, (fap.length - fap.index));
          frm.data.copy(fap.data, fap.index);
          fap.index += min;
          fap.expected++;
          fap.finished = fap.index >= fap.length;
        }
      }
    }
  }
  return out;

  // let msg = {
  //   id: pgn,
  //   ext: true,
  //   rtr: false,
  //   data : (len > 0 && len < 64) ? Buffer.alloc(len) : Buffer.alloc(64),
  //   t_sec: Math.floor(tim),
  //   t_usec: Math.round((tim - Math.floor(tim)) * 1000000),
  // };


}

// NMEA data processing function
function process(msg) {
  let def = fromCanFrame(msg);
console.log(def)
}

module.exports = {
  init,
  process,
};
