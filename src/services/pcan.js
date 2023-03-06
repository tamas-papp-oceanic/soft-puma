const log = require('electron-log');
const PcanUsb = require('@csllc/cs-pcan-usb');

// Class definition
class Can {
  // Local variables
  #devices;
  #device;
  #running;
  #timer;
  // Constructor
  constructor() {
    this.#devices = new Array();
    this.#device = new PcanUsb({ canRate: 250000 });;
    this.#running = false;
    this.#timer = null;
  };
  // Discovers can devices
  discover() {
    return new Promise((resolve, reject) => {
      this.#devices = new Array();
      if (this.#device != null) {
        this.#device.list().then((prs) => {
          this.#devices.push(...prs);
          resolve(prs);
        }).catch((err) => {
          log.error(err);
          reject(err);
        });
      } else {
        reject('Not ready');
      }
    });
  }
  // Starts CAN port
  start(fun) {
    this.#tick(fun);
    this.#timer = setInterval((fun) => {
      this.#tick(fun);
    }, 5000, fun);
  };
  // Stops CAN port
  stop() {
    if (this.#timer != null) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    if ((this.#device != null) && this.#running) {
      this.#device.close();
    }
  };
  // Sends data to CAN port
  send(frm) {
    frm.buf = frm.data;
    delete frm.data;
    if ((this.#device != null) && this.#running) {
      this.#device.write(frm).catch((err) => {
        log.error(err);
      });
    }
  };
  // Gets device string
  device() {
    return this.#device;
  }
  // Timer tick event
  #tick(fun) {
    if (!this.#running) {
      log.info('Starting CAN port (' + this.#devices[0].path + ')...');
      this.#device.open(this.#devices[0].path).then(() => {
        this.#device.on('data', (frm) => {
          frm.data = frm.buf;
          let tim = new Date().getTime();
          frm.ts_sec = Math.floor(tim / 1000);
          frm.ts_usec = (tim % 1000) * 1000;
          delete frm.buf;
          // log.debug('(' + (msg.ts_sec + msg.ts_usec / 1000000).toFixed(6) + ') ' + msg.id.toString(16).toUpperCase().padStart(8, '0') + '#' + msg.data.toString('hex').toUpperCase());
          fun(this.#devices[0].path, frm);
        });
        this.#running = true;
        log.info('CAN port (' + this.#devices[0].path + ') started.');
        return;
      }).catch((err) => {
        this.#running = false;
        log.info(err);
      });
    }
  };
};
// Module exports
module.exports = Can;
