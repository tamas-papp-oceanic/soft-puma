const com = require('./common.js');
const enc = require('./encode.js');
const { StateMachine } = require('@edium/fsm');

class Address {
  // Private field definitions
  #namerec;
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
    this.ourname = new Buffer.alloc(8).fill(0);
    this.address = 0;
    this.savaddr = 0;
    this.timeout = null;
    this.send = null;
    this.timers = {};
    // Define final state machine
    this.asm = new StateMachine('ASM', this.context);
    this.s0 = this.asm.createState('Idle', false, this.s0Entry);
    this.s1 = this.asm.createState('WaitForDelay1', false, this.s1Entry);
    this.s2 = this.asm.createState('TransmitNew2', false, this.s2Entry);
    this.s3 = this.asm.createState('WaitForContention', false, this.s3Entry);
    this.s4 = this.asm.createState('FetchNext', false, this.s4Entry);
    this.s5 = this.asm.createState('Valid', false, this.s5Entry);
    this.s6 = this.asm.createState('WaitForDelay6', false, this.s6Entry);
    this.s7 = this.asm.createState('TransmitNew7', false, this.s7Entry);
    this.s8 = this.asm.createState('WaitForCommand', false, this.s8Entry);
    this.s9 = this.asm.createState('TransmitNew9', false, this.s9Entry);
    // Define all state transitions
    this.s0.addTransition('next', this.s1);
    this.s1.addTransition('next', this.s2);
    this.s2.addTransition('succ', this.s3);
    this.s2.addTransition('fail', this.s1);
    this.s3.addTransition('next', this.s5);
    this.s3.addTransition('win', this.s2);
    this.s3.addTransition('cmd', this.s2);
    this.s3.addTransition('loose', this.s4);
    this.s4.addTransition('succ', this.s2);
    this.s4.addTransition('fail', this.s6);
    this.s5.addTransition('win', this.s9);
    this.s5.addTransition('loose', this.s4);
    this.s5.addTransition('cmd', this.s2);
    this.s6.addTransition('next', this.s7);
    this.s7.addTransition('succ', this.s8);
    this.s7.addTransition('fail', this.s6);
    this.s8.addTransition('cmd', this.s2);
    this.s9.addTransition('succ', this.s5);
    this.s9.addTransition('fail', this.s1);
    // Starts the state machine
    this.asm.start(this.s0);
  };
  static random() {
    return Math.floor(Math.random() * 255 * 0.6);
  };
  // Starts address manager
  start(par) {
    this.send = par;
    let frm = enc.encode({
      key: 'nmea2000/060928/-/-/-/-/-',
      header: { pgn: 60928, src: this.address, dst: 0xFF },
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
    frm.data.copy(this.ourname);
    this.s0.trigger('next');
  };
  // Stops address manager
  stop() {
    this.asm.reset(false);
  };
  // Gets name record
  get name() {
    return this.#namerec;
  };
  // Gets our address
  get address() {
    return this._address;
  };
  // Sets our address
  set address(addr) {
    return this._address = addr;
  };
  // Idle
  static s0Entry(state, context) {
  };
  // WaitForDelay1
  static s1Entry(state, context) {
    this.timeout = setTimeout(() => {
      state.trigger('next');
    }, random());
  };
  // TransmitNew2
  static s2Entry(state, context) {
    // Send ISO Address Claim
    if (this.send060928()) {
      state.trigger('succ');
    } else {
      state.trigger('fail');
    }
  };
  // WaitForContention
  static s3Entry(state, context) {
    this.timeout = setTimeout(() => {
      state.trigger('next');
    }, 251);
  };
  // FetchNext
  static s4Entry(state, context) {
    let our = this.address;
    let sav = this.savaddr;
    our++
    if (our > 251) {
      our = 0x00;
    }
    if (our == sav) {
      our = 254;
      this.address = our;
      this.savaddr = our;
      state.trigger('fail');
    } else {
      this.address = our;
      this.state.trigger('succ');
    }
  };
  // Valid
  static s5Entry(state, context) {
    this.send059904(60928, 0xFF);
  };
  // WaitForDelay6
  static s6Entry(state, context) {
    setTimeout(() => {
      state.trigger('next');
    }, random());
  };
  // TransmitNew7
  static s7Entry(state, context) {
    // Send ISO Address Claim
    if (this.send060928()) {
      state.trigger('succ');
    } else {
      state.trigger('fail');
    }
  };
  // WaitForCommand
  static s8Entry(state, context) {
  };
  // TransmitNew9
  static s9Entry(state, context) {
    // Send ISO Address Claim
    if (this.send060928()) {
      state.trigger('succ');
    } else {
      state.trigger('fail');
    }
  };
  // Sends ISO Request message
  send059904(pgn, dst) {
    if (this.send != null) {
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
      return this.send(frm);
    } else {
      return false;
    }
  };
  // Processes ISO Address Claim message
  proc060928(msg) {
    let nam = msg.raw.toString('hex', 4);
    if (typeof this.timers[nam] !== 'undefined') {
      clearTimeout(this.timers[nam]);
      delete this.timers[nam];
    } else {
      this.timers[nam] = setTimeout((key, src) => {
        this.send059904(126996, src);
        delete this.timers[key];
      }, 3000, nam, msg.header.src);
    }
    switch (this.asm.currentState.name) {
      case 'WaitForContention':
      case 'Valid':
        if (msg.header.src != this.address) {
          return;
        }
        if (this.timeout != null) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
        let fnr = msg.raw.readBigUInt64LE(4);
        let our = this.ourname.readBigUInt64LE(0);
        if (our < fnr) {
          // Iwin
          this.asm.currentState.trigger('win');
          return
        }
        // Ilose
        this.asm.currentState.trigger('loose');
        break;
    }
    return;
  };

  // Sends ISO Address Claim message
  send060928() {
    if (this.send != null) {
      let frm = {
        id: com.makePgn({
          pgn: 60928,
          pri: 6,
          src: this.address,
          dst: 0xFF,
        }),
        ext: true,
        rtr: false,
        data: Buffer.alloc(8),
      };
      this.ourname.copy(frm.data);
      return this.send(frm);
    } else {
      return false;
    }
  };

  // Processes ISO Commanded Address message
  proc065240(msg) {
    switch (this.asm.currentState.name) {
      case 'WaitForContention':
      case 'Valid':
      case 'WaitForCommand':
        if (this.timeout != null) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
        if (msg.raw.compare(this.ourname, 0, 7, 0, 7) == 0) {
          this.address = msg.raw.readUInt8(8);
          this.asm.currentState.trigger('cmd');
        }
    }
    return;
  };
};

module.exports = Address;