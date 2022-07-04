const com = require('./common.js');
const { State, StateMachine } = require('@edium/fsm');

let ourname = {};
let address = 0;
let savaddr = 0;
let timeout = null;

const context = {
  randomize: () => Math.floor(Math.random() * 2),
};

const asm = new StateMachine('ASM', context);
const s1 = asm.createState('Starting', false, s1Entry);
const s2 = asm.createState('WaitForDelay', false, s2Entry);
const s3 = asm.createState('TransmitNew', false, s3Entry);
const s4 = asm.createState('WaitForContention', false, s4Entry);
const s5 = asm.createState('WinTransmit', false, s5Entry);
const s6 = asm.createState('FetchNext', false, s6Entry);
const s7 = asm.createState('Valid', false, s7Entry);
const s8 = asm.createState('NullWaitForDelay', false, entryAction);
const s9 = asm.createState('NullTransmitNew', false, entryAction);
const s10 = asm.createState('NullProcess', false, entryAction);
const s11 = asm.createState( "Final", true, final); 

// Define all state transitions
s1.addTransition('next', s2);
s2.addTransition('next', s3);
s3.addTransition('next', s4);
s4.addTransition('win', s5);
s4.addTransition('loose', s6);
s5.addTransition('next', s7);
s6.addTransition('null', s10);
s6.addTransition('new', s3);

// Start the state machine
asm.start(s1);
// Starting
function s1Entry(state, context) {

console.log(state.name)

  state.trigger('next');
};
// WaitForDelay
function s2Entry(state, context) {

  console.log(state.name)

  setTimeout(() => {
    state.trigger('next');
  }, Math.floor(Math.random() * 250));
};
// TransmitNew
function s3Entry(state, context) {

  console.log(state.name)

  // Send ISO Address Claim

  state.trigger('next');
};
// WaitForContention
function s4Entry(state, context) {

  console.log(state.name)

  timeout = setTimeout(() => {
    state.trigger('win');
  }, 251);
};
// WinTransmit
function s5Entry(state, context) {

  console.log(state.name)

  // Send ISO Address Claim
  state.trigger('next');
};
// FetchNext
function s6Entry(state, context) {

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
    state.trigger('null');
	} else {
		address = our;
    state.trigger('new');
	}

  state.trigger('next');
};
// Valid
function s7Entry(state, context) {

  console.log(state.name, asm.currentState.name)

  // state.trigger('next');
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
      for (let i = 0; i < 8; i++) {
        if (msg.raw[7 - i] > ourname[7 - i]) {
          // Iwin
          s4.trigger('win');
          return
        }
      }
      // Ilose
      s4.trigger('loose');
      return;
  }
  return;
};

module.exports = {
  proc060928,
};
