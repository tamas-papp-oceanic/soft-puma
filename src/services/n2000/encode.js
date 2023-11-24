const log = require('electron-log');
const com = require('./common.js');
const con = require('../convert.js');

let fastbuff = {};

function pack(frm) {
  let pgn = com.getPgn(frm.id);
  if (com.isSingle(pgn)) {
    return [frm];
  } else {
    return encodeFastPacket(frm);
  }
};

// Convert message to can frame
function encode(msg) {
  if ((typeof msg.header === 'undefined') || (typeof msg.fields === 'undefined')) {
    return null;
  }
  let spl = msg.key.split('/');
  let def = com.getDef(spl.splice(0, spl.length - 2).join('/'));
  if (def == null) {
    return null;
  }
  def = extend(def, msg);
  if (msg.header.pgn == 126208) {
    def = proc126208(def, msg);
  }
  if (def == null) {
    return null;
  }
  msg.header.pri = def.priority;
  let ptr = 0;
  for (let i in def.fields) {
    let fld = def.fields[i];
    let mfl = com.getFld(fld.field, msg.fields);
    let len = null;
    if (fld['type'] !== null) {
      if ((fld['type'] == 'chr(x)') || (fld['type'] == 'str')) {
        len = com.calcLength(fld['type'], mfl != null ? mfl.value.length : 0);
      } else if (fld['type'].startsWith('chr(') && (typeof mfl.value.type !== 'undefined') &&
        (mfl.value.type == 'Buffer')) {
        len = com.calcLength(fld['type'], mfl != null ? mfl.value.data.length : 0);
      } else {
        len = com.calcLength(fld['type']);
      }
    }
    if (len != null) {
      ptr += len;
    }
  }
  let raw = Buffer.alloc(Math.ceil(ptr / 8));
  ptr = 0;
  for (let i in def.fields) {
    let fld = def.fields[i];
    let mfl = com.getFld(fld.field, msg.fields);
    if (mfl == null) {
      return null;
    }
    let byt = Math.floor(ptr / 8);
    let len = null;
    if (fld['type'] !== null) {
      if ((fld['type'] == 'chr(x)') || (fld['type'] == 'str')) {
        len = com.calcLength(fld['type'], mfl != null ? mfl.value.length : 0);
      } else if (fld['type'].startsWith('chr(') && (typeof mfl.value.type !== 'undefined') && (mfl.value.type == 'Buffer'))  {
        len = com.calcLength(fld['type'], mfl != null ? mfl.value.data.length : 0);
      } else {
        len = com.calcLength(fld['type']);
      }
    }
    if ((len != null) && (len > 0)) {
      mfl.value = con.encode(fld, mfl.value);
      if (fld['type'].startsWith('bit(')) {
        let cnt = Math.ceil(len / 8);
        let buf = Buffer.alloc(8);
        raw.copy(buf, 0, byt, byt + cnt);
        let dat = buf.readBigUInt64LE(0);
        let msk = (BigInt(1) << BigInt(len)) - BigInt(1);
        let off = BigInt(ptr) - BigInt(byt * 8);
        dat |= ((BigInt(mfl.value) & msk) << off);
        buf.writeBigUInt64LE(dat);
        buf.copy(raw, byt);
      } else {
        if ((ptr % 8) !== 0) {
          ptr += (8 - (ptr % 8));
          byt = Math.floor(ptr / 8);
        }
      }
      if (fld['type'] == 'chr(x)') {
        raw.writeUInt8(Math.ceil((len - 1) / 8), byt,);
        if (len > 8) {
          raw.write(mfl.value, byt + 1, 'utf8');
        }
      } else if (fld['type'].startsWith('chr(')) {
        if (typeof mfl.value === 'string') {
          raw.write(mfl.value.padEnd(Math.ceil(len / 8), ' '), byt, 'utf8');
        } else if ((typeof mfl.value.type !== 'undefined') && (mfl.value.type == 'Buffer')) {
          let buf = Buffer.from(mfl.value.data);
          buf.copy(raw, byt);
        }
      } else if (fld['type'] == 'str') {
        raw.writeUInt8(Math.ceil((len - 2) / 8), byt);
        raw.writeUInt8(0, byt + 1);
        if (len > 16) {
          raw.write(mfl.value, byt + 2, 'utf8');
        }
      } else if (!fld['type'].startsWith('bit(')) {
        try {
          switch (fld['type']) {
            case "int8":
              raw.writeInt8(Math.round(mfl.value), byt);
              break;
            case "uint8":
              raw.writeUInt8(Math.round(mfl.value), byt);
              break;
            case "int16":
              raw.writeInt16LE(Math.round(mfl.value), byt);
              break;
            case "uint16":
              raw.writeUInt16LE(Math.round(mfl.value), byt);
              break;
            case "int24":
              raw.writeIntLE(Math.round(mfl.value), byt, 3);
              break;
            case "uint24":
              raw.writeUIntLE(Math.round(mfl.value), byt, 3);
              break;
            case "int32":
              raw.writeInt32LE(Math.round(mfl.value), byt);
              break;
            case "uint32":
              raw.writeUInt32LE(Math.round(mfl.value), byt);
              break;
            case "float32":
              raw.writeFloatLE(mfl.value, byt);
              break;
            case "int48":
              raw.writeIntLE(Math.round(mfl.value), byt, 6);
              break;
            case "uint48":
              raw.writeUIntLE(Math.round(mfl.value), byt, 6);
              break;
            case "int64":
              raw.writeBigInt64LE(BigInt(Math.round(mfl.value)), byt);
              break;
            case "uint64":
              raw.writeBigUInt64LE(BigInt(Math.round(mfl.value)), byt);
              break;
            case "float64":
              raw.writeDoubleLE(mfl.value, byt);
              break;
          }
        } catch (err) {
          log.error("Encode error:", msg.header.pgn, mfl.field, mfl.value);
          return null;
        }
      }
      ptr += len;
    }
  }
  let dlc = Math.ceil(ptr / 8);
  let frm = {
    id: com.makePgn(msg.header),
    ext: true,
    rtr: false,
    data: Buffer.alloc(dlc),
  };
  raw.copy(frm.data, 0, 0, dlc);
  return frm;
};

function encodeFastPacket(fap) {
  try {
    if (fap.data.length == 0) {
      return null;
    }
    let ret = new Array();
    let seq = -1;
    let frm = 0;
    let cnt = 0;
    let key = fap.id.toString(16).padStart(8, '0');
    if (typeof fastbuff[key] !== 'undefined') {
      seq = fastbuff[key];
    }
    seq++
    seq &= 0b111;
    fastbuff[key] = seq;
    let dat = Buffer.alloc(8).fill(0xFF);
    for (let i = 0; i < fap.data.length; i++) {
      if ((cnt % 8) == 0) {
        dat.writeUInt8((seq << 5) + frm, (cnt % 8));
        if (cnt == 0) {
          cnt++
          dat.writeUInt8(fap.data.length, (cnt % 8));
        }
        frm++
        cnt++
      }
      dat.writeUInt8(fap.data[i], (cnt % 8));
      cnt++
      if ((cnt % 8) == 0) {
        let rec = {
          id: fap.id,
          ext: fap.ext,
          rtr: fap.rtr,
          data: Buffer.alloc(8),
        };
        dat.copy(rec.data);
        ret.push(rec);
        dat.fill(0xFF);
      }
    }
    if ((cnt % 8) != 0) {
      let rec = {
        id: fap.id,
        ext: fap.ext,
        rtr: fap.rtr,
        data: Buffer.alloc(8),
      };
      dat.copy(rec.data);
      ret.push(rec);
    }
    return ret;
  } catch (err) {
    log.error("ERROR", err);
    return null;
  }
};

function extend(def, msg) {
  try {
    if (msg.header.pgn == 126464) {
      let tmp = new Array();
      tmp.push(com.getFld(1, def.fields));
      let fld = com.getFld(2, def.fields);
      for (let i = 0; i < msg.fields.length; i++) {
        if (msg.fields[i].field > 1) {
          fld.field = parseInt(i) + 1;
          fld.title = 'PGN supported (' + parseInt(i) + ')';
          tmp.push(JSON.parse(JSON.stringify(fld)));
        }
      }
      delete def.fields;
      def.fields = tmp;
    } else if (def.hasOwnProperty("repeat")) {
      let flc = null;
      for (let i in def.repeat) {
        let rep = def.repeat[i];
        for (let j in def.fields) {
          let fld = JSON.parse(JSON.stringify(def.fields[j]));
          if ((rep.hasOwnProperty("startField") && (fld.field < rep.startField)) ||
            (rep.hasOwnProperty("binaryField") && (fld.field < rep.binaryField))
          ) {
            if (fld.field > flc) {
              flc = fld.field;
            }
          } else {
            let mfl = com.getFld(fld.field, msg.fields);
            if (rep.hasOwnProperty("startField") && rep.hasOwnProperty("fieldCount")) {
              def.repeat[i].value = mfl != null ? mfl.value : 0;
              flc = fld.field;
              break;
            } else if (rep.hasOwnProperty("binaryField")) {
              def.repeat[i].bitSize = mfl != null ? mfl.value : 0;
              flc = fld.field;
              break;
            }
          }
        }
      }
      let tmp = new Array();
      for (let i in def.fields) {
        let fld = def.fields[i];
        if (fld.field < flc) {
          tmp.push(fld);
        }
      }
      for (let i in def.repeat) {
        let rep = def.repeat[i];
        if (rep.hasOwnProperty("startField") && rep.hasOwnProperty("fieldCount")) {
          if ((rep.value > 0) && (rep.value <= 252)) {
            for (let j = 0; j < rep.value; j++) {
              for (let k in def.fields) {
                let fld = JSON.parse(JSON.stringify(def.fields[k]));
                if ((fld.field >= rep.startField) && (fld.field < (rep.startField + rep.fieldCount))) {
                  fld.field = ++flc;
                  tmp.push(fld);
                }
              }
            }
          }
        } else if (rep.hasOwnProperty("binaryField")) {
          if ((rep.value > 0) && (rep.value <= 252)) {
            for (let k in def.fields) {
              let fld = JSON.parse(JSON.stringify(def.fields[k]));
              if (fld.field === rep.binaryField) {
                fld.bitSize = rep.bitSize;
                tmp.push(fld);
                break;
              }
            }
          }
        }
      }
      delete def.fields;
      def.fields = tmp;
    }
    return JSON.parse(JSON.stringify(def));
  } catch (err) {
    log.error("ERROR", err);
    return null;
  }
};

function proc126208(def, msg) {
  try {
    fld = com.getFld(2, msg.fields);
    if (fld == null) {
      return null;
    }
    let pgn = fld.value;
    for (let i in def.repeat) {
      let rep = def.repeat[i];
      let cnt = rep.value;
      if (cnt > 0) {
        let fun = null;
        let key = "nmea2000/" + pgn.toString().padStart(6, "0");
        let cnv = com.findCnv(key);
        if ((typeof cnv !== "undefined") && cnv.hasOwnProperty("function")) {
          fun = cnv.function
        }
        if (fun != null) {
          key += '/' + fun;
        } else {
          key += '/-';
        }
        key += '/-/-';
        let de2 = com.getDef(key);
        if (de2 == null) {
          return null;
        }
        // Definitions with repeat field(s) aren't supported
        if ((pgn != 126464) || (typeof de2.repeat !== 'undefined')) {
          return null;
        }
        // Template fields          
        let tpl = com.getFld(rep.startField, def.fields);
        if (tpl != null) {
          // Looping through the parameters
          for (let j = 0; j < cnt; j++) {
            // Get field number
            let fln = msg.fields[j].field;
            // Get requested field
            let fld = com.getFld(fln, de2.fields);
            if (fld != null) {
              let flt = JSON.parse(JSON.stringify(tpl));
              flt.field = rep.startField + j;
              flt.title = 'Result (' + fln + ')';
              flt.type = 'bit(4)';
              def.fields.push(flt);
            }
          }
        }
      }
    }
    return JSON.parse(JSON.stringify(def));
  } catch (err) {
    log.error("ERROR", err);
    return null;
  }
};

module.exports = {
  pack,
  encode,
};
