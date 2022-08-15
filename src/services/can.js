/*
IMPORTANT!!!

cd node_modules/socketcan
HOME=~/.electron-gyp node-gyp rebuild --target=19.0.0 --arch=x64 --dist-url=https://electronjs.org/headers

*/
const os = require('os');
const fs = require('fs');
const path = require('path');
const log = require('electron-log');
const can = require('socketcan');
// Class definition
class Can {
  // Local variables
  #device;
  #channel;
  #running;
  #timer;
  // Constructor
  constructor(dev) {
    this.#device = dev;
    this.#channel = null;
    this.#running = false;
    this.#timer = null;
  };
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
    if ((this.#channel != null) && this.#running) {
      this.#channel.stop();
    }
  };
  // Sends data to CAN port
  send(frm) {
    if ((this.#channel != null) && this.#running) {
      this.#channel.send(frm);
    }
  };
  // Gets device string
  device() {
    return this.#device;
  }
  // Discovers can devices
  static discover() {
    return fs.readdirSync('/sys/class/net');
  }
  // Timer tick event
  #tick(fun) {
    try {
      if (!this.#running) {
        log.info('Starting CAN port (' + this.#device + ')...');
        this.#channel = can.createRawChannel(this.#device, true);
        if (this.#channel != null) {
          this.#channel.addListener('onMessage', (frm) => {
            // log.debug('(' + (msg.ts_sec + msg.ts_usec / 1000000).toFixed(6) + ') ' + msg.id.toString(16).toUpperCase().padStart(8, '0') + '#' + msg.data.toString('hex').toUpperCase());
            fun(this.#device, frm);
          });
          this.#channel.addListener('onStopped', () => {
            log.info('CAN port (' + this.#device + ') stopped.');
            this.#running = false;
            this.#channel = null;
          });
          this.#channel.start();
          this.#running = true;
          log.info('CAN port (' + this.#device + ') started.');
          return;
        }
      }
    } catch (err) {
      this.#running = false;
      this.#channel = null;
      log.error(err);
    }
  };
};
// Module exports
module.exports = Can;
