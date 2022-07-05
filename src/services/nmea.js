const dec = require('./decode.js');
const enc = require('./encode.js');
const com = require('./common.js');
const adr = require('./address.js');
const can = require('./can.js');

// Initializes NMEA engine
function init() {
  adr.start(send);
};

// NMEA data processing function
function process(frm) {
  let tmp = dec.unpack(frm);
  if (tmp != null) {
    let msg = dec.decode(tmp);
    if (msg != null) {
      switch (msg.header.pgn) {
        case 59904:
          // ISO Request
          proc059904(msg);
          break;
        case 60928:
          // ISO Address Claim
          adr.proc060928(msg);
          break;
        case 65240:
          // ISO Commanded Address
          adr.proc065240(msg);
          break;
        case 65280:
          // Proprietary Command
          proc065280(msg);
          break;
        case 65445:
          // Proprietary Request
          proc065445(msg);
          break;
        case 126208:
          // NMEA - Request, Command, Acknowledge - group function
          // NMEA - Read Fields, Read fields reply - group function
          // NMEA - Write Fields, Write fields reply - group function
          proc126208(msg);
          break;
        case 126996:
          // Product Information
          proc126996(msg);
          break;
      }
      return msg;
    }
  }
  return null;
};

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
};

// NMEA data sending function
function send(msg) {
  let frs = create(msg);
  for (let i in frs) {
    let j = can.send(frs[i]);
    console.log(j)
  }
  return true;
};

// Process ISO Request message
function proc059904(msg) {
	let pgn = com.getField(1, msg.fields);
  switch (pgn) {
    case 60928:
      // Send ISO Address Claim message
      break;
    case 126464:
      if (msg.header.dst == address) {
        // Send PGN Transmit List message
        // Send PGN Receive List message
      }
      break;
    case 126996:
      // Send Product Info message
      break;
    case 126998:
      // Send Configuration Info message
      break;
    default:
      // Send ISO Actnowledge message with negative acknowledgement
      break;
  }
};

// Processes ISO Commanded Address message
function proc065240(msg) {};
// Processes Proprietary Command message
function proc065280(msg) {};
// Processes Proprietary Request message
function proc065445(msg) {};
// Processes NMEA Group Function messages
// NMEA - Request, Command, Acknowledge - group function
// NMEA - Read Fields, Read fields reply - group function
// NMEA - Write Fields, Write fields reply - group function
function proc126208(msg) {};
// Processes Product Information message
function proc126996(msg) {};

module.exports = {
  init,
  process,
  create,
  send,
};
