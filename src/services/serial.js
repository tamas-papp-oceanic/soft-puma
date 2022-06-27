const { SerialPort } = require('serialport')
const { ReadlineParser } = require("@serialport/parser-readline");
const { DelimiterParser } = require("@serialport/parser-delimiter");

const port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200, autoOpen: false });

port.on('open', () => {
  console.log('Serial port opened');
});

port.on('data', (dat) => {
});

port.on('error', (err) => {
  console.log('error', err.message);
});

// Convert string to can message frame
function toCanFrame(str) {
  let spl = str.split(" ");
  let pgn = Number("0x" + spl[0]);
  let len = parseInt(spl[1]);
  let dat = Buffer.from(spl[2], "hex")
  let tim = Date.now() / 1000;
  let msg = {
    id: pgn,
    ext: true,
    rtr: false,
    data : (len > 0 && len < 64) ? Buffer.alloc(len) : Buffer.alloc(64),
    t_sec: Math.floor(tim),
    t_usec: Math.round((tim - Math.floor(tim)) * 1000000),
  };
  msg.data.fill(0); // should be 0xFF for j1939 message def.
  dat.copy(msg.data);
  return msg;
}

function start(fun) {

  fun(toCanFrame("09F20505 8 0001020304050607"));
  fun(toCanFrame("09F20105 8 0006020304050607"));

  port.open((err) => {
    if (err) {
      console.log("Couldn't open serial port:", err.message);
      return;
    } else {
      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
      parser.on('data', (dat) => {
        fun(toCanFrame(msg));
      });
    }
  });
};

function stop() {
  if (port.isOpen) {
    port.close();
  }
};

module.exports = {
  start,
  stop,
};
