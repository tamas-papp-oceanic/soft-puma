const { app } = require('electron');
const path = require('path');
const fs = require('fs');

/*
  IMPORTANT!!!

  cd node_modules/socketcan
  HOME=~/.electron-gyp node-gyp rebuild --target=16.2.8 --arch=x64 --dist-url=https://electronjs.org/headers

 */

let can = require('socketcan');

const channel = can.createRawChannel("can0", true);

function start(fun) {
  channel.addListener("onMessage", (msg) => {
    console.log('(' + (msg.ts_sec + msg.ts_usec / 1000000).toFixed(6) + ') ' + msg.id.toString(16).toUpperCase().padStart(8, '0') + '#' + msg.data.toString('hex').toUpperCase());
    fun(msg);
  });
  channel.start();
};

function stop() {
  channel.stop();
};

module.exports = {
  start,
  stop,
};
