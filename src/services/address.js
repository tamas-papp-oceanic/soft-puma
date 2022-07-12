const com = require('./common.js');
const enc = require('./encode.js');
const { StateMachine } = require('@edium/fsm');

let ourname = new Buffer.alloc(8).fill(0);
let address = 0;
let savaddr = 0;
let timeout = null;
let send = null;
let timers = {};

const context = {
  randomize: () => Math.floor(Math.random() * 2),
};

function random() {
  return Math.floor(Math.random() * 255 * 0.6);
}

const asm = new StateMachine('ASM', context);
const s0 = asm.createState('Idle', false, s0Entry);
const s1 = asm.createState('WaitForDelay1', false, s1Entry);
const s2 = asm.createState('TransmitNew2', false, s2Entry);
const s3 = asm.createState('WaitForContention', false, s3Entry);
const s4 = asm.createState('FetchNext', false, s4Entry);
const s5 = asm.createState('Valid', false, s5Entry);
const s6 = asm.createState('WaitForDelay6', false, s6Entry);
const s7 = asm.createState('TransmitNew7', false, s7Entry);
const s8 = asm.createState('WaitForCommand', false, s8Entry);
const s9 = asm.createState('TransmitNew9', false, s9Entry);
const s10 = asm.createState( "Final", true, final); 

// Define all state transitions
s0.addTransition('next', s1);
s1.addTransition('next', s2);
s2.addTransition('succ', s3);
s2.addTransition('fail', s1);
s3.addTransition('next', s5);
s3.addTransition('win', s2);
s3.addTransition('cmd', s2);
s3.addTransition('loose', s4);
s4.addTransition('succ', s2);
s4.addTransition('fail', s6);
s5.addTransition('win', s9);
s5.addTransition('loose', s4);
s5.addTransition('cmd', s2);
s6.addTransition('next', s7);
s7.addTransition('succ', s8);
s7.addTransition('fail', s6);
s8.addTransition('cmd', s2);
s9.addTransition('succ', s5);
s9.addTransition('fail', s1);

// Starts the state machine
asm.start(s0);

const name = {
  1: 123456,  // Unique Number (ISO Identity Number)
  2: 161,     // Manufacturer Code
  3: 0,       // Device Instance Lower (ISO ECU Instance)
  4: 0,       // Device Instance Upper (ISO Function Instance)
  5: 135,     // Device Function (ISO Function)
  6: 0,       // NMEA Reserved
  7: 120,     // Device Class
  8: 0,       // System Instance (ISO Device Class Instance)
  9: 4,       // Industry Group
  10: 1,      // NMEA Reserved (ISO Self Configurable)
};

function start(par) {
  send = par;
  let frm = enc.encode({
    key: 'nmea2000/060928/-/-/-/-/-',
    header: { pgn: 60928, src: address, dst: 0xFF },
    fields: [
      { field: 1, title: "Unique Number (ISO Identity Number)", state: 'V', value: name[1] },
      { field: 2, title: "Manufacturer Code", state: 'V', value: name[2] },
      { field: 3, title: "Device Instance Lower (ISO ECU Instance)", state: 'V', value: name[3] },
      { field: 4, title: "Device Instance Upper (ISO Function Instance)", state: 'V', value: name[4] },
      { field: 5, title: "Device Function (ISO Function)", state: 'V', value: name[5] },
      { field: 6, title: "NMEA Reserved", state: 'V', value: name[6] },
      { field: 7, title: "Device Class", state: 'V', value: name[7] },
      { field: 8, title: "System Instance (ISO Device Class Instance)", state: 'V', value: name[8] },
      { field: 9, title: "Industry Group", state: 'V', value: name[9] },
      { field: 10, title: "NMEA Reserved (ISO Self Configurable)", state: 'V', value: name[10] },
    ],
  });
  frm.data.copy(ourname);
  s0.trigger('next');
}
// Gets name record
function getName() {
  return name;
}
// Gets our address
function getAddress() {
  return address;
}
// Idle
function s0Entry(state, context) {
};
// WaitForDelay1
function s1Entry(state, context) {
  timeout = setTimeout(() => {
    state.trigger('next');
  }, random());
};
// TransmitNew2
function s2Entry(state, context) {
  // Send ISO Address Claim
  if (send060928()) {
    state.trigger('succ');
  } else {
    state.trigger('fail');
  }
};
// WaitForContention
function s3Entry(state, context) {
  timeout = setTimeout(() => {
    state.trigger('next');
  }, 251);
};
// FetchNext
function s4Entry(state, context) {
  let our = address;
	let sav = savaddr;
	our++
	if (our > 251) {
		our = 0x00;
	}
	if (our == sav) {
		our = 254;
		address = our;
		savaddr = our;
    state.trigger('fail');
	} else {
		address = our;
    state.trigger('succ');
	}
};
// Valid
function s5Entry(state, context) {
  send059904(60928, 0xFF);
};
// WaitForDelay6
function s6Entry(state, context) {
  setTimeout(() => {
    state.trigger('next');
  }, random());
};
// TransmitNew7
function s7Entry(state, context) {
  // Send ISO Address Claim
  if (send060928()) {
    state.trigger('succ');
  } else {
    state.trigger('fail');
  }
};
// WaitForCommand
function s8Entry(state, context) {
};
// TransmitNew9
function s9Entry(state, context) {
  // Send ISO Address Claim
  if (send060928()) {
    state.trigger('succ');
  } else {
    state.trigger('fail');
  }
};
// Final state
function final(state, context) {
};

// Sends ISO Request message
function send059904(pgn, dst) {
  if (send != null) {
    let frm = {
      id: com.makePgn({
        pgn: 59904,
        pri: 6,
        src: address,
        dst: dst,
      }),
      ext: true,
      rtr: false,
      data: Buffer.alloc(3),
    };
    frm.data.writeUintLE(pgn, 0, 3);
    return send(frm);
  } else {
    return false;
  }
};

// Processes ISO Address Claim message
function proc060928(msg) {
  let nam = msg.raw.toString('hex', 4);
  if (typeof timers[nam] !== "undefined") {
    clearTimeout(timers[nam]);
    delete timers[nam];
  } else {
    timers[nam] = setTimeout((key, src) => {
      send059904(126996, src);
      delete timers[key];
    }, 3000, nam, msg.header.src);
  }
  switch (asm.currentState.name) {
    case 'WaitForContention':
    case 'Valid':
      if (msg.header.src != address) {
        return;
      }
      if (msg.raw.length == 12) {
        if (timeout != null) {
          clearTimeout(timeout);
          timeout = null;
        }
        let fnr = msg.raw.readUInt64LE(4);
        let our = ourname.readUint64LE(0);
        if (our < fnr) {
          // Iwin
          asm.currentState.trigger('win');
          return
        }
        // Ilose
        asm.currentState.trigger('loose');
      }
      break;
  }
  return;
};

// Sends ISO Address Claim message
function send060928() {
  if (send != null) {
    let frm = {
      id: com.makePgn({
        pgn: 60928,
        pri: 6,
        src: address,
        dst: 0xFF,
      }),
      ext: true,
      rtr: false,
      data: Buffer.alloc(8),
    };
    ourname.copy(frm.data);
    return send(frm);
  } else {
    return false;
  }
};

// Processes ISO Commanded Address message
function proc065240(msg) {
  switch (asm.currentState.name) {
    case 'WaitForContention':
    case 'Valid':
    case 'WaitForCommand':
      if (timeout != null) {
        clearTimeout(timeout);
        timeout = null;
      }
      if (msg.raw.compare(ourname, 0, 7, 0, 7) == 0) {
        our = msg.raw.readUInt8(8);
        asm.currentState.trigger('cmd');
      }
  }
  return;
};

module.exports = {
  start,
  getName,
  getAddress,
  proc060928,
  send060928,
  proc065240,
};
