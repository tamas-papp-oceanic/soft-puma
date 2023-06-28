const log = require('electron-log');
const com = require('./common.js');
const enc = require('./encode.js');
const { StateMachine } = require('@edium/fsm');

class Address {
  // Private field definitions
  #namerec;   // Name record field / value definition
  #ourname;   // Our name record
  #address;   // Our address
  #savaddr;   // Saved address
  #timeout;   // Random timeout
  #send;      // Send callback method
  #timers;    // Product Information timers
  #names;     // Name records
  #asm;       // Address State Machine
  #s0;        // State 0
  #s1;        // State 1
  #s2;        // State 2
  #s3;        // State 3
  #s4;        // State 4
  #s5;        // State 5
  #s6;        // State 6
  #s7;        // State 7
  #s8;        // State 8
  #s9;        // State 9
  // Class contructor
  constructor() {
    const context = {
      randomize: () => Math.floor(Math.random() * 2),
    };
    this.#namerec = {
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
    this.#ourname = new Buffer.alloc(8).fill(0);
    this.#address = 0;
    this.#savaddr = 0;
    this.#timeout = null;
    this.#send = null;
    this.#timers = {};
    this.#names = {};
    // Define final state machine
    this.#asm = new StateMachine('ASM', context);
    this.#s0 = this.#asm.createState('Idle', false, this.#s0Entry.bind(this));
    this.#s1 = this.#asm.createState('WaitForDelay1', false, this.#s1Entry.bind(this));
    this.#s2 = this.#asm.createState('TransmitNew2', false, this.#s2Entry.bind(this));
    this.#s3 = this.#asm.createState('WaitForContention', false, this.#s3Entry.bind(this));
    this.#s4 = this.#asm.createState('FetchNext', false, this.#s4Entry.bind(this));
    this.#s5 = this.#asm.createState('Valid', false, this.#s5Entry.bind(this));
    this.#s6 = this.#asm.createState('WaitForDelay6', false, this.#s6Entry.bind(this));
    this.#s7 = this.#asm.createState('TransmitNew7', false, this.#s7Entry.bind(this));
    this.#s8 = this.#asm.createState('WaitForCommand', false, this.#s8Entry.bind(this));
    this.#s9 = this.#asm.createState('TransmitNew9', false, this.#s9Entry.bind(this));
    // Define all state transitions
    this.#s0.addTransition('next', this.#s1);
    this.#s1.addTransition('next', this.#s2);
    this.#s2.addTransition('succ', this.#s3);
    this.#s2.addTransition('fail', this.#s1);
    this.#s3.addTransition('next', this.#s5);
    this.#s3.addTransition('win', this.#s2);
    this.#s3.addTransition('cmd', this.#s2);
    this.#s3.addTransition('loose', this.#s4);
    this.#s4.addTransition('succ', this.#s2);
    this.#s4.addTransition('fail', this.#s6);
    this.#s5.addTransition('win', this.#s9);
    this.#s5.addTransition('loose', this.#s4);
    this.#s5.addTransition('cmd', this.#s2);
    this.#s6.addTransition('next', this.#s7);
    this.#s7.addTransition('succ', this.#s8);
    this.#s7.addTransition('fail', this.#s6);
    this.#s8.addTransition('cmd', this.#s2);
    this.#s9.addTransition('succ', this.#s5);
    this.#s9.addTransition('fail', this.#s1);
    // Starts the state machine
    this.#asm.start(this.#s0);
  };
  // Starts address manager
  start(par) {
    this.#send = par;
    let frm = enc.encode({
      key: 'nmea2000/060928/-/-/-/-/-',
      header: { pgn: 60928, src: this.#address, dst: 0xFF },
      fields: [
        { field: 1, title: "Unique Number (ISO Identity Number)", state: 'V', value: this.#namerec[1] },
        { field: 2, title: "Manufacturer Code", state: 'V', value: this.#namerec[2] },
        { field: 3, title: "Device Instance Lower (ISO ECU Instance)", state: 'V', value: this.#namerec[3] },
        { field: 4, title: "Device Instance Upper (ISO Function Instance)", state: 'V', value: this.#namerec[4] },
        { field: 5, title: "Device Function (ISO Function)", state: 'V', value: this.#namerec[5] },
        { field: 6, title: "NMEA Reserved", state: 'V', value: this.#namerec[6] },
        { field: 7, title: "Device Class", state: 'V', value: this.#namerec[7] },
        { field: 8, title: "System Instance (ISO Device Class Instance)", state: 'V', value: this.#namerec[8] },
        { field: 9, title: "Industry Group", state: 'V', value: this.#namerec[9] },
        { field: 10, title: "NMEA Reserved (ISO Self Configurable)", state: 'V', value: this.#namerec[10] },
      ],
    });
    frm.data.copy(this.#ourname);
    this.#s0.trigger('next');
  };
  // Stops address manager
  stop() {
    this.#asm.reset(false);
  };
  // Gets name record
  get name() {
    return this.#namerec;
  };
  // Gets our address
  get address() {
    return this.#address;
  };
  // Sets our address
  set address(addr) {
    return this.#address = addr;
  };
  // Gets state machine's current state
  get state() {
    return this.#asm.currentState.name;
  };
  // Idle
  #s0Entry(state, context) {
  };
  // WaitForDelay1
  #s1Entry(state, context) {
    let tio = this.rnd();
    this.#timeout = setTimeout(() => {
      state.trigger('next');
    }, tio);
  };
  // TransmitNew2
  #s2Entry(state, context) {
    // Send ISO Address Claim
    if (this.send060928()) {
      state.trigger('succ');
    } else {
      state.trigger('fail');
    }
  };
  // WaitForContention
  #s3Entry(state, context) {
    this.#timeout = setTimeout(() => {
      state.trigger('next');
    }, 251);
  };
  // FetchNext
  #s4Entry(state, context) {
    let our = this.#address;
    let sav = this.#savaddr;
    our++
    if (our > 251) {
      our = 0x00;
    }
    if (our == sav) {
      our = 254;
      this.#address = our;
      this.#savaddr = our;
      state.trigger('fail');
    } else {
      this.#address = our;
      state.trigger('succ');
    }
  };
  // Valid
  #s5Entry(state, context) {
    this.send059904(60928, 0xFF);
  };
  // WaitForDelay6
  #s6Entry(state, context) {
    let tio = this.rnd();
    this.#timeout = setTimeout(() => {
      state.trigger('next');
    }, tio);
  };
  // TransmitNew7
  #s7Entry(state, context) {
    // Send ISO Address Claim
    if (this.send060928()) {
      state.trigger('succ');
    } else {
      state.trigger('fail');
    }
  };
  // WaitForCommand
  #s8Entry(state, context) {
  };
  // TransmitNew9
  #s9Entry(state, context) {
    // Send ISO Address Claim
    if (this.send060928()) {
      state.trigger('succ');
    } else {
      state.trigger('fail');
    }
  };
  // Sends ISO Request message
  send059904(pgn, dst) {
    if (this.#send != null) {
      let frm = {
        id: com.makePgn({
          pgn: 59904,
          pri: 6,
          src: this.#address,
          dst: dst,
        }),
        ext: true,
        rtr: false,
        data: Buffer.alloc(3),
      };
      frm.data.writeUintLE(pgn, 0, 3);
      return this.#send(frm);
    } else {
      return false;
    }
  };
  // Processes ISO Address Claim message
  proc060928(msg) {
    let nam = msg.raw.toString('hex', 4);
    if (typeof this.#timers[nam] !== 'undefined') {
      clearTimeout(this.#timers[nam]);
      delete this.#timers[nam];
    }
    if (typeof this.#names[nam] === 'undefined') {
      this.#timers[nam] = setTimeout((key, src) => {
        this.send059904(126996, src);
        delete this.#timers[key];
      }, 2000, nam, msg.header.src);
    }
    this.#names[nam] = msg.raw[3];
    switch (this.#asm.currentState.name) {
      case 'WaitForContention':
      case 'Valid':
        if (msg.header.src != this.#address) {
          return;
        }
        if (this.#timeout != null) {
          clearTimeout(this.#timeout);
          this.#timeout = null;
        }
        let fnr = msg.raw.readBigUInt64LE(4);
        let our = this.#ourname.readBigUInt64LE(0);
        if (our < fnr) {
          // Iwin
          this.#asm.currentState.trigger('win');
          return
        }
        // Ilose
        this.#asm.currentState.trigger('loose');
        break;
    }
    return;
  };
  // Sends ISO Address Claim message
  send060928() {
    if (this.#send != null) {
      let frm = {
        id: com.makePgn({
          pgn: 60928,
          pri: 6,
          src: this.#address,
          dst: 0xFF,
        }),
        ext: true,
        rtr: false,
        data: Buffer.alloc(8),
      };
      this.#ourname.copy(frm.data);
      return this.#send(frm);
    } else {
      return false;
    }
  };
  // Processes ISO Commanded Address message
  proc065240(msg) {
    switch (this.#asm.currentState.name) {
      case 'WaitForContention':
      case 'Valid':
      case 'WaitForCommand':
        if (this.#timeout != null) {
          clearTimeout(this.#timeout);
          this.#timeout = null;
        }
        if (msg.raw.compare(this.#ourname, 0, 7, 0, 7) == 0) {
          this.#address = msg.raw.readUInt8(8);
          this.#asm.currentState.trigger('cmd');
        }
    }
    return;
  };
  // Get device instance
  getInstance(src) {
    for (const [key, val] of Object.entries(this.#names)) {
      if (val == src) {
        return parseInt(key.substring(4, 6));
      }
    }
    return null;
  };
  // Clear name records
  clearNames() {
    this.#names = {};
  }
  // Random timeout generator
  rnd() {
    return Math.floor(Math.random() * 255 * 0.6)
  };
};

module.exports = Address;