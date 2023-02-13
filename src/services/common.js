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
const log = require('electron-log');

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
    log.error(err);
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
function getPgn(par) {
  let pgn = (par & 0x1FFFF00) >> 8;
	if (((pgn >> 8) & 0xFF) < 0xF0)
	{
		pgn &= 0x1FF00;
	}
  return pgn;
};

// Returns with priority
function getPri(par) {
  return (par >> 26) & 0x07;
};

// Returns with CAN source
function getSrc(par) {
  return par & 0xFF;
};

// Returns with CAN destination
function getDst(par) {
  let pgn = (par & 0x1FFFF00) >> 8;
	if (((pgn >> 8) & 0xFF) < 0xF0)	{
		return pgn & 0xFF;
	}
  return 0xFF;
};

// Makes PGN value
function makePgn(par) {
  let pgn = par.pgn;
	if (((pgn >> 8) & 0xFF) < 0xF0) {
    pgn |= (par.dst & 0xFF);
	}
  return (pgn << 8) | ((par.pri & 0x07) << 26) | (par.src & 0xFF);
};

// Returns with function field
function findCnv(key) {
  return nmeaconv[key];
}

// Returns with PGN definition
function findDef(frm) {
  let key = getKey(frm);
  if (typeof nmeadefs[key] !== 'undefined') {
    let out = JSON.parse(JSON.stringify(nmeadefs[key]));
    out.key = key;
    return out;
  }    
  return null;
};

// Returns with PGN key
function getKey(frm) {
  let pgn = getPgn(frm.id);
  let key = "nmea2000/" + pgn.toString().padStart(6, '0');
  let cnv = nmeaconv[key];
  if ((typeof cnv !== 'undefined') && (typeof cnv.function !== 'undefined')) {
    key += "/" + frm.data[cnv.function];
  } else {
    key += "/-";
  }
  if (isProprietary(pgn)) {
    let val = frm.data.readUInt16LE(0);
    key += "/" + (val & 0x7FF) + "/" + ((val >> 13) & 7);
  } else {
    key += "/-/-";
  }
  return key;
};

// Returns with PGN definition
function getDef(key) {
  if (typeof nmeadefs[key] !== 'undefined') {
    return JSON.parse(JSON.stringify(nmeadefs[key]));
  }
  return null;
};

// Returns true if proprietary
function isProprietary(pgn) {
  if ((pgn == 61184) || ((pgn >= 65280) && (pgn <= 65535)) || 
    (pgn == 126720) || ((pgn >= 130816) && (pgn <= 131071))) {
    return true;
  }
  return false;
}

function isSingle(pgn) {
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
  if (typ != null) {
    if (typ.startsWith('bit(')) {
      len = parseInt(typ.replace('bit(', '').replace(')', ''));
    } else if (typ.startsWith('chr(')) {
      let tmp = typ.replace('chr(', '').replace(')', '');
      if (tmp != 'x') {
        if (typeof val !== 'undefined') {
          len = val * 8;
        } else {
          len = parseInt(tmp) * 8;
        }
      } else {
        len = (val + 1) * 8;
      }
    } else if (typ == 'str') {
      len = (val + 2) * 8;
    } else if (typ.startsWith('int')) {
      len = parseInt(typ.replace('int', ''));
    } else if (typ.startsWith('uint')) {
      len = parseInt(typ.replace('uint', ''));
    } else if (typ.startsWith('float')) {
      len = parseInt(typ.replace('float', ''));
    }
  }
  return len;
}

// Returns with field status
function getStatus(typ, val) {
  let sts = 'V';
  if (typ.startsWith('int')) {
    let bit = parseInt(typ.replace('int', ''));
    if (BigInt(val) == (2n ** BigInt(bit - 1)) - 1n) {
      sts = '-';
    } else if (BigInt(val) == (2n ** BigInt(bit - 1)) - 2n) {
      sts = 'E';
    }
  } else if (typ.startsWith('uint')) {
    let bit = parseInt(typ.replace('uint', ''));
    if (BigInt(val) == (2n ** BigInt(bit)) - 1n) {
      sts = '-';
    } else if (BigInt(val) == (2n ** BigInt(bit)) - 2n) {
      sts = 'E';
    }
  }
  return sts;
};

// Returns with field
function getFld(fld, fls) {
  for (let i in fls) {
    if (fls[i].field == fld) {
      return JSON.parse(JSON.stringify(fls[i]));
    }
  }
  return null;
};

// Sets field
function setFld(fld, fls) {
  for (let i in fls) {
    if (fls[i].field == fld.field) {
      fls[i] = JSON.parse(JSON.stringify(fld));
      return;
    }
  }
};

module.exports = {
  init,
  load,
  getPgn,
  getPri,
  getSrc,
  getDst,
  makePgn,
  findCnv,
  findDef,
  getKey,
  getDef,
  isProprietary,
  isSingle,
  calcLength,
  getStatus,
  getFld,
  setFld,
};
