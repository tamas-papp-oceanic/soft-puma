const { SerialPort } = require('serialport')
const { ReadlineParser } = require("@serialport/parser-readline");

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
  fun(toCanFrame("09F20105 8 001A000080001094"));
  fun(toCanFrame("09F20105 8 019900A010270000"));
  fun(toCanFrame("09F20105 8 0200000008000100"));
  fun(toCanFrame("09F20105 8 03000000007F7FFF"));
  fun(toCanFrame("09EF0005 8 0005A39902FFFFFF"));
  fun(toCanFrame("19F014DD 8 00861D0C6B28486F"));
  fun(toCanFrame("19F014DD 8 016E646120424632"));
  fun(toCanFrame("19F014DD 8 0235302050474D2D"));
  fun(toCanFrame("19F014DD 8 0346492020202020"));
  fun(toCanFrame("19F014DD 8 0420202020202020"));
  fun(toCanFrame("19F014DD 8 0520205A564C4145"));
  fun(toCanFrame("19F014DD 8 0632313020202020"));
  fun(toCanFrame("19F014DD 8 0720202020202020"));
  fun(toCanFrame("19F014DD 8 0820202020202020"));
  fun(toCanFrame("19F014DD 8 0920202020202033"));
  fun(toCanFrame("19F014DD 8 0A343735302D5A56"));
  fun(toCanFrame("19F014DD 8 0B4C2D3033332020"));
  fun(toCanFrame("19F014DD 8 0C20202020202020"));
  fun(toCanFrame("19F014DD 8 0D20202020202020"));
  fun(toCanFrame("19F014DD 8 0E20202020202020"));
  fun(toCanFrame("19F014DD 8 0F31303035393420"));
  fun(toCanFrame("19F014DD 8 1020202020202020"));
  fun(toCanFrame("19F014DD 8 1120202020202020"));
  fun(toCanFrame("19F014DD 8 1220202020202020"));
  fun(toCanFrame("19F014DD 8 130201FFFFFFFFFF"));

  port.open((err) => {
    if (err) {
      console.log("Couldn't open serial port:", err.message);
      return;
    } else {
      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
      parser.on('data', (dat) => {
        let msg = fun(toCanFrame(dat));
        if (msg != null) {
          ipcRenderer.send('ser-data', msg)
        }
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
