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
  if (msg.header.pgn == 126208) {
    def = proc126208(def, msg);
  } else {
    def = extend(def, msg);
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

    if (msg.header.pgn == 126208) {
      console.log(mfl)
    }
    
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
}

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
    } else if (typeof def.repeat !== 'undefined') {
      let max = null;
      for (let i in def.repeat) {
        let rep = def.repeat[i];
        for (let j in def.fields) {
          let fld = def.fields[j];
          let len = 0;
          if (fld.field < rep.repeatField) {
            if (fld.field > max) {
              max = fld.field;
            }
          } else {
            let mfl = com.getFld(fld.field, msg.fields);
            def.repeat[i].value = mfl != null ? mfl.value : 0;
            max = fld.field;
            break;
          }
        }
      }
      let tmp = new Array();
      for (let i in def.fields) {
        let fld = def.fields[i];
        if (fld.field <= max) {
          tmp.push(fld);
        }
      }
      for (let i in def.repeat) {
        let rep = def.repeat[i];
        if (rep.hasOwnProperty("startField") && rep.hasOwnProperty("fieldCount")) {
          if ((rep.value > 0) && (rep.value <= 252)) {
            for (let j = 0; j < rep.value; j++) {
              for (let k in def.fields) {
                let fld = def.fields[k];
                if ((fld.field >= rep.startField) && (fld.field < (rep.startField + rep.fieldCount))) {
                  fld.field = ++max;
                  tmp.push(fld);
                }
              }
            }
          }
        } else if (rep.hasOwnProperty("binaryField")) {
          if ((rep.value > 0) && (rep.value <= 252)) {
            for (let k in def.fields) {
              let fld = def.fields[k];
              if (fld.field === rep.binaryField) {
                def.fields[k].bitSize = rep.value;
                tmp.push(def.fields[k]);
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

}

const fun126208 = {
  0: { title: 'Request', repeat: 5, field: 6 },
  1: { title: 'Command', repeat: 5, field: 6 },
  2: { title: 'Acknowledge', repeat: 5, field: 6 },
  3: { title: 'Read Fields', repeat: 8, field: 9 },
  4: { title: 'Read Fields Reply', repeat: 9, field: 10 },
  5: { title: 'Write Fields', repeat: 8, field: 9 },
  6: { title: 'Write Fields Reply', repeat: 9, field: 10 },
}

function proc126208(def, msg) {
  try {

console.log(def.repeat)

    delete def.repeat;
    let fld = com.getFld(1, msg.fields);
    if (fld == null) {
      return null;
    }
    let fun = fun126208[fld.value];
    if (typeof fun === 'undefined') {
      return null;
    }
    let rep = fun.repeat;
    let fst = fun.field;
    fld = com.getFld(2, msg.fields);
    if (fld == null) {
      return null;
    }
    let pg2 = fld.value;
    fld = com.getFld(rep, msg.fields);
    if (fld == null) {
      return null;
    }
    let cnt = fld.value;
    if ((cnt != null) && (cnt != 0xFF)) {
      let qry = { id: (pg2 << 8) };
      let fu2 = null;
      let key = 'nmea2000/' + pg2.toString().padStart(6, '0');
      let cnv = com.findCnv(key);
      if ((typeof cnv !== 'undefined') && (typeof cnv.function !== 'undefined')) {
        fu2 = cnv.function
      }
      if (fu2 != null) {
        key += '/' + fu2;
      } else {
        key += '/-';
      }
      key += '/-/-';
      let de2 = com.getDef(key);
      if (de2 == null) {
        return null;
      }
      // Definitions with repeat field(s) aren't supported
      if ((pg2 != 126464) && (typeof de2.repeat !== 'undefined')) {
          return null;
      }
      // Template fields          
      let tpl = com.getFld(fst, def.fields);
      if (tpl != null) {
        let tmp = new Array();
        for (let i = 0; i < def.fields.length; i++) {
          if (def.fields[i].field < fst) {
            tmp.push(JSON.parse(JSON.stringify(def.fields[i])));
          }
        }
        delete def.fields;
        def.fields = tmp;
        // Looping through the parameters
        for (let i = 0; i < cnt; i++) {
          // Get field number
          let fln = msg.fields[i].field;
          // Get requested field
          let fld = com.getFld(fln, de2.fields);
          if (fld != null) {
            let flt = JSON.parse(JSON.stringify(tpl));
            flt.field = fst + i;
            flt.title = 'Result (' + fln + ')';
            flt.type = 'bit(4)';
            def.fields.push(flt);
          }
        }
      }
    }
    return JSON.parse(JSON.stringify(def));
  } catch (err) {
    log.error("ERROR", err);
    return null;
  }
}

module.exports = {
  pack,
  encode,
};
