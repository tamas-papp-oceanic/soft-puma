const { app } = require('electron');
const path = require('path');
const fs = require('fs');

let can = require('socketcan');

// const channel = can.createRawChannel("can0", true);

function start(fun) {
  // channel.addListener("onMessage", (msg) => {
  //   console.log('(' + (msg.ts_sec + msg.ts_usec / 1000000).toFixed(6) + ') ' +
  //   toHex(msg.id).toUpperCase() + '#' + msg.data.toString('hex').toUpperCase());
  // });
  // fun(msg);
  // channel.start();
};

function stop() {
  // channel.stop();
};

module.exports = {
  start,
  stop,
};
