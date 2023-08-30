/* J1939 messages

    key = j1939/{pgn}

    Proprietary messages
      061184          - addressable
      065280 - 065535 - global
      126720          - addressable
 */ 
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

let j1939defs = {};

function init() {
  let jde = path.join(app.getAppPath(), 'src/config/j1939defs.json');
  try {
    if (fs.existsSync(jde)) {
      j1939defs = JSON.parse(fs.readFileSync(jde, 'utf8'));
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

// Returns with PGN definition
function findDef(frm) {
  let key = getKey(frm);
  if (typeof j1939defs[key] !== 'undefined') {
    let out = JSON.parse(JSON.stringify(j1939defs[key]));
    out.key = key;
    return out;
  }    
  return null;
};

// Returns with PGN key
function getKey(frm) {
  let pgn = getPgn(frm.id);
  let key = "j1939/" + pgn.toString().padStart(6, '0');
  return key;
};

// Returns with PGN definition
function getDef(key) {
  if (typeof j1939defs[key] !== 'undefined') {
    return JSON.parse(JSON.stringify(j1939defs[key]));
  }
  return null;
};

// Returns true if proprietary
function isProprietary(pgn) {
  if ((pgn == 61184) || ((pgn >= 65280) && (pgn <= 65535)) || 
    (pgn == 126720)) {
    return true;
  }
  return false;
}

function isSingle(pgn) {
  for (const [key, val] of Object.entries(j1939defs)) {
    if (key.startsWith('j1939/' + pgn)) {
      return val.single;
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
  if (typ == null) {
    sts = 'E';
  } else if (typ.startsWith('uint')) {
    let bit = parseInt(typ.replace('uint', ''));
    if (BigInt(val) == (2n ** BigInt(bit)) - 1n) {
      sts = '-';
    } else if (BigInt(val) == (2n ** BigInt(bit)) - 2n) {
      sts = 'E';
    } else if ((BigInt(val) == (2n ** BigInt(bit)) - 3n) ||
      (BigInt(val) == (2n ** BigInt(bit)) - 4n)) {
      sts = 'F';
    } else if (BigInt(val) == (2n ** BigInt(bit)) - 5n) {
      sts = 'P';
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
