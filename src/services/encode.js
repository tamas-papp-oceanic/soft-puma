const com = require('./common.js');

// let fastbuff = {};
// let datrbuff = {};

function pack(frm) {
  let pgn = com.getPgn(frm.id);
  if (com.isSingle(pgn)) {
    return frm;
  } else {
    return encodeFastPacket(frm);
  }
};

// Convert message to can frame
function encode(msg) {
  if ((typeof msg.header === "undefined") || (typeof msg.fields === "undefined")) {
    return null;
  }
  let spl = msg.key.split('/');
  let def = com.getDef(spl.splice(0, spl.length - 2).join('/'));
  if (def == null) {
    return null;
  }
  let frm = null;
  if (typeof def.repeat !== "undefined") {
    let max = null;
    for (let i in def.repeat) {
      for (let j in def.fields) {
        let fld = def.fields[j];
        let len = 0;
        if (fld.field < def.repeat[i].field) {
          if (fld.field > max) {
            max = fld.field;
          }
        } else {
          let mfl = com.getField(fld.field, msg.fields);
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
  let ptr = 0;
  for (let i in def.fields) {
    let fld = def.fields[i];
    let len = 0;
    if ((fld.type == 'chr(x)') || (fld.type == 'str')) {
      let mfl = getField(fld.field, msg.fields);
      len = mfl != null ? mfl.length : 0;
    } else {
      len = com.calcLength(fld.type);
    }
    if (len != null) {
      ptr += len;
    }
  }
  let raw = Buffer.alloc(4 + Math.ceil(ptr / 8));
  let pgn = Buffer.from(com.makePgn(msg.header).toString(16).padStart(8, '0'), "hex");
  pgn.copy(raw);
  // let ins = null;
  // let typ = null;
  ptr = 0;
  // let val = null;
  for (let i in def.fields) {
    try {
      let fld = def.fields[i];
      let mfl = com.getField(fld.field, msg.fields);
      let byt = Math.floor(ptr / 8);
      let len = 0;
      if ((fld.type == 'chr(x)') || (fld.type == 'str')) {
        len = com.calcLength(fld.type, mfl != null ? mfl.value : 0);
      } else {
        len = com.calcLength(fld.type);
      }
      if ((len != null) && (len > 0)) {
        if (fld.type.startsWith('bit(')) {
          let cnt = Math.ceil(len / 8);
          let val = BigInt(raw.readUIntLE(byt + 4, cnt));
          let msk = BigInt((1 << len) - 1)
          let off = BigInt(ptr - (byt * 8));
          val += ((BigInt(mfl.value) & msk) << off);
          raw.writeUIntLE(val, byt + 4, cnt)
          ptr += len;
        } else if (fld.type == 'chr(x)') {
          raw.writeUInt8LE(len, byt + 4,);
          if (len > 0) {
            raw.write(mfl.value, byt + 4 + 1, 'utf8');
          }
          ptr += ((len + 1) * 8);
        } else if (fld.type.startsWith('chr(')) {
          raw.write(mfl.value, byt + 4, 'utf8');
          ptr += (len * 8);
        } else if (fld.type == 'str') {
          raw.writeUInt8LE(len, byt + 4,);
          raw.writeUInt8LE(0, byt + 4 + 1,);
          if (len > 0) {
            raw.write(mfl.value, byt + 4, 'utf8');
          }
          ptr += ((len + 2) * 8);
        } else {
          if (fld.multiplier != null) {
            if (typeof val == 'bigint') {
              if (fld.multiplier >= 1) {
                mfl.value /= BigInt(fld.multiplier);
              } else {
                mfl.value *= BigInt(1 / fld.multiplier);
              }
            } else {
              mfl.value /= fld.multiplier;
            }
          }
          switch (fld.type) {
            case "int8":
              raw.writeInt8(Math.round(mfl.value), byt + 4);
              break;
            case "uint8":
              raw.writeUInt8(Math.round(mfl.value), byt + 4);
              break;
            case "int16":
              raw.writeInt16LE(Math.round(mfl.value), byt + 4);
              break;
            case "uint16":
              raw.writeUInt16LE(Math.round(mfl.value), byt + 4);
              break;
            case "int24":
              raw.writeIntLE(Math.round(mfl.value), byt + 4, 3);
              break;
            case "uint24":
              raw.writeUIntLE(Math.round(mfl.value), byt + 4, 3);
              break;
            case "int32":
              raw.writeInt32LE(Math.round(mfl.value), byt + 4);
              break;
            case "uint32":
              raw.writeUInt32LE(Math.round(mfl.value), byt + 4);
              break;
            case "float32":
              raw.writeFloatLE(mfl.value, byt + 4);
              break;
            case "int48":
              raw.writeIntLE(Math.round(mfl.value), byt + 4, 6);
              break;
            case "uint48":
              raw.writeUIntLE(Math.round(mfl.value), byt + 4, 6);
              break;
            case "int64":
              raw.writeBigInt64LE(Math.round(mfl.value), byt + 4);
              break;
            case "uint64":
              raw.writeBigUInt64LE(Math.round(mfl.value), byt + 4);
              break;
            case "float64":
              raw.writeDoubleLE(mfl.value, byt + 4);
              break;
          }
          ptr += len;
        }
      }
    } catch (err) {
      // console.log("ERROR", pgn, frm, def, err)
      console.log(err)
    }
  }
console.log(raw)
  // if (ins != null) {
  //   msg.key += "/" + ins;
  // } else {
  //   msg.key += "/-";
  // }
  // if (ins != null) {
  //   msg.header.ins = ins;
  // }
  // if (typ != null) {
  //   msg.key += "/" + typ;
  // } else {
  //   msg.key += "/-";
  // }
  // return msg;
};

function encodeFastPacket(frm) {
  let fap = {};
  let seq = frm.data.readUInt8(0) >> 5;
  let cnt = frm.data.readUInt8(0) & 0x1F;
  let min = 0;
  let key = frm.id.toString(16).padStart(8, '0');
  if (typeof fastbuff[key] === "undefined") {
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
      fap.data = Buffer.alloc(len);
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
}

module.exports = {
  pack,
  encode,
};
