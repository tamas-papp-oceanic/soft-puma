const dec = require('./decode.js');
const enc = require('./encode.js');

// NMEA data processing function
function process(frm) {
  let tmp = dec.unpack(frm);
  if (tmp != null) {
    let msg = dec.decode(tmp);
    if (msg != null) {
      return msg;
    }
  }
  return null;
}

// NMEA data creating function
function create(msg) {
  let frm = enc.encode(msg);
  if (frm != null) {
    let tmp = enc.pack(frm);
    if (tmp != null) {
      return tmp;
    }
  }
  return null;
}

module.exports = {
  process,
  create,
};
