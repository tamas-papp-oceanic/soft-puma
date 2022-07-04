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

try {
  cha = can.createRawChannel("can0", true);
} catch (err) {
  cha = null;
  console.log(err);
}

function start(fun) {
  if (cha != null) {
    cha.addListener("onMessage", (msg) => {
      // console.log('(' + (msg.ts_sec + msg.ts_usec / 1000000).toFixed(6) + ') ' + msg.id.toString(16).toUpperCase().padStart(8, '0') + '#' + msg.data.toString('hex').toUpperCase());
      fun(msg);
    });
    cha.start();
  }
};

function send(dat) {
  if (cha != null) {
    cha.send(dat);
  }
};

function stop() {
  if (cha != null) {
    cha.stop();
  }
};

module.exports = {
  start,
  send,
  stop,
};
