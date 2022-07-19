const { SerialPort } = require('serialport')
const { ReadlineParser } = require("@serialport/parser-readline");

class Serial {
  // Local variables
  #device;
  #port;
  #running;
  #timer;
  #logged;
  // Constructor
  constructor(dev, bau) {
    this.#device = dev;
    this.#port = new SerialPort({ path: dev, baudRate: bau, autoOpen: false });
    // On open event
    this.#port.on('open', () => {
      this.#logged.open = false;
      this.#logged.error = false;
      this.#running = true;
      console.log('Serial port (' + this.#device + ') opened.');
    });
    // On error event
    this.#port.on('error', (err) => {
      this.#running = false;
      console.log('Error on serial port (' + this.#device + '):', err.message);
    });
    // On close event
    this.#port.on('close', () => {
      console.log('Serial port (' + this.#device + ') closed.');
    });
    this.#running = false;
    this.#timer = null;
    this.#logged = {
      open: false,
      error: false,
    }
  };
  // Starts serial port
  start(fun) {
    this.#tick(fun);
    this.#timer = setInterval((fun) => {
      this.#tick(fun);
    }, 5000, fun);
  };
  // Stops serial port
  stop() {
    if (this.#timer != null) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    if (this.#port.isOpen) {
      this.#port.close();
    }
  };
  // Sends data to serial port
  send(frm) {
    if (this.#port.isOpen) {
      let msg = this.#fromCanFrame(frm);
      if (msg != null) {
        this.#port.write(msg);
      }
    }
  };
  // Gets device string
  device() {
    return this.#device;
  }
  // Timer tick event
  #tick(fun) {
    if (!this.#port.isOpen) {
      if (!this.#logged.open) {
        console.log('Opening serial port (' + this.#device + ')...');
        this.#logged.open = true;
      }
      this.#port.open((err) => {
        if (err) {
          if (!this.#logged.error) {
            console.log('Couldn\'t open serial port (' + this.#device + '):', err.message);
            this.#logged.error = true;
          }
          return;
        } else {
          const parser = this.#port.pipe(new ReadlineParser({ delimiter: '\n' }));
          parser.on('data', (dat) => {
            fun(this.#device, this.#toCanFrame(dat));
          });
        }
      });
    }
  };
  // Convert string to can message frame
  #toCanFrame(str) {
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
  #fromCanFrame(frm) {
    let msg = frm.id.toString(16).padStart(8, '0') + ' ';
    msg += frm.data.length.toString() + ' ';
    msg += frm.data.toString('hex');
    return msg.toUpperCase();
  };
};
// Module exports
module.exports = Serial;
