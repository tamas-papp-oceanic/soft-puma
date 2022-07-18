const { SerialPort } = require('serialport')
const { ReadlineParser } = require("@serialport/parser-readline");

const sdev = '/dev/ttyACM0';
const baud = 115200;

const port = new SerialPort({ path: sdev, baudRate: baud, autoOpen: false });

let running = false;
let timer = null;
let logged = {
  open: false,
  err: false,
}
// On open event
port.on('open', () => {
  logged.open = false;
  logged.error = false;
  running = true;
  console.log('Serial port (' + sdev + ') opened.');
});
// On error event
port.on('error', (err) => {
  running = false;
  console.log('Error on serial port (' + sdev + '):', err.message);
});
// On close event
port.on('close', () => {
  console.log('Serial port (' + sdev + ') closed.');
});
// Starts serial port
function start(fun) {
  tick(fun);
  timer = setInterval((fun) => {
    tick(fun);
  }, 5000, fun);
};
// Stops serial port
function stop() {
  if (timer != null) {
    clearInterval(timer);
    timer = null;
  }
  if (port.isOpen) {
    port.close();
  }
};
// Sends data to serial port
function send(dat) {
  if (port.isOpen) {
    let msg = fromCanFrame(dat);
    if (msg != null) {
      port.write(msg);
    }
  }
};
// Gets device string
function device() {
  return sdev;
}
// Timer tick event
function tick(fun) {
  if (!port.isOpen) {
    if (!logged.open) {
      console.log('Opening serial port (' + sdev + ')...');
      logged.open = true;
    }
    port.open((err) => {
      if (err) {
        if (!logged.error) {
          console.log('Couldn\'t open serial port (' + sdev + '):', err.message);
          logged.error = true;
        }
        return;
      } else {
        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
        parser.on('data', (dat) => {
          // let msg = fun(sdev, toCanFrame(dat));
          // if (msg != null) {
          //   ipcRenderer.send('ser-data', msg)
          // }
          fun(sdev, toCanFrame(dat));
        });
      }
    });
  }
};
// Convert string to can message frame
function toCanFrame(str) {
  let spl = str.split(" ");
  let pgn = Number("0x" + spl[0]);
  let len = parseInt(spl[1]);
  let dat = Buffer.from(spl[2], "hex")
  let tim = Date.now() / 1000;
  let frm = {
    id: pgn,
    ext: true,
    rtr: false,
    data : (len > 0 && len < 64) ? Buffer.alloc(len) : Buffer.alloc(64),
    t_sec: Math.floor(tim),
    t_usec: Math.round((tim - Math.floor(tim)) * 1000000),
  };
  frm.data.fill(0); // should be 0xFF for j1939 message def.
  dat.copy(frm.data);
  return frm;
};
// Convert can message frame to string
function fromCanFrame(frm) {
  let msg = frm.id.toString(16).padStart(8, '0') + ' ';
  msg += frm.data.length.toString() + ' ';
  msg += frm.data.toString('hex');
  return msg;
};
// Module exports
module.exports = {
  start,
  stop,
  send,
  device,
};
