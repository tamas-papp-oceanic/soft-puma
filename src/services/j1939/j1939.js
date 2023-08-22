const os = require('os');
const log = require('electron-log');
const dec = require('./decode.js');
const enc = require('./encode.js');
const com = require('./common.js');
let can = null;
const ser = require('../serial.js');

if (os.platform() == 'linux') {
  can = require('../can.js');
} else if (os.platform() == 'win32') {
  can = require('../pcan.js');
}

// Class definition
class J1939Engine {
  // Static variables
  #active;
  #device;
  // Contructor
  constructor(dev) {
    this.#active = false;
    this.#device = dev;
    // Serial number can be loaded from configuration
  };
  // Initializes J1939 engine
  init() {
    this.#active = true;
  };
  // Returns with active state
  active() {
    return this.#active;
  }
  // Destroys J1939 engine
  destroy() { };
  // Gets device function
  get device() {
    return this.#device;
  };
  // J1939 data processing function
  process(frm) {
    let tmp = dec.unpack(frm);
    if (tmp != null) {
      let msg = dec.decode(tmp);
      if (msg != null) {
        switch (msg.header.pgn) {
        default:
          break;
        }
        return msg;
      }
    }
    return null;
  };
  // J1939 data creating function
  #createMsg(msg) {
    return enc.encode(msg);
  };
  // J1939 message sending function
  sendMsg(msg) {
    msg.header.src = 252;
    let frs = this.#createMsg(msg);
    for (let i in frs) {
      try {
        this.#device.send(frs[i]);
      } catch (err) {
        log.error(err);
        return false;
      }
    }
    return true;
  };
};

module.exports = J1939Engine;
