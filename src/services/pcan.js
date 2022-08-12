/*
IMPORTANT!!!

cd node_modules/socketcan
HOME=~/.electron-gyp node-gyp rebuild --target=19.0.0 --arch=x64 --dist-url=https://electronjs.org/headers

*/
const os = require('os');
const fs = require('fs');
const path = require('path');
const PcanUsb = require('@csllc/cs-pcan-usb');
const { rejects } = require('assert');

// Class definition
class Can {
  // Local variables
  #devices;
  #channel;
  #running;
  #timer;
  // Constructor
  constructor() {
    this.#devices = new Array();
    this.#channel = new PcanUsb({ canRate: 250000 });
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
      this.#channel.close();
    }
  };
  // Sends data to CAN port
  send(frm) {
    if ((this.#channel != null) && this.#running) {
      this.#channel.write(frm);
    }
  };
  // Gets device string
  device() {
    return this.#devices[0];
  }
  // Discovers can devices
  discover() {
    return new Promise((resolve, reject) => {
      this.#devices = new Array();
      if (this.#channel != null) {
        this.#channel.list().then((prs) => {
          this.#devices.push(...prs);
          resolve(prs);
        }).catch((err) => {
          console.log(err);
          reject(err);
        });
      } else {
        reject('Not ready');
      }
    });
  }
  // Timer tick event
  #tick(fun) {
    if (!this.#running) {
      console.log('Starting CAN port (' + this.#devices[0].path + ')...');
      if (this.#channel != null) {
        this.#channel.open(this.#devices[0].path).then(() => {
          this.#channel.on('data', (frm) => {
            // console.log('(' + (msg.ts_sec + msg.ts_usec / 1000000).toFixed(6) + ') ' + msg.id.toString(16).toUpperCase().padStart(8, '0') + '#' + msg.data.toString('hex').toUpperCase());
            fun(this.#devices[0].path, frm);
          });
          this.#running = true;
          console.log('CAN port (' + this.#devices[0].path + ') started.');
          return;
        }).catch((err) => {
          this.#running = false;
          console.log(err);
        });
      }
    }
  };
};
// Module exports
module.exports = Can;
