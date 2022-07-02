const dec = require('./decode.js');

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

module.exports = {
  process,
};
