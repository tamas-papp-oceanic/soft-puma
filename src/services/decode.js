const com = require('./common.js');

let fastbuff = {};

function unpack(frm) {
  key = frm.id.toString(16).padStart(8, '0');
  if (com.isSingle(frm)) {
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
      };
      if (len > 0) {
        fap.data = Buffer.alloc(len);
      } else {
        fap.corrupted = true;
      }
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
};

// Convert can frame to message
function decode(frm) {
  let msg = null;
  let def = com.findPgn(frm);
  if (def != null) {
    let raw = Buffer.alloc(4 + frm.data.length);
    let pgn = Buffer.from(frm.id.toString(16).padStart(8, '0'), "hex");
    pgn.copy(raw);
    frm.data.copy(raw, 4);
    msg = {
      key: def.key,
      header: {
        pgn: com.getPgn(frm),
        src: com.getSrc(frm),
        dst: com.getDst(frm),
      },
      title: def.title,
      fields: new Array(),
      raw: raw,
    }
    if (typeof def.repeat !== "undefined") {
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
    let ins = null;
    let typ = null;
    let ptr = 0;
    let val = null;
    for (let i in def.fields) {
      try {
        let fld = def.fields[i];
        let byt = Math.floor(ptr / 8);
        let len = 0;
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
            let msk = BigInt((1 << len) - 1)
            let off = BigInt(ptr - (byt * 8));
            val = parseInt(((dat >> off) & msk).toString());
            ptr += len;
          } else if (fld.type == 'chr(x)') {
            if (len > 0) {
              let buf = Buffer.alloc(len);
              frm.data.copy(buf, 0, byt + 1);
              val = buf.toString('utf8').replace(/[^\x01-\x7F]/g, "");
            }
            ptr += (len * 8);
          } else if (fld.type.startsWith('chr(')) {
            let buf = Buffer.alloc(len);
            frm.data.copy(buf, 0, byt);
            val = buf.toString('utf8').replace(/[^\x01-\x7F]/g, "");
            ptr += (len * 8);
          } else if (fld.type == 'str') {
            let asc = frm.data.readUInt8(byt + 1);
            if (len > 2) {
              let buf = Buffer.alloc(len - 2);
              frm.data.copy(buf, 0, byt + 2);
              val = buf.toString(asc == 0 ? 'utf8' : 'ucs2').replace(/[^\x01-\x7F]/g, "");
            }
            ptr += (len * 8);
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
            fld.state = com.getStatus(val, fld.type);
            if (fld.multiplier != null) {
              if (typeof val == 'bigint') {
                if (fld.multiplier >= 1) {
                  val *= BigInt(fld.multiplier);
                } else {
                  val /= BigInt(1 / fld.multiplier);
                }
              } else {
                val *= fld.multiplier;
              }
            }
            ptr += len;
          }
          fld.value = val;
          delete fld.multiplier;
          if (typeof fld.instance !== "undefined") {
            ins = val;
            delete fld.instance;
          }
          if (msg.key.startsWith("nmea2000/127505") && (fld.field == 2)) {
            typ = val;
          }
          msg.fields.push(fld);
        }
      } catch (err) {
        console.log("ERROR", pgn, frm, def, err)
      }
    }
    if (ins != null) {
      msg.key += "/" + ins;
    } else {
      msg.key += "/-";
    }
    if (ins != null) {
      msg.header.ins = ins;
    }
    if (typ != null) {
      msg.key += "/" + typ;
    } else {
      msg.key += "/-";
    }
  }
  return msg;
};

module.exports = {
  unpack,
  decode,
};
