/*
IMPORTANT!!!

cd node_modules/socketcan
HOME=~/.electron-gyp node-gyp rebuild --target=19.0.0 --arch=x64 --dist-url=https://electronjs.org/headers

*/
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const can = require('socketcan');

const cdev = 'can0';
let cha = null;
let running = false;
let timer = null;
// Starts CAN port
function start(fun) {
  tick(fun);
  timer = setInterval((fun) => {
    tick(fun);
  }, 5000, fun);
};
// Stops CAN port
function stop() {
  if (timer != null) {
    clearInterval(timer);
    timer = null;
  }
  if ((cha != null) && running) {
    cha.stop();
  }
};
// Sends data to CAN port
function send(frm) {
  if ((cha != null) && running) {
    cha.send(frm);
  }
};
// Timer tick event
function tick(fun) {
  try {
    if (!running) {
      console.log('Starting CAN port (' + cdev + ')...');
      cha = can.createRawChannel(cdev, true);
      if (cha != null) {
        cha.addListener('onMessage', (frm) => {
          // console.log('(' + (msg.ts_sec + msg.ts_usec / 1000000).toFixed(6) + ') ' + msg.id.toString(16).toUpperCase().padStart(8, '0') + '#' + msg.data.toString('hex').toUpperCase());
          fun(cdev, frm);
        });
        cha.addListener('onStopped', () => {
          console.log('CAN port (' + cdev + ') stopped.');
          running = false;
          cha = null;
        });
        cha.start();
        running = true;
        console.log('CAN port (' + cdev + ') started.');
        return;
      }
    }
  } catch (err) {
    running = false;
    console.log(err);
    cha = null;
  }
};
// Gets device string
function device() {
  return cdev;
}
// Module exports
module.exports = {
  start,
  send,
  stop,
  device,
};
