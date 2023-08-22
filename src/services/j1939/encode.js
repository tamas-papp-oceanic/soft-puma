const log = require('electron-log');
const com = require('./common.js');

// Convert message to can frame
function encode(msg) {
  try {
    if ((typeof msg.header === 'undefined') || (typeof msg.fields === 'undefined')) {
      return null;
    }
    let spl = msg.key.split('/');
    let def = com.getDef(spl.splice(0, spl.length - 2).join('/'));
    if (def == null) {
      return null;
    }
    msg.header.pri = def.priority;
    let ptr = 0;
    for (let i in def.fields) {
      let fld = def.fields[i];
      let len = null;
      if (fld.type !== null) {
        len = com.calcLength(fld.type);
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
      if (fld.type !== null) {
        len = com.calcLength(fld.type);
      }
      if ((len != null) && (len > 0)) {
        if (fld.type.startsWith('bit(')) {
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
          if (fld.multiplier != null) {
            if (typeof mfl.value == 'bigint') {
              if (fld.multiplier >= 1) {
                mfl.value /= BigInt(fld.multiplier);
              } else {
                mfl.value *= BigInt(1 / fld.multiplier);
              }
              mfl.value = Number(mfl.value);
            } else {
              mfl.value /= fld.multiplier;
            }
          }
          switch (fld.type) {
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
} catch (err) {
  log.error("ERROR", err);
  return null;
}
};


module.exports = {
  encode,
};
