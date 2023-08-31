const log = require('electron-log');
const com = require('./common.js');
const con = require('../convert.js');

function pack(frm) {
  let pgn = com.getPgn(frm.id);
  if (com.isSingle(pgn)) {
    return [frm];
  } else {
    return encodeDataTransfer(frm);
  }
};

// Convert message to can frame
function encode(msg) {
  try {
    if ((typeof msg.header === 'undefined') || (typeof msg.fields === 'undefined')) {
      return null;
    }
    let spl = msg.key.split('/');
    let def = com.getDef(spl.splice(0, spl.length - 1).join('/'));    
    if (def == null) {
      return null;
    }
    msg.header.pri = def.priority;
    let ptr = 0;
    for (let i in def.fields) {
      let fld = def.fields[i];
      let len = null;
      if (fld['type'] !== null) {
        len = com.calcLength(fld['type']);
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
        len = com.calcLength(fld['type']);
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
          switch (fld['type']) {
            case "uint8":
              raw.writeUInt8(Math.round(mfl.value), byt);
              break;
            case "uint16":
              raw.writeUInt16LE(Math.round(mfl.value), byt);
              break;
            case "uint24":
              raw.writeUIntLE(Math.round(mfl.value), byt, 3);
              break;
            case "uint32":
              raw.writeUInt32LE(Math.round(mfl.value), byt);
              break;
            case "uint48":
              raw.writeUIntLE(Math.round(mfl.value), byt, 6);
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

function createBAM(pgn, siz) {
  return {
    key: 'j1939/060416/32/-',
    header: { pgn: 60416, src: 0xFF, dst: 0xFF },
    fields: [
      { field: 1, title: "RTS Group Function Code", state: 'V', value: 0x20 },
      { field: 2, title: "Total message size, bytes", state: 'V', value: siz },
      { field: 3, title: "Total number of frames to be transmitted", state: 'V', value: Math.ceil(siz / 7) },
      { field: 4, title: "NMEA Reserved", state: 'V', value: 0xFF },
      { field: 5, title: "PGN of multi-packet message", state: 'V', value: pgn },
    ],
  };
};

function encodeDataTransfer(frm) {
  try {
    if (frm.data.length === 0) {
      return null;
    }
    let ret = new Array();
    let pgn = com.getPgn(frm.id);
    let msg = createBAM(pgn, frm.data.length);
    let bam = encode(msg);
    let rec = {
      id: bam.id,
      ext: bam.ext,
      rtr: bam.rtr,
      data: Buffer.alloc(8),
    };
    bam.data.copy(rec.data);
    ret.push(rec);
    let seq = 0;
    let cnt = 0;
    let dat = Buffer.alloc(8).fill(0xFF);
    for (let i = 0; i < frm.data.length; i++) {
      if ((cnt % 8) === 0) {
        dat.writeUInt8(seq, (cnt % 8));
        seq++
        cnt++
      }
      dat.writeUInt8(frm.data[i], (cnt % 8));
      cnt++
      if ((cnt % 8) === 0) {
        let rec = {
          id: frm.id,
          ext: frm.ext,
          rtr: frm.rtr,
          data: Buffer.alloc(8),
        };
        dat.copy(rec.data);
        ret.push(rec);
        dat.fill(0xFF);
      }
    }
    if ((cnt % 8) !== 0) {
      let rec = {
        id: frm.id,
        ext: frm.ext,
        rtr: frm.rtr,
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

module.exports = {
  pack,
  encode,
};
