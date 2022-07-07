const dec = require('./decode.js');
const enc = require('./encode.js');
const com = require('./common.js');
const adr = require('./address.js');
const can = require('./can.js');

const tranList = [60928, 126993];
const recvList = [60928];

// Initializes NMEA engine
function init() {
  adr.start(sendRaw);
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

// NMEA message sending function
function sendMsg(msg) {
  let frs = create(msg);
  for (let i in frs) {
    try {
      can.send(frs[i]);
    } catch (err) {
      console.log(err);
      return false;
    }
  }
  return true;
};

// NMEA raw sending function
function sendRaw(frm) {
  try {
    can.send(frm);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

// Process ISO Request message
function proc059904(msg) {
	let fld = com.getField(1, msg.fields);
  if (fld != null) {
    switch (fld.value) {
      case 60928:
        // Send ISO Address Claim message
        adr.send060928();
        break;
      case 126464:
        if (msg.header.dst == adr.getAddress()) {
          // Send PGN Transmit List message
          send126464(0, msg.header.src);
          // Send PGN Receive List message
          send126464(1, msg.header.src);
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
// Sends PGN Transmit / Receive Lists
function send126464(par, dst) {
  let frm = null;
  if ((par == 0) && (tranList.length > 0)) {
    let msg = {
      key: 'nmea2000/126464/0/-/-/-/-',
      header: { pgn: 126464, src: adr.getAddress(), dst: dst },
      fields: [
        { field: 1, title: 'Transmitted PGN Group Function Code', state: 'V', value: par },
      ],
    };
    for (let i = 0; i < tranList.length; i++) {
      msg.fields.push({ field: i + 2, title: 'PGN supported (' + (i + 1) + ')', state: 'V', value: tranList[i] });
    }
    frm = enc.encode(msg);
  } else if ((par == 1) && (recvList.length > 0)) {
    let msg = {
      key: 'nmea2000/126464/0/-/-/-/-',
      header: { pgn: 126464, src: adr.getAddress(), dst: dst },
      fields: [
        { field: 1, title: 'Transmitted PGN Group Function Code', state: 'V', value: par },
      ],
    };
    for (let i = 0; i < recvList.length; i++) {
      msg.fields.push({ field: i + 2, title: 'PGN supported (' + (i + 1) + ')', state: 'V', value: recvList[i] });
    }
    frm = enc.encode(msg);
  }

  console.log(frm)
};


module.exports = {
  init,
  process,
  create,
  sendMsg,
  sendRaw,
};
