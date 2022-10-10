const cry = require('crypto');
const log = require('electron-log');
const com = require('./common.js');

let fastbuff = {};
let datrbuff = {};

function unpack(frm) {
  if (frm.data.length > 0) {
    let pgn = com.getPgn(frm.id);
    if (com.isSingle(pgn)) {
      switch (pgn) {
        case 60160:
          return decodeDataTransfer(frm);
        case 60416:
          return controlDataTransfer(frm);
        default:
          return frm;
      }
    } else {
      return decodeFastPacket(frm);
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
    if (pgn == 126208) {
      def = proc126208(def, frm);
    } else {
      def = extend(pgn, def, frm);
    }
    if (def == null) {
      return null;
    }
    let msg = null;
    let raw = Buffer.alloc(4 + frm.data.length);
    let did = Buffer.from(frm.id.toString(16).padStart(8, '0'), "hex");
    did.copy(raw);
    frm.data.copy(raw, 4);
    msg = {
      key: def.key,
      id: cry.randomBytes(16).toString('hex'),
      header: {
        pgn: pgn,
        pri: com.getPri(frm.id),
        src: com.getSrc(frm.id),
        dst: com.getDst(frm.id),
        tim: ((frm.ts_sec * 1000000) + frm.ts_usec) / 1000000,
      },
      title: def.title,
      fields: new Array(),
      raw: raw,
    }
    let ins = null;
    let typ = null;
    let ptr = 0;
    let val = null;
    for (let i in def.fields) {
      let fld = def.fields[i];
      let byt = Math.floor(ptr / 8);
      let len = null;
      if ((fld.type == 'chr(x)') || (fld.type == 'str')) {
        len = com.calcLength(fld.type, frm.data.readUInt8(byt));
      } else {
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
          if (fld.reserved != null) {
            switch (fld.reserved) {
              case 'DD001':
              case 'DD003':
                fld.state = '-';
                break;
              case 'DD002':
                if (val == 2) {
                  fld.state = 'E';
                } else if (val == 3) {
                  fld.state = '-';
                }
                break;
            }
          }
          ptr += len;
        } else if (fld.type == 'chr(x)') {
          if (len > 8) {
            let buf = Buffer.alloc(Math.ceil((len - 1) / 8));
            frm.data.copy(buf, 0, byt + 1);
            val = buf.toString('utf8').replace(/[^\x01-\x7F]/g, "");
          }
          ptr += len;
        } else if (fld.type.startsWith('chr(')) {
          let buf = Buffer.alloc(Math.ceil(len / 8));
          frm.data.copy(buf, 0, byt);
          val = buf.toString('utf8');
          ptr += len;
        } else if (fld.type == 'str') {
          let asc = frm.data.readUInt8(byt + 1);
          if (len > 16) {
            let buf = Buffer.alloc(Math.ceil((len - 2) / 8) - 2);
            frm.data.copy(buf, 0, byt + 2);
            val = buf.toString(asc == 0 ? 'utf8' : 'ucs2');
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
            case "float32":
              val = frm.data.readFloatLE(byt);
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
            case "float64":
              val = frm.data.readDoubleLE(byt);
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
        if (typeof fld.instance !== 'undefined') {
          ins = val;
          delete fld.instance;
        }
        if (msg.key.startsWith("nmea2000/127505") && (fld.field == 2)) {
          typ = val;
        }
        msg.fields.push(fld);
      }
    }
    if (ins != null) {
      msg.header.ins = ins;
      msg.key += "/" + ins;
    } else {
      msg.key += "/-";
    }
    if (typ != null) {
      msg.header.typ = typ;
      msg.key += "/" + typ;
    } else {
      msg.key += "/-";
    }
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
      if (!tra,corupted) {
        let seq = frm.data.readUInt8(0);
        if (seq != (tra.sequence + 1)) {
          tra.corrupted = true;
        }
      }
      if (!tra,corupted) {
        tra.sequence = seq;
      }
      if (!tra.corrupted && ((Date.now() - tra.start) > tra.timeout)) {
        tra.corrupted = true;
      }
      if (!tra,corupted) {
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

function decodeFastPacket(frm) {
  try {
    let fap = {};
    let seq = frm.data.readUInt8(0) >> 5;
    let cnt = frm.data.readUInt8(0) & 0x1F;
    let min = 0;
    let key = frm.id.toString(16).padStart(8, '0') + '/' + seq.toString(16).padStart(2, '0');
    if (typeof fastbuff[key] === 'undefined') {
      let len = frm.data.readUInt8(1);
      fap = {
        sequence: seq,
        counter: cnt,
        length: len,
        index: 0,
        start: Date.now(),
        timeout: 750,
        finished: false,
        corrupted: cnt != 0,
      };
      if (len > 0) {
        fap.data = Buffer.alloc(len).fill(0xFF);
      } else {
        fap.corrupted = true;
      }
      if (!fap.corrupted) {
        min = Math.min(6, len);
        let dat = Buffer.alloc(min);
        for (let i = 0; i < min; i++) {
          dat[i] = frm.data.readUInt8(i + 2);
        }
        dat.copy(fap.data);
      }
    } else {
      fap = fastbuff[key];
      min = Math.min(7, (fap.length - fap.index));
      if (!fap.corrupted && (seq != fap.sequence)) {
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
        fap.start = Date.now();
        let dat = Buffer.alloc(min);
        for (let i = 0; i < min; i++) {
          dat[i] = frm.data.readUInt8(i + 1);
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
    return null;
  } catch (err) {
    log.error("ERROR", err);
    return null;
  }
}

function extend(pgn, def, frm) {
  try {
    if (pgn == 126464) {
      let tmp = new Array();
      tmp.push(com.getFld(1, def.fields));
      let fld = com.getFld(2, def.fields)
      let cnt = Math.ceil((frm.data.length - 1) / 3);
      for (let i = 0; i < cnt; i++) {
        fld.field = i + 2;
        fld.title = 'PGN supported (' + (i + 1) + ')';
        tmp.push(JSON.parse(JSON.stringify(fld)));
      }
      delete def.fields;
      def.fields = tmp;
    } else if (typeof def.repeat !== 'undefined') {
      let max = null;
      for (let i in def.repeat) {
        let ptr = 0;
        for (let j in def.fields) {
          let fld = def.fields[j];
          let len = 0;
          if (fld.field < def.repeat[i].field) {
            if (fld.field > max) {
              max = fld.field;
            }
            if ((fld.type == 'chr(x)') || (fld.type == 'str')) {
              len = com.calcLength(fld.type, frm.data.readUInt8(Math.floor(ptr / 8)));
            } else {
              len = com.calcLength(fld.type);
            }
            if (len != null) {
              ptr += len;
            }
          } else {
            def.repeat[i].value = frm.data.readUInt8(Math.floor(ptr / 8));
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
        if ((rep.value > 0) && (rep.value <= 252)) {
          for (let j = 0; j < rep.value; j++) {
            for (let k in def.fields) {
              let fld = def.fields[k];
              if ((fld.field >= rep.start) && (fld.field < (rep.start + rep.count))) {
                fld.field = ++max;
                tmp.push(fld);
              }
            }
          }
        }
      }
      delete def.repeat;
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
  0: { title: 'Request', repeat: 10, field: 6 },
  1: { title: 'Command', repeat: 5, field: 6 },
  2: { title: 'Acknowledge', repeat: 5, field: 6 },
  3: { title: 'Read Fields', repeat: 7, field: 9 },
  4: { title: 'Read Fields Reply', repeat: 7, field: 10 },
  5: { title: 'Write Fields', repeat: 7, field: 9 },
  6: { title: 'Write Fields Reply', repeat: 7, field: 10 },
}

function proc126208(def, frm) {
  try {
    delete def.repeat;
    let pg2 = frm.data.readUIntLE(1, 3);
    let rep = null;
    let fst = null;
    let fun = fun126208[frm.data.readUInt8(0)];
    if (typeof fun === 'undefined') {
      return null;
    }
    rep = fun.repeat;
    fst = fun.field;
    if (fst == null) {
      return null;
    }
    let cnt = frm.data.readUInt8(rep);
    let ptr = (rep + 1) * 8;
    if ((cnt != null) && (cnt != 0xFF)) {
      let qry = { id: (pg2 << 8) };
      let off = 0;
      let cnv = com.findCnv('nmea2000/' + pg2.toString().padStart(6, '0'));
      if ((typeof cnv !== 'undefined') && (typeof cnv.function !== 'undefined')) {
        off = cnv.function
      }
      qry.data = Buffer.alloc(off + 1).fill(0),
      frm.data.copy(qry.data, off, 12 + (off * 2));
      let de2 = com.findDef(qry);
      if (de2 == null) {
        return null;
      }
      // Definitions with repeat field(s) aren't supported
      if ((pg2 != 126464) && (typeof de2.repeat !== 'undefined')) {
          return null;
      }
      // Template fields          
      let tp1 = com.getFld(fst, def.fields);
      let tp2 = com.getFld(fst + 1, def.fields);
      if ((tp1 != null) && (tp2 != null)) {
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
          let fln = frm.data.readUInt8(Math.ceil(ptr / 8));
          ptr += 8;
          // Get requested field
          let fld = com.getFld(fln, de2.fields);
          if (fld != null) {
            let fl1 = JSON.parse(JSON.stringify(tp1));
            fl1.field = fst + (i * 2);
            fl1.title = 'Field Number (' + fln + ')';
            let fl2 = JSON.parse(JSON.stringify(tp2));
            fl2.field = fst + (i * 2) + 1;
            fl2.title = fld.title;
            let typ = fld.type;
            if (fld.type.startsWith('bit(')) {
              let tmp = Math.ceil(parseInt(typ.replace('bit(', '').replace(')', '')) / 8) * 8;
              typ = 'uint' + tmp;
            }
            fl2.type = typ;
            def.fields.push(fl1);
            def.fields.push(fl2);
            let len = null;
            if ((fld.type == 'chr(x)') || (fld.type == 'str')) {
              len = com.calcLength(fld.type, frm.data.readUInt8(Math.ceil((ptr + 1) / 8)));
            } else {
              len = com.calcLength(fld.type);
            }
            if (len != null) {
              len = Math.ceil(len / 8) * 8;
              ptr += len;
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
}

module.exports = {
  unpack,
  decode,
};
