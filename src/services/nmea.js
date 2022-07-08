const dec = require('./decode.js');
const enc = require('./encode.js');
const com = require('./common.js');
const adr = require('./address.js');
const can = require('./can.js');

const tranList = [60928, 126993];
const recvList = [60928];

// Serial number can be loaded from configuration
let serial = 123456;

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
        if (msg.header.dst == adr.getAddress()) {
          // Send Product Info message
          send126996();
        }
        break;
      case 126998:
        if (msg.header.dst == adr.getAddress()) {
          // Send Configuration Info message
          send126998();
        }
        break;
      default:
        if (msg.header.dst == adr.getAddress()) {
          // Send ISO Acknowledge message with negative acknowledgement
          send059392(1, 0xFF, fld.value, msg.header.src);
        }
        break;
    }
  }
};

// Processes Proprietary Command message
// Set Serial Number
function proc065280(msg) {
  // This PGN should be 061184 (addressable)
  // if (msg.header.dst == adr.getAddress()) {
    let fld = com.getField(1, msg.fields);
    if ((fld == null) || (fld.value != 161)) {
      return;
    }
    fld = com.getField(3, msg.fields);
    if ((fld == null) || (fld.value != 4)) {
      return;
    }
    fld = com.getField(4, msg.fields);
    if ((fld == null) || (fld.value != 0xBC)) {
      return;
    }
    fld = com.getField(5, msg.fields);
    if (fld != null) {
      serial = fld.value;
    }
    console.log(serial);
  // }
};
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
  let msg = null;
  if ((par == 0) && (tranList.length > 0)) {
    msg = {
      key: 'nmea2000/126464/0/-/-/-/-',
      header: { pgn: 126464, src: adr.getAddress(), dst: dst },
      fields: [
        { field: 1, title: 'Transmitted PGN Group Function Code', state: 'V', value: par },
      ],
    };
    for (let i = 0; i < tranList.length; i++) {
      msg.fields.push({ field: i + 2, title: 'PGN supported (' + (i + 1) + ')', state: 'V', value: tranList[i] });
    }
  } else if ((par == 1) && (recvList.length > 0)) {
    msg = {
      key: 'nmea2000/126464/1/-/-/-/-',
      header: { pgn: 126464, src: adr.getAddress(), dst: dst },
      fields: [
        { field: 1, title: 'Transmitted PGN Group Function Code', state: 'V', value: par },
      ],
    };
    for (let i = 0; i < recvList.length; i++) {
      msg.fields.push({ field: i + 2, title: 'PGN supported (' + (i + 1) + ')', state: 'V', value: recvList[i] });
    }
  }
  if (msg != null) {
    return sendMsg(msg);
  }
  return false;
};

// Sends Product Information message
function send126996() {
  let msg = {
    key: 'nmea2000/126996/-/-/-/-/-',
    header: { pgn: 126996, src: adr.getAddress(), dst: 0xFF },
    fields: [
      { field: 1,title: 'NMEA Network Message Database Version', state: 'V', value: 2101 },
      { field: 2,title: 'NMEA Manufacturer\'s Product Code', state: 'V', value: 1111 },
      { field: 3,title: 'Manufacturer\'s Model ID', state: 'V', value: 'Puma' },
      { field: 4,title: 'Manufacturer\'s Software Version Code', state: 'V', value: 'v1.0.0' },
      { field: 5,title: 'Manufacturer\'s Model Version', state: 'V', value: '2222' },
      { field: 6,title: 'Manufacturer\'s Model Serial Code', state: 'V', value: serial.toString() },
      { field: 7,title: 'NMEA 2000 Certification Level', state: 'V', value: 2 },
      { field: 8,title: 'Load Equivalency', state: 'V', value: 1 },
    ],
  };
  return sendMsg(msg);
};

// Sends Configuration Information message
function send126998() {
  let msg = {
    key: 'nmea2000/126998/-/-/-/-/-',
    header: { pgn: 126998, src: adr.getAddress(), dst: 0xFF },
    fields: [
      { field: 1,title: 'Installation Description, Field 1', state: 'V', value: 'PUMA' },
      { field: 2,title: 'Installation Description, Field 2', state: 'V', value: '' },
      { field: 3,title: 'Manufacturer Information, Field 3', state: 'V', value: 'Puma' },
    ],
  };
  return sendMsg(msg);
};

// Sends ISO Acknowledgement message
function send059392(ctr, grp, pgn, dst) {
  let msg = {
    key: 'nmea2000/059392/-/-/-/-/-',
    header: { pgn: 59392, src: adr.getAddress(), dst: dst },
    fields: [
      { field: 1,title: 'Control Byte', state: 'V', value: ctr },
      { field: 2,title: 'Group Function Value', state: 'V', value: grp },
      { field: 3,title: 'NMEA Reserved', state: 'V', value: 0xFFFFFF },
      { field: 4,title: 'PGN of Requested Information', state: 'V', value: pgn },
    ],
  };
  return sendMsg(msg);
};

module.exports = {
  init,
  process,
  create,
  sendMsg,
  sendRaw,
};
