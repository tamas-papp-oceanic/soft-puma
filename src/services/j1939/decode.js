const cry = require('crypto');
const log = require('electron-log');
const com = require('./common.js');

let datrbuff = {};

function unpack(frm) {
  if (frm.data.length > 0) {
    let pgn = com.getPgn(frm.id);
    switch (pgn) {
      case 60160:
        return decodeDataTransfer(frm);
      case 60416:
        return controlDataTransfer(frm);
      default:
        return frm;
    }
  } else {
    return null;
  }
};

// Convert can frame to message
function decode(frm) {
  try {
    let pgn = com.getPgn(frm.id);
    let def = com.findDef(frm);
    if (def == null) {
      return null;
    }
    let msg = null;
    let raw = Buffer.alloc(4 + frm.data.length);
    let did = Buffer.from(frm.id.toString(16).padStart(8, '0'), "hex");
    did.copy(raw);
    frm.data.copy(raw, 4);
    let ins = com.getSrc(frm.id);
    msg = {
      key: def.key,
      id: cry.randomBytes(16).toString('hex'),
      header: {
        pgn: pgn,
        pri: com.getPri(frm.id),
        src: ins,
        dst: com.getDst(frm.id),
        tim: ((frm.ts_sec * 1000000) + frm.ts_usec) / 1000000,
      },
      title: def.title,
      fields: new Array(),
      raw: raw,
    }
    let ptr = 0;
    let val = null;
    for (let i in def.fields) {
      let fld = def.fields[i];
      let byt = Math.floor(ptr / 8);
      let len = null;
      if (fld.type !== null) {
        len = com.calcLength(fld.type);
      }
      if ((len != null) && (len > 0) && (frm.data.length >= (byt + Math.ceil(len / 8)))) {
        fld.state = 'V';
        if (fld.type.startsWith('bit(')) {
          let cnt = Math.ceil(len / 8);
          let buf = Buffer.alloc(8);
          frm.data.copy(buf, 0, byt, byt + cnt);
          let dat = buf.readBigUInt64LE(0);
          let msk = (BigInt(1) << BigInt(len)) - BigInt(1);
          let off = BigInt(ptr) - BigInt(byt * 8);
          val = parseInt(((dat >> off) & msk).toString());
          if (len === 2) {
            if (val === 2) {
              fld.state = 'E';
            } else if (val === 3) {
              fld.state = '-';
            }
          }
          ptr += len;
        } else {  
          switch (fld.type) {
            case "int8":
              val = frm.data.readInt8(byt);
              break;
            case "uint8":
              val = frm.data.readUInt8(byt);
              break;
            case "int16":
              val = frm.data.readInt16LE(byt);
              break;
            case "uint16":
              val = frm.data.readUInt16LE(byt);
              break;
            case "int24":
              val = frm.data.readIntLE(byt, 3);
              break;
            case "uint24":
              val = frm.data.readUIntLE(byt, 3);
              break;
            case "int32":
              val = frm.data.readInt32LE(byt);
              break;
            case "uint32":
              val = frm.data.readUInt32LE(byt);
              break;
            case "int48":
              val = frm.data.readIntLE(byt, 6);
              break;
            case "uint48":
              val = frm.data.readUIntLE(byt, 6);
              break;
            case "int64":
              val = frm.data.readBigInt64LE(byt);
              break;
            case "uint64":
              val = frm.data.readBigUInt64LE(byt);
              break;
          }
          fld.state = com.getStatus(fld.type, val);
          if ((fld.state == 'V') && (fld.multiplier != null)) {
            if (typeof val == 'bigint') {
              if (fld.multiplier >= 1) {
                val *= BigInt(fld.multiplier);
              } else {
                val /= BigInt(1 / fld.multiplier);
              }
              val = Number(val);
            } else {
              val *= fld.multiplier;
            }
            val = Math.round(val * 100000) / 100000;
          }
          ptr += len;
        }
        fld.value = val;
        delete fld.multiplier;
        msg.fields.push(fld);
      }
    }
    msg.header.ins = ins;
    msg.key += "/" + ins;
    return msg;
  } catch (err) {
    log.error("ERROR", err);
    return null;
  }
};

// Controls data transfer
function controlDataTransfer(frm) {
  try {  
    if (frm.raw.length < 8) {
      return null;
    }
    let fun = frm.data.readUInt8(0);
    switch (fun) {
      case 0x10:
      case 0x20:
        let key = com.getSrc(frm);
        if (typeof datrbuff[key] === 'undefined') {
          let len = frm.data.readUInt16LE(1);
          let frs = frm.data.readUInt8(3);
          tra = {
            length: len,
            frames: frs,
            pgn: frm.data.readUIntLE(5, 3),
            sequence: 0,
            start: Date.now(),
            timeout: frs * 200,
            finished: false,
            corrupted: false,
          };
          if ((len >= 9) && (len <= 1785)) {
            tra.data = Buffer.alloc(len);
          }
        }
        break;
    }
    return null;
  } catch (err) {
    log.error("ERROR", err);
    return null;
  }
}

// Decodes data transfer messages
function decodeDataTransfer(frm) {
  try {
    let key = com.getSrc(frm);
    let tra = datrbuff[key];
    if (typeof tra !== 'undefined') {
      if (frm.raw.length < 8) {
        tra.corrupted = true;
      }
      if (!tra.corupted) {
        let seq = frm.data.readUInt8(0);
        if (seq != (tra.sequence + 1)) {
          tra.corrupted = true;
        }
      }
      if (!tra.corupted) {
        tra.sequence = seq;
      }
      if (!tra.corrupted && ((Date.now() - tra.start) > tra.timeout)) {
        tra.corrupted = true;
      }
      if (!tra.corupted) {
        frm.data.copy(tra.data, seq * 7, 1);
        tra.finished = tra.sequence >= tra.frames;
      }
      if (!tra.finished && !tra.corrupted) {
        datrbuff[key] = tra;
      } else {
        delete datrbuff[key];
      }
      if (!tra.corrupted) {
        if (tra.finished) {
          delete frm.data;
          frm.data = Buffer.alloc(tra.length);
          tra.data.copy(frm.data);
          return frm;
        }
      }
    }
    return null;
  } catch (err) {
    log.error("ERROR", err);
    return null;
  }
}

module.exports = {
  unpack,
  decode,
};
