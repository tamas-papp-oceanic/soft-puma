/* NMEA2000 messages

    key = nmea2000/{pgn}/{function}/{manufacturer}/{industry}/{instance}/{fluidtype}

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
};

function load(cfg) {
  let fil = path.join(app.getAppPath(), 'src/config/' + cfg + '.json');
  if (fs.existsSync(fil)) {
    return JSON.parse(fs.readFileSync(fil, 'utf8'));
  }
  return null;
};

// Returns with PGN value
function getPgn(frm) {
  let pgn = (frm.id & 0x1FFFF00) >> 8;
	if (((pgn >> 8) & 0xFF) < 0xF0)
	{
		pgn &= 0x1FF00;
	}
  return pgn;
};

// Returns with CAN source
function getSrc(frm) {
  return frm.id & 0xFF;
};

// Returns with CAN destination
function getDst(frm) {
  let pgn = (frm.id & 0x1FFFF00) >> 8;
	if (((pgn >> 8) & 0xFF) < 0xF0)
	{
		return (pgn >> 8) & 0xFF;
	}
  return 0xFF;
};

// Returns with PGN definition
function findPgn(frm) {
  let pgn = getPgn(frm);
  let key = "nmea2000/" + pgn.toString().padStart(6, '0');
  let cnv = nmeaconv[key];
  if (typeof cnv !== "undefined") {
    if (typeof cnv.function !== "undefined") {
      key += "/" + frm.data[cnv.function];
    } else {
      key += "/-";
    }
    if (isProprietary(pgn)) {
      let val = (parseInt(frm.data[1]) * 256) + parseInt(frm.data[0])
      key += "/" + (val & 0x7FF) + "/" + ((val >> 13) & 7);
    } else {
      key += "/-/-";
    }
  } else {
    key += "/-/-/-";
  }
  if (typeof nmeadefs[key] !== "undefined") {
    let out = JSON.parse(JSON.stringify(nmeadefs[key]));
    out.key = key;
    return out;
  }    
  return null;
};

// Returns true if proprietary
function isProprietary(pgn) {
  if ((pgn == "061184") || ((pgn >= "065280") && (pgn <= "065535")) || 
    (pgn == "126720") || ((pgn >= "130816") && (pgn <= "131071"))) {
    return true;
  }
  return false;
}

function isSingle(frm) {
  let pgn = getPgn(frm);
  if (isProprietary(pgn)) {
    return (pgn <= 65535);
  } else {
    for (const [key, val] of Object.entries(nmeadefs)) {
      if (key.startsWith('nmea2000/' + pgn)) {
        return val.single;
      }
    }
  }
  return true;
};

// Returns with field length
function calcLength(typ, val) {
  let len = null;
  if (typ.startsWith('bit(')) {
    len = parseInt(typ.replace('bit(', '').replace(')', ''));
  } else if (typ.startsWith('chr(')) {
    let tmp = typ.replace('chr(', '').replace(')', '');
    if (tmp != 'x') {
      len = parseInt(tmp);
    } else {
      len = val + 1;
    }
  } else if (typ == 'str') {
    len = val;
  } else if (typ.startsWith('int')) {
    len = parseInt(typ.replace('int', ''));
  } else if (typ.startsWith('uint')) {
    len = parseInt(typ.replace('uint', ''));
  } else if (typ.startsWith('float')) {
    len = parseInt(typ.replace('float', ''));
  }
  return len;
}

// Returns with field status
function getStatus(val, typ) {
  let sts = 'V';
  if (typ.startsWith('int')) {
    let bit = parseInt(typ.replace('int', ''));
    if (bit < 64) {
      if (val == (2 ** (bit - 1)) - 1) {
        sts = '-';
      } else if (val == (2 ** (bit - 1)) - 2) {
        sts = 'E';
      }
    } else {
      if (BigInt(val) == (2n ** BigInt(bit - 1)) - 1n) {
        sts = '-';
      } else if (BigInt(val) == (2n ** BigInt(bit - 1)) - 2n) {
        sts = 'E';
      }
    }
  } else if (typ.startsWith('uint')) {
    let bit = parseInt(typ.replace('uint', ''));
    if (bit < 64) {
      if (val == (2 ** bit) - 1) {
        sts = '-';
      } else if (val == (2 ** bit) - 2) {
        sts = 'E';
      }
    } else {
      if (BigInt(val) == (2n ** BigInt(bit)) - 1n) {
        sts = '-';
      } else if (BigInt(val) == (2n ** BigInt(bit)) - 2n) {
        sts = 'E';
      }
    }
  }
  return sts;
};

module.exports = {
  init,
  load,
  getPgn,
  getSrc,
  getDst,
  findPgn,
  isProprietary,
  isSingle,
  calcLength,
  getStatus,
};
