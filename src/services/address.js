const com = require('./common.js');
const { State, StateMachine } = require('@edium/fsm');

let ourname = new Buffer.alloc(8);
let address = 0;
let savaddr = 0;
let timeout = null;
let sending = null;

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
s3.addTransition('win', s5);
s4.addTransition('succ', s2);
s4.addTransition('fail', s6);
s6.addTransition('next', s7);
s7.addTransition('succ', s8);
s7.addTransition('fail', s6);
s9.addTransition('succ', s5);
s9.addTransition('fail', s1);

// Start the state machine
asm.start(s0);

function start(par) {
  sending = par;
  s0.trigger('next');
}
// Idle
function s0Entry(state, context) {

  console.log(state.name)
 
};
// WaitForDelay1
function s1Entry(state, context) {

  console.log(state.name)

  timeout = setTimeout(() => {
    state.trigger('next');
  }, random());
};
// TransmitNew2
function s2Entry(state, context) {

  console.log(state.name)

  // Send ISO Address Claim
  // If success
  state.trigger('succ');
  // Else
  // state.trigger('fail');
};
// WaitForContention
function s3Entry(state, context) {

  console.log(state.name)

  timeout = setTimeout(() => {
    state.trigger('win');
  }, 251);
};
// FetchNext
function s4Entry(state, context) {

  console.log(state.name)

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

  console.log(state.name, asm.currentState.name)

};
// WaitForDelay6
function s6Entry(state, context) {

  console.log(state.name)

  setTimeout(() => {
    state.trigger('next');
  }, random());
};
// TransmitNew7
function s7Entry(state, context) {

  console.log(state.name)

  // Send ISO Address Claim
  // If success
  state.trigger('succ');
  // Else
  // state.trigger('fail');
};
// WaitForCommand
function s8Entry(state, context) {

  console.log(state.name, asm.currentState.name)

};
// TransmitNew9
function s9Entry(state, context) {

  console.log(state.name)

  // Send ISO Address Claim
  // If success
  state.trigger('succ');
  // Else
  // state.trigger('fail');
};

function entryAction(state, context) {
  console.log(state.name, asm.currentState.name)
};
function final(state, context) {
  console.log(state.name, asm.currentState.name)
};

// Processes ISO Address Claim message
function proc060928(msg) {
  switch (asm.currentState.name) {
    case 'WaitForContention':
    case 'Valid':
      if (msg.header.src != address) {
        return;
      }
      if (timeout != null) {
        clearTimeout(timeout);
        timeout = null;
      }
      let raw = Buffer.alloc(8);
      msg.raw.copy(raw);
      raw.swap64();
      let our = Buffer.alloc(8);
      ourname.copy(our);
      our.swap64()
      if (raw.compare(our, 0, 7, 0, 7) == -1) {
        // Iwin
        if (asm.currentState.name == 'WaitForContention') {
          asm.trigger('transmit-new-2');
        } else {
          asm.trigger('transmit-new-9');
        }
        return
      }
      // Ilose
      asm.trigger('FetchNext');
  }
  return;
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
        asm.trigger('transmit-new-2');
      }
  }
  return;
};

module.exports = {
  start,
  proc060928,
  proc065240,
};
