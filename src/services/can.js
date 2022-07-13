/*
IMPORTANT!!!

cd node_modules/socketcan
HOME=~/.electron-gyp node-gyp rebuild --target=19.0.0 --arch=x64 --dist-url=https://electronjs.org/headers

*/
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const can = require('socketcan');

let cha = null;
let started = false;

try {
  cha = can.createRawChannel("can0", true);
} catch (err) {
  cha = null;
  console.log(err);
}

function start(fun) {
  if ((cha != null) && !started) {
    cha.addListener("onMessage", (msg) => {
      // console.log('(' + (msg.ts_sec + msg.ts_usec / 1000000).toFixed(6) + ') ' + msg.id.toString(16).toUpperCase().padStart(8, '0') + '#' + msg.data.toString('hex').toUpperCase());
      fun(msg);
    });
    cha.addListener("onStopped", (msg) => {
      console.log('CAN stopped.');
      started = false;
    });
    cha.start();
    started = true;
  }
};

function send(dat) {
  if ((cha != null) && started) {
    cha.send(dat);
  }
};

function stop() {
  if ((cha != null) && started) {
    cha.stop();
  }
};

module.exports = {
  start,
  send,
  stop,
};
