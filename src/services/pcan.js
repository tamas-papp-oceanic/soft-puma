/*
IMPORTANT!!!

cd node_modules/socketcan
HOME=~/.electron-gyp node-gyp rebuild --target=19.0.0 --arch=x64 --dist-url=https://electronjs.org/headers

*/
const os = require('os');
const fs = require('fs');
const path = require('path');
const Pcan = require('@csllc/cs-pcan-usb');
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
    this.#channel = new Pcan(dev);
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
    return this.#device;
  }
  // Discovers can devices
  static discover() {
    let res = new Array();

console.log(this.#channel)

    if (this.#channel != null) {
      this.#channel.list().then((prs) => {
        for (let i in prs) {
          res.push(prs[i].path);
        }
        return res;
      }).catch((err) => {
        console.log(err);
        return res;
      });
    }
    return res;
  }
  // Timer tick event
  #tick(fun) {
    if (!this.#running) {
      console.log('Starting CAN port (' + this.#device + ')...');
      if (this.#channel != null) {
        this.#channel.open(this.#device).then(() => {
          this.#channel.on('data', (frm) => {
            // console.log('(' + (msg.ts_sec + msg.ts_usec / 1000000).toFixed(6) + ') ' + msg.id.toString(16).toUpperCase().padStart(8, '0') + '#' + msg.data.toString('hex').toUpperCase());
            fun(this.#device, frm);
          });
          this.#running = true;
          console.log('CAN port (' + this.#device + ') started.');
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
