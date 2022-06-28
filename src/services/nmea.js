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
const { FileUploaderSkeleton } = require('carbon-components-svelte');

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
    switch (fld.type) {
      case "int8":
        val = frm.data.readInt8(pnt);
        pnt += 1;
        break;
      case "uint8":
        val = frm.data.readUInt8(pnt);
        pnt += 1;
        break;
      case "int16":
        val = frm.data.readInt16LE(pnt);
        pnt += 2;
        break;
      case "uint16":
        val = frm.data.readUInt16LE(pnt);
        pnt += 2;
        break;
      case "int24":
        {
          let buf = Buffer.alloc(4);
          buf[0] = frm.data[pnt + 0];
          buf[1] = frm.data[pnt + 1];
          if ((frm.data[pnt + 2] >> 7) == 0) {
            buf[2] = 0;
          } else {
            buf[2] = 0xFF;
          }
          buf[3] = frm.data[pnt + 2];
          val = buf.readInt32LE(0);
          pnt += 3;
        }
        break;
      case "uint16":
        {
          let buf = Buffer.alloc(4);
          buf[0] = frm.data[pnt + 0];
          buf[1] = frm.data[pnt + 1];
          buf[2] = 0;
          buf[3] = frm.data[pnt + 2];
          val = buf.readUInt32LE(0);
          pnt += 3;
        }
        break;
      case "int32":
        val = frm.data.readInt32LE(pnt);
        pnt += 4;
        break;
      case "uint32":
        val = frm.data.readUInt32LE(pnt);
        pnt += 4;
        break;
      case "int48":
        {
          let buf = Buffer.alloc(6);
          buf[0] = frm.data[pnt + 0];
          buf[1] = frm.data[pnt + 1];
          buf[2] = frm.data[pnt + 2];
          buf[3] = frm.data[pnt + 3];
          if ((frm.data[pnt + 4] >> 7) == 0) {
            buf[4] = 0;
          } else {
            buf[4] = 0xFF;
          }
          buf[5] = frm.data[pnt + 4];
          val = buf.readInt64LE(0);
          pnt += 6;
        }
        break;
      case "uint48":
        {
          let buf = Buffer.alloc(6);
          buf[0] = frm.data[pnt + 0];
          buf[1] = frm.data[pnt + 1];
          buf[2] = frm.data[pnt + 2];
          buf[3] = frm.data[pnt + 3];
          buf[4] = 0;
          buf[5] = frm.data[pnt + 4];
          val = buf.readUInt64LE(0);
          pnt += 6;
        }
        break;
      case "int64":
        val = frm.data.readInt64LE(pnt);
        pnt += 8;
        break;
      case "uint64":
        val = frm.data.readUInt64LE(pnt);
        pnt += 8;
        break;
    }
    fld.value = val;
    msg.fields.push(fld);
  }
  return msg;

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
function process(frm) {
  let tmp = unpack(frm);
  if (tmp != null) {
    let msg = decode(tmp);

console.log(msg)

  }
}

module.exports = {
  init,
  process,
};
