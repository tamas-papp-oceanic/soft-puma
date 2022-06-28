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
let nmeacurr = {};

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

function getPgn(frm) {
  let pgn = (frm.id & 0x1FFFF00) >> 8;
	if (((pgn >> 8) & 0xFF) < 0xF0)
	{
		pgn &= 0x1FF00;
	}
  return pgn.toString().padStart(6, '0');
}

function isSingle(frm) {
  let pgn = getPgn(frm);
  if ((pgn == "061184") || ((pgn >= "065280") && (pgn <= "065535"))) {
    return true;      
  } else if ((pgn.pgn == "126720") || ((pgn.pgn >= "130816") && (pgn.pgn <= "131071"))) {
    return false;
  }
  for (const [key, val] of Object.entries(nmeadefs)) {
    let tmp = "nmea2000/" + pgn;
    if (key.startsWith(tmp)) {
      return val.single;
    }
  }
  return true;
}

function findPgn(frm) {
  let pgn = getPgn(frm);
  let key = "nmea2000/" + pgn;
  let cnv = nmeaconv[key];
  if (typeof cnv !== "undefined") {
    if (typeof cnv.function !== "undefined") {
      key += "/" + frm.data[cnv.function];
    } else {
      key += "/-";
    }
    if ((pgn == "061184") || ((pgn >= "065280") && (pgn <= "065535")) || 
      (pgn == "126720") || ((pgn >= "130816") && (pgn <= "131071"))) {
      let val = (parseInt(frm.data[1]) * 256) + parseInt(frm.data[0])
      key += "/" + (val & 0x7FF) + "/" + ((val >> 13) & 7);
    } else {
      key += "/-/-";
    }
  } else {
    key += "/-/-/-";
  }
  let out = nmeadefs[key];
  if (typeof out !== "undefined") {
    out.key = key;
  }
  return out;
}


function unpack(frm) {
  key = frm.id.toString(16).padStart(8, '0');
  if (isSingle(frm)) {    
    return frm;
  } else {
    let fap = {};
    let seq = parseInt(frm.data[0]) >> 5;
    let cnt = parseInt(frm.data[0]) & 0x1F;
    let min = 0;
    if (typeof fastbuff[key] === "undefined") {
      let len = parseInt(frm.data[1]);
      fap = {
        sequence: seq,
        counter: cnt,
        length: len,
        index: 0,
        start: Date.now(),
        timeout: 750,
        finished: false,
        corrupted: cnt != 0,
        data: Buffer.alloc(len),
      };
      if (!fap.corrupted) {
        min = Math.min(6, len);
        let dat = Buffer.alloc(min);
        for (let i = 0; i < min; i++) {
          dat[i] = frm.data[i + 2];
        }
        dat.copy(fap.data);
      }
    } else {
      fap = fastbuff[key];
      min = Math.min(7, (fap.length - fap.index));
      if (!fap.corrupted &&  (seq != fap.sequence)) {
        fap.corrupted = true;
      }
      if (!fap.corrupted) {
        if (cnt != (fap.counter + 1)) {
          fap.corrupted = true;
        } else {
          fap.counter = cnt;
        }
      }
      if (!fap.corrupted && ((Date.now() - fap.start) > fap.timeout)) {
        fap.corrupted = true;
      }
      if (!fap.corrupted) {
        let dat = Buffer.alloc(min);
        for (let i = 0; i < min; i++) {
          dat[i] = frm.data[i + 1];
        }
        dat.copy(fap.data, fap.index);
      }
    }
    if (!fap.corrupted) {
      fap.index += min;
      fap.finished = (fap.index >= fap.length);
    }
    if (!fap.finished && !fap.corrupted) {
      fastbuff[key] = fap;
    } else {
      delete fastbuff[key];
    }
    if (!fap.corrupted) {
      if (fap.finished) {
        delete frm.data;
        frm.data = Buffer.alloc(fap.length);
        fap.data.copy(frm.data);
        return frm;
      }
    }
  }
  return null;
}

// Returns with field status
function setStatus(val, typ) {
  let sts = 'valid';
  if (typ.startsWith('int')) {
    let bit = parseInt(typ.replace('int', ''));
    if (bit < 64) {
      if (val == (2 ** (bit - 1)) - 1) {
        sts = 'nodata';
      } else if (val == (2 ** (bit - 1)) - 2) {
        sts = 'error';
      }
    } else {
      if (BigInt(val) == (2n ** (bit - 1)) - 1) {
        sts = 'nodata';
      } else if (BigInt(val) == (2n ** (bit - 1)) - 2) {
        sts = 'error';
      }
    }
  } else if (typ.startsWith('uint')) {
    let bit = parseInt(typ.replace('uint', ''));
    if (bit < 64) {
      if (val == (2 ** bit) - 1) {
        sts = 'nodata';
      } else if (val == (2 ** bit) - 2) {
        sts = 'error';
      }
    } else {
      if (BigInt(val) == (2n ** bit) - 1) {
        sts = 'nodata';
      } else if (BigInt(val) == (2n ** bit) - 2) {
        sts = 'error';
      }
    }
  }
  return sts;
}

// Convert can frame to message
function decode(frm) {
  let def = findPgn(frm);
  let msg = {
    key: def.key,
    title: def.title,
    single: def.single,
    priority: def.priority,
    interval: def.interval,
    fields: new Array(),
  }
  let pnt = 0;
  let val = null;
  for (let i in def.fields) {
    let fld = def.fields[i];
    fld.state = 'valid';
    let byt = Math.floor(pnt / 8);
    if (fld.type.startsWith('bit(')) {
      let len = parseInt(fld.type.replace('bit(', '').replace(')', ''));
      let cnt = Math.ceil(len / 8);
      let buf = Buffer.alloc(8);
      frm.data.copy(buf, 0, byt, byt + cnt);
      let dat = buf.readBigUInt64LE(0);
      let msk = BigInt((1 << len) - 1)
      let off = BigInt(pnt - (byt * 8));
      val = parseInt(((dat >> off) & msk).toString());
      pnt += len;
    } else if (fld.type.startsWith('chr(')) {
      let len = parseInt(fld.type.replace('chr(', '').replace(')', ''));
      if (len > 0) {
        let buf = Buffer.alloc(len);
        frm.data.copy(buf, 0, byt);
        val = buf.toString('utf8');
        pnt += (len * 8);
      }
    } else if (fld.type == 'str') {
      let len = frm.data.readUInt8(byt);
      let asc = frm.data.readUInt8(byt + 1);
      if (len > 2) {
        let buf = Buffer.alloc(len);
        frm.data.copy(buf, 0, byt);
        val = buf.toString(asc == 0 ? 'utf8' : 'utf16');
      }
      pnt += (len * 8);
    } else {
      switch (fld.type) {
        case "int8":
          val = frm.data.readInt8(byt);
          pnt += 8;
          break;
        case "uint8":
          val = frm.data.readUInt8(byt);
          pnt += 8;
          break;
        case "int16":
          val = frm.data.readInt16LE(byt);
          pnt += 16;
          break;
        case "uint16":
          val = frm.data.readUInt16LE(byt);
          pnt += 16;
          break;
        case "int24":
          val = frm.data.readIntLE(byt, 3);
          pnt += 24;
          break;
        case "uint24":
          val = frm.data.readUIntLE(byt, 3);
          pnt += 24;
          break;
        case "int32":
          val = frm.data.readInt32LE(byt);
          pnt += 32;
          break;
        case "uint32":
          val = frm.data.readUInt32LE(byt);
          pnt += 32;
          break;
        case "float32":
          val = frm.data.readFloatLE(byt);
          pnt += 32;
          break;
        case "int48":
          val = frm.data.readIntLE(byt, 6);
          pnt += 48;
          break;
        case "uint48":
          val = frm.data.readUIntLE(byt, 6);
          pnt += 48;
          break;
        case "int64":
          val = frm.data.readBigInt64LE(byt);
          pnt += 64;
          break;
        case "uint64":
          val = frm.data.readBigUInt64LE(byt);
          pnt += 64;
          break;
        case "float64":
          val = frm.data.readDoubleLE(byt);
          pnt += 64;
          break;
      }
      fld.state = setStatus(val, fld.type);
      if (fld.multiplier != null) {
        val *= fld.multiplier;
      }
    }
    fld.value = val;
    delete fld.multiplier;
    msg.fields.push(fld);
  }
  return msg;
}

// NMEA data processing function
function process(frm) {
  let tmp = unpack(frm);
  if (tmp != null) {
    let msg = decode(tmp);
    return msg;
  }
  return null;
}

module.exports = {
  init,
  process,
};
