const os = require('os');
const log = require('electron-log');
const dec = require('./decode.js');
const enc = require('./encode.js');
const com = require('./common.js');
let can = null;
const ser = require('./serial.js');

if (os.platform() == 'linux') {
  can = require('./can.js');
} else if (os.platform() == 'windows') {
  can = require('./pcan.js');
}

const Address = require('./address.js');
// Class definition
class NMEAEngine {
  // Static variables
  #device;
  #addrMngr;
  #heartbeat;
  #timer;
  #productInfo;
  // Contructor
  constructor(dev) {
    const tranList = [60928, 126993];
    const recvList = [60928];
    this.#device = dev;
    this.#addrMngr = null;
    this.#heartbeat = {
      sequence: 0,
      can1State: 0,
      can2State: 0,
      equState: 0,
    };
    this.#timer = null;
    // Serial number can be loaded from configuration
    this.#productInfo = {
      1: 2101,      // NMEA Network Message Database Version
      2: 1111,      // NMEA Manufacturer's Product Code
      3: 'Puma',    // Manufacturer's Model ID
      4: 'v1.0.0',  // Manufacturer's Software Version Code
      5: '2222',    // Manufacturer's Model Version
      6: '123456',  // Manufacturer's Model Serial Code
      7: 2,         // NMEA 2000 Certification Level
      8: 1,         // Load Equivalency
    };
  };
  // Initializes NMEA engine
  init() {
    this.#addrMngr = new Address();
    this.#addrMngr.start(this.#sendRaw.bind(this));
    if (this.#timer == null) {
      this.#timer = setInterval((fun) => {
        fun();
      }, 60000, this.#send126993.bind(this));
    }
  };
  // Destroys NMEA engine
  destroy() {
    this.#addrMngr.stop();
    clearInterval(this.#timer);
  };
  // Gets device function
  get device() {
    return this.#device;
  };
  // Gets Product Information function
  get productInfo() {
    return this.#productInfo;
  };
  // NMEA data processing function
  process(frm) {
    let tmp = dec.unpack(frm);
    if (tmp != null) {
      let msg = dec.decode(tmp);
      if (msg != null) {
        switch (msg.header.pgn) {
          case 59904:
            // ISO Request
            this.#proc059904(msg);
            break;
          case 60928:
            // ISO Address Claim
            this.#addrMngr.proc060928(msg);
            break;
          case 65240:
            // ISO Commanded Address
            this.#addrMngr.proc065240(msg);
            break;
          case 65280:
            // Proprietary Set Serial Command
            this.#proc065280(msg);
            break;
          case 65445:
            // Proprietary SF Request / Command
            this.#proc065445(msg);
            break;
          case 126208:
            // NMEA - Request, Command, Acknowledge - Group Function
            this.#proc126208(msg);
            break;
          case 126996:
            // Product Information
            this.#proc126996(msg);
            break;
        }
        return msg;
      }
    }
    return null;
  };
  // NMEA data creating function
  #createMsg(msg) {
    let frm = enc.encode(msg);
    if (frm != null) {
      let tmp = enc.pack(frm);
      if (tmp != null) {
        return tmp;
      }
    }
    return null;
  };
  // NMEA message sending function
  sendMsg(msg) {
    let frs = this.#createMsg(msg);
    for (let i in frs) {
      try {
        this.#device.send(frs[i]);
      } catch (err) {
        log.error(err);
        return false;
      }
    }
    return true;
  };
  // NMEA raw sending function
  #sendRaw(frm) {
    try {
      this.#device.send(frm);
      return true;
    } catch (err) {
      log.error(err);
      return false;
    }
  };
  // Process ISO Request message
  #proc059904(msg) {
    let fld = com.getFld(1, msg.fields);
    if (fld != null) {
      switch (fld.value) {
        case 60928:
          // Send ISO Address Claim message
          this.#addrMngr.send060928();
          break;
        case 126464:
          if (msg.header.dst == this.#addrMngr.address) {
            // Send PGN Transmit List message
            this.#send126464(0, msg.header.src);
            // Send PGN Receive List message
            this.#send126464(1, msg.header.src);
          }
          break;
        case 126996:
          if (msg.header.dst == this.#addrMngr.address) {
            // Send Product Info message
            this.#send126996();
          }
          break;
        case 126998:
          if (msg.header.dst == this.#addrMngr.address) {
            // Send Configuration Info message
            this.#send126998();
          }
          break;
        default:
          if (msg.header.dst == this.#addrMngr.address) {
            // Send ISO Acknowledge message with negative acknowledgement
            this.#send059392(1, 0xFF, fld.value, msg.header.src);
          }
          break;
      }
    }
  };
  // Sends ISO Request message
  send059904(pgn, dst) {
    this.#addrMngr.send059904(pgn, dst);
  };

  // Sends Test Control message
  send065477(code, param) {
    if (typeof param === 'undefined') {
      param = 0xFFFFFFFF;
    }
    if (this.#addrMngr.state == 'Valid') {
      let msg = {
      key: 'nmea2000/065477/-/161/4/-/-',
        header: { pgn: 65477, src: this.#addrMngr.address, dst: 0xFF },
        fields: [
          { field: 1,title: 'Manufacturer Code', state: 'V', value: this.#addrMngr.name[2] },
          { field: 2,title: 'Reserved', state: 'V', value: 0b11 },
          { field: 3,title: 'Industry Group', state: 'V', value: this.#addrMngr.name[9] },
          { field: 4,title: 'Security Code', state: 'V', value: 0xBC },
          { field: 5,title: 'Test Code', state: 'V', value: code },
          { field: 6,title: 'Test Param', state: 'V', value: param },
        ],
      };
      return this.sendMsg(msg);
    }
    return false;
  };
  // Processes Proprietary Command message
  // Set Serial Number
  #proc065280(msg) {
    // This PGN should be 061184 (addressable)
    // if (msg.header.dst == this.#addrMngr.address) {
      let fld = com.getFld(1, msg.fields);
      if (fld == null) {
        return;
      }
      switch (fld.value) {
        case 161:
          // Oceanic Systems
          fld = com.getFld(3, msg.fields);
          if ((fld == null) || (fld.value != 4)) {
            return;
          }
          fld = com.getFld(4, msg.fields);
          if ((fld == null) || (fld.value != 0xBC)) {
            return;
          }
          fld = com.getFld(5, msg.fields);
          if (fld != null) {
            this.#productInfo[6] = fld.value.toString();
          }
          break;
      }
    // }
  };
  // Send Proprietary Command message
  // Set Serial Number
  send065280(serial) {
    // This PGN should be 061184 (addressable)
    if (this.#addrMngr.state == 'Valid') {
      let msg = {
      key: 'nmea2000/065280/-/161/4/-/-',
        header: { pgn: 65280, src: this.#addrMngr.address, dst: 0xFF },
        fields: [
          { field: 1,title: 'Manufacturer Code', state: 'V', value: this.#addrMngr.name[2] },
          { field: 2,title: 'NMEA Reserved', state: 'V', value: 0b11 },
          { field: 3,title: 'Industry Group', state: 'V', value: this.#addrMngr.name[9] },
          { field: 4,title: 'Security Code', state: 'V', value: 0xBC },
          { field: 5,title: 'Serial Number', state: 'V', value: serial },
          { field: 6,title: 'NMEA Reserved', state: 'V', value: 0b111 },
        ],
      };
      return this.sendMsg(msg);
    }
    return false;
  };
  /*
    Processes Proprietary Request / Command message

    Type IDs:
    --------
    0x00 	N/A
    0x01 	Reserved
    0x02 	Reserved
    0x03 	3281 Water Sender
    0x04 	4510 Exhaust Gas Temperature
    0x05 	3478 Switch Relay
    0x06 	4521 Temperature Input Module
    0x07 	Reserved
    0x08 	3420 AC Monitor
    0x09 	4601 4-20mA Fluid Pressure Module
    0x0A 	4272 Hydrostatic Tank Level Sender
    0x0B 	3125 Tank Sender Adaptor
    0x0C 	3185 J1939 to NMEA2000 Adaptor
    0x0D 	3410 DC Monitor
    0x0E 	4530 Cabin Temperature & Humidity Module
    0x0F 	4291 4-20mA Tank Level Adaptor
    0x10 	3155_ATC Tank Level MODBUS Master (Atech)
    0x11 	3155_MCS HVAC MODBUS Master (MCS)
    0x12 	3155_SCH AC MODBUS Master (Schneider)
    0x13 	iDac Type ID
    0x14 	4900 AC Input Module
    0x15 	9101 Seatek Engine Adapter
    0x16 	5720 Fluid Flow Adapter
    0x17 	3130 NMEA to resistive adapter
    0x18 	5906 6 Channel Load Controller
    0x19 	3165 Rudder Angle Adapter
  */
  #proc065445(msg) {
    // This PGN should be 061184 (addressable)
    // if (msg.header.dst == this.#addrMngr.address) {
      let fld = com.getFld(1, msg.fields);
      if (fld == null) {
        return;
      }
      switch (fld.value) {
        case 161:
          // Oceanic Systems
          fld = com.getFld(3, msg.fields);
          if ((fld == null) || (fld.value != 4)) {
            return;
          }
          // Type ID (0xFF = all IDs)
          fld = com.getFld(4, msg.fields);
          if (fld == null) {
            return;
          }
          let tid = fld.value;
          // Instance (0xFF = all instances)
          fld = com.getFld(5, msg.fields);
          if (fld == null) {
            return;
          }
          let ins = fld.value;
          // Data ID (0xFF = Request, all other = Command)
          fld = com.getFld(6, msg.fields);
          if (fld == null) {
            return;
          }
          let did = fld.value;
          // Data Content
          fld = com.getFld(7, msg.fields);
          if (fld == null) {
            return;
          }
          let dat = fld.value;
          if (did == 0xFF) {
            // REQUEST
            // Message Type (0 = SF, 1 = FP)
            let frm = dat & 0xFF;
            // Requested Data ID
            let rdi = (dat >> 8) & 0xFF;
            // Additional information
            let add = (dat >> 16) & 0xFF;
            log.debug("SF CONF REQ", tid, ins, did, frm, rdi, add);
          } else {
            // COMMAND
            log.debug("SF CONF CMD", tid, ins, did, dat);
          }
          break;
      }
    // }
  };
  // NMEA - Request, Command, Acknowledge - Group Function
  #proc126208(msg) {
    // Request Group Function Code
    let fld = com.getFld(1, msg.fields);
    if (fld == null) {
      return;
    }
    let grp = fld.value;
    // Requested PGN
    fld = com.getFld(2, msg.fields);
    if (fld == null) {
      return;
    }
    let pgn = fld.value;
    switch (grp) {
      case 0:
        // REQUEST
        {
          // Transmission Interval
          fld = com.getFld(3, msg.fields);
          if (fld == null) {
            return;
          }
          let tri = fld;
          // Transmission Interval Offset
          fld = com.getFld(4, msg.fields);
          if (fld == null) {
            return;
          }
          let tio = fld;
          // Number of Pairs of Request Parameters
          fld = com.getFld(5, msg.fields);
          if (fld == null) {
            return;
          }
          let nop = fld.value;
          switch (pgn) {
            case 60928:
              if ((msg.header.dst == this.#addrMngr.address) || (msg.header.dst == 0xFF)) {
                let snd = true;
                if (nop != 0xFF) {
                  let gbl = msg.header.dst == 0xFF;
                  let nam = this.#addrMngr.name;
                  let ack = false;
                  let per = 0x00;
                  let ter = 0x00;
                  let fer = Buffer.alloc(nop).fill(0);
                  if ((tri.state == '-') && ((tio.state == '-') || (tio.value == 0))) {
                    // Loop through the parameters
                    for (let i = 0; i < nop; i++) {
                      fld = com.getFld((i * 2) + 6, msg.fields);
                      if (typeof fld === 'undefined') {
                        fer.writeUint8(0x01, i);
                        ack = true;
                        snd = false;
                        break;
                      }
                      let fln = fld.value;
                      fld = com.getFld((i * 2) + 7, msg.fields);
                      if (typeof fld === 'undefined') {
                        fer.writeUint8(0x01, i);
                        ack = true;
                        snd = false;
                        break;
                      }
                      let flv = fld.value;
                      switch (fln) {
                        case 1: // Unique Number (ISO Identity Number)
                        case 2: // Manufacturer Code
                        case 3: // Device Instance Lower (ISO ECU Instance)
                        case 4: // Device Instance Upper (ISO Function Instance)
                        case 5: // Device Function (ISO Function)
                        case 7: // Device Class
                        case 8: // System Instance (ISO Device Class Instance)
                        case 9: // Industry Group
                          if (flv == nam[fln]) {
                            fer.writeUint8(0x00, i);
                            ack = true;
                          } else {
                            if (msg.header.dst != 0xFF) {
                              fer.writeUint8(0x03, i);
                              ack = true;
                            }
                            snd = false;
                          } 
                          break;
                        case 6: // NMEA Reserved
                        case 10: // NMEA Reserved (ISO Self Configurable)
                        default:
                          fer.writeUint8(0x05, i);
                          ack = true;
                          snd = false;
                          break;
                      }
                    }
                  } else {
                    ter = 0x01;
                    ack = true;
                  }
                  if (ack) {
                    // Send Acknowledge Group message
                    this.#send126208(msg.header.src, pgn, per, ter, nop, fer);
                    snd = false;
                  }
                }
                if (snd) {
                  // Send ISO Address Claim message
                  this.#addrMngr.send060928();
                }
              }
              break;
            case 126464:
              if (msg.header.dst == this.#addrMngr.address) {
                let sn1 = false;
                let sn2 = false;
                let ack = false;
                let per = 0x00;
                let ter = 0x00;
                if (nop == 0xFF) {
                  sn1 = true;
                  sn2 = true;
                } else if (nop > 1) {
                  per = 0x04;
                  ack = true;
                } else {
                  let fer = Buffer.alloc(1).fill(0);
                  if ((tri.state == '-') && ((tio.state == '-') || (tio.value == 0))) {
                    fld = com.getFld(6, msg.fields);
                    if (fld == null) {
                      fer.writeUint8(0x01, 0);
                      ack = true;
                      break;
                    }
                    let fln = fld.value;
                    fld = com.getFld(7, msg.fields);
                    if (fld == null) {
                      fer.writeUint8(0x01, 0);
                      ack = true;
                      break;
                    }
                    let flv = fld.value;
                    switch (fln) {
                      case 1: // Function Code
                        switch (flv) {
                          case 0:
                            sn1 = true;
                            break;
                          case 1:
                            sn2 = true;
                            break;
                          default:
                            fer.writeUint8(0x01, 0);
                            ack = true;
                            break;
                        }
                        break;
                      default:
                        ack = true;
                        break;
                    }
                  } else {
                    ter = 0x01;
                    ack = true;
                  }
                  if (ack) {
                    // Send Acknowledge Group message
                    this.#send126208(msg.header.src, pgn, per, ter, nop, fer);
                  }
                }
                if (sn1) {
                  // Send PGN Transmit List message
                  this.#send126464(0, msg.header.src);
                }
                if (sn2) {
                  // Send PGN Receive List message
                  this.#send126464(1, msg.header.src);
                }
              }
              break;
            case 126996:
              if (msg.header.dst == this.#addrMngr.address) {
                let snd = true;
                let ack = false;
                let per = 0x00;
                let ter = 0x00;
                let pif = this.#productInfo;
                let fer = Buffer.alloc(8).fill(0);
                if (nop != 0xFF) {
                  if ((tri.state == '-') && ((tio.state == '-') || (tio.value == 0))) {
                    // Loop through the parameters
                    for (let i = 0; i < nop; i++) {
                      fld = com.getFld((i * 2) + 6, msg.fields);
                      if (fld == null) {
                        fer.writeUint8(0x01, i);
                        ack = true;
                        snd = false;
                        break;
                      }
                      let fln = fld.value;
                      fld = com.getFld((i * 2) + 7, msg.fields);
                      if (fld == null) {
                        fer.writeUint8(0x01, i);
                        ack = true;
                        snd = false;
                        break;
                      }
                      let flv = fld.value;
                      switch (fln) {
                        case 1: // NMEA Network Message Database Version
                        case 2: // Manufacturer's Product Code
                        case 3: // Manufacturer's Model ID
                        case 4: // Manufacturer's Software Version Code
                        case 5: // Manufacturer's Model Version
                        case 6: // Manufacturer's Model Serial Code
                        case 7: // NMEA 2000 Certification Level
                        case 8: // Load Equivalency
                          if (flv == pif[fln]) {
                            fer.writeUint8(0x00, i);
                            ack = true;
                          } else {
                            if (msg.header.dst != 0xFF) {
                              fer.writeUint8(0x03, i);
                              ack = true;
                            }
                            snd = false;
                          } 
                          break;
                        default:
                          fer.writeUint8(0x05, i);
                          ack = true;
                          snd = false;
                          break;
                      }
                    }
                  } else {
                    ter = 0x01;
                    ack = true;
                  }
                }
                if (ack) {
                  // Send Acknowledge Group message
                  this.#send126208(msg.header.src, pgn, per, ter, nop, fer);
                  snd = false;
                }
                if (snd) {
                  // Send Product Info message
                  this.#send126996();
                }
              }
              break;
            default:
              this.#send126208(msg.header.src, pgn, 0x01, 0x00, 0xFF);
              break;
          }
        }
        break;
      case 1:
        // COMMAND
        {
          // Priority
          fld = com.getFld(3, msg.fields);
          if (fld == null) {
            return;
          }
          let pri = fld.value;
          // Number of Pairs of Request Parameters
          fld = com.getFld(5, msg.fields);
          if (fld == null) {
            return;
          }
          let nop = fld.value;
          switch (pgn) {
            case 126996:
              // Process Command Group for Product Info message
              if (msg.header.dst == this.#addrMngr.address) {
                let ack = false;
                let per = 0x00;
                let ter = 0x00;
                let fer = Buffer.alloc(8).fill(0);
                if (nop != 0xFF) {
                  if (pri == 0x08) {
                    // Loop through the parameters
                    for (let i = 0; i < nop; i++) {
                      fld = com.getFld((i * 2) + 6, msg.fields);
                      if (fld == null) {
                        fer.writeUint8(0x01, i);
                        ack = true;
                        snd = false;
                        break;
                      }
                      let fln = fld.value;
                      fld = com.getFld((i * 2) + 7, msg.fields);
                      if (fld == null) {
                        fer.writeUint8(0x01, i);
                        ack = true;
                        snd = false;
                        break;
                      }
                      let flv = fld.value;
                      switch (fln) {
                        case 1: // NMEA Network Message Database Version
                        case 2: // Manufacturer's Product Code
                        case 3: // Manufacturer's Model ID
                        case 4: // Manufacturer's Software Version Code
                        case 5: // Manufacturer's Model Version
                        case 6: // Manufacturer's Model Serial Code
                        case 7: // NMEA 2000 Certification Level
                        case 8: // Load Equivalency
                          fer.writeUint8(0x01, i);
                          ack = true;
                          break;
                        default:
                          fer.writeUint8(0x05, i);
                          ack = true;
                          break;
                      }
                    }
                  } else {
                    ter = 0x03;
                    ack = true;                
                  }
                }
                if (ack) {
                  // Send Acknowledge Group message
                  this.#send126208(msg.header.src, pgn, per, ter, nop, fer);
                }
              }
              break;
            default:
              // Send Acknowledge Group message with PGN error code - Not supported (0x01)
              this.#send126208(msg.header.src, pgn, 0x01, 0x00, 0xFF);
              break;
          }
        }
        break;
      case 2:
        // Acknowledge Message
        break;
      case 3:
        // Read Fields
        break;
      case 4:
        // Read Fields Reply
        break;
      case 5:
        // Write Fields
        break;
      case 6:
        // Write Fields Reply
        break;
    }
  };
  // Processes Product Information message
  #proc126996(msg) {};
  // NMEA - Acknowledge - Group Function
  #send126208(src, pgn, per, ter, nop, fer) {
    if (this.#addrMngr.state == 'Valid') {
      let rep = {
        key: 'nmea2000/126208/2/-/-/-/-',
        priority: 3,
        header: { pgn: 126208, src: this.#addrMngr.address, dst: src },
        fields: [
          { field: 1, title: "Acknowledgment Group Function Code", state: 'V', value: 0x02 },
          { field: 2, title: "PGN beingacknowledged", state: 'V', value: pgn },
          { field: 3, title: "PGN error code", state: 'V', value: per },
          { field: 4, title: "Transmission Interval / Priority error code", state: 'V', value: ter },
        ]
      };
      if ((per != 0x00) || (ter != 0x00)) {
        rep.fields.push({ field: 5, title: "Number of Pairs of Request Parameters to follow", state: 'V', value: 0xFF });
      } else {
        rep.fields.push({ field: 5, title: "Number of Pairs of Request Parameters to follow", state: 'V', value: nop });
        for (let i = 0; i < fer.length; i++) {
          rep.fields.push({ field: i + 6, title: "Result (" + (i + 1) + ")", state: 'V', value: fer.readUInt8(i) });
        }
      }
      return this.sendMsg(rep);
    }
    return false;
  }
  // Sends PGN Transmit / Receive Lists
  #send126464(par, dst) {
    if (this.#addrMngr.state == 'Valid') {
      let msg = null;
      if ((par == 0) && (tranList.length > 0)) {
        msg = {
          key: 'nmea2000/126464/0/-/-/-/-',
          header: { pgn: 126464, src: this.#addrMngr.address, dst: dst },
          fields: [
            { field: 1, title: 'Transmitted PGN Group Function Code', state: 'V', value: par },
          ],
        };
        for (let i = 0; i < tranList.length; i++) {
          msg.fields.push({ field: i + 2, title: 'PGN supported (' + (i + 1) + ')', state: 'V', value: tranList[i] });
        }
      } else if ((par == 1) && (recvList.length > 0)) {
        msg = {
          key: 'nmea2000/126464/1/-/-/-/-',
          header: { pgn: 126464, src: this.#addrMngr.address, dst: dst },
          fields: [
            { field: 1, title: 'Transmitted PGN Group Function Code', state: 'V', value: par },
          ],
        };
        for (let i = 0; i < recvList.length; i++) {
          msg.fields.push({ field: i + 2, title: 'PGN supported (' + (i + 1) + ')', state: 'V', value: recvList[i] });
        }
      }
      if (msg != null) {
        return this.sendMsg(msg);
      }
    }
    return false;
  };

  // Sends Product Information message
  #send126996() {
    if (this.#addrMngr.state == 'Valid') {
      let pinf = this.#productInfo;
      let msg = {
        key: 'nmea2000/126996/-/-/-/-/-',
        header: { pgn: 126996, src: this.#addrMngr.address, dst: 0xFF },
        fields: [
          { field: 1,title: 'NMEA Network Message Database Version', state: 'V', value: pinf[1] },
          { field: 2,title: 'NMEA Manufacturer\'s Product Code', state: 'V', value: pinf[2] },
          { field: 3,title: 'Manufacturer\'s Model ID', state: 'V', value: pinf[3] },
          { field: 4,title: 'Manufacturer\'s Software Version Code', state: 'V', value: pinf[4] },
          { field: 5,title: 'Manufacturer\'s Model Version', state: 'V', value: pinf[5] },
          { field: 6,title: 'Manufacturer\'s Model Serial Code', state: 'V', value: pinf[6] },
          { field: 7,title: 'NMEA 2000 Certification Level', state: 'V', value: pinf[7] },
          { field: 8,title: 'Load Equivalency', state: 'V', value: pinf[8] },
        ],
      };
      return this.sendMsg(msg);
    }
    return false;
  };

  // Sends Configuration Information message
  #send126998() {
    if (this.#addrMngr.state == 'Valid') {
      let msg = {
        key: 'nmea2000/126998/-/-/-/-/-',
        header: { pgn: 126998, src: this.#addrMngr.address, dst: 0xFF },
        fields: [
          { field: 1,title: 'Installation Description, Field 1', state: 'V', value: 'PUMA' },
          { field: 2,title: 'Installation Description, Field 2', state: 'V', value: '' },
          { field: 3,title: 'Manufacturer Information, Field 3', state: 'V', value: 'Puma' },
        ],
      };
      return this.sendMsg(msg);
    }
    return false;
  };
  
  // Sends ISO Acknowledgement message
  #send059392(ctr, grp, pgn, dst) {
    if (this.#addrMngr.state == 'Valid') {
      let msg = {
        key: 'nmea2000/059392/-/-/-/-/-',
        header: { pgn: 59392, src: this.#addrMngr.address, dst: dst },
        fields: [
          { field: 1,title: 'Control Byte', state: 'V', value: ctr },
          { field: 2,title: 'Group Function Value', state: 'V', value: grp },
          { field: 3,title: 'NMEA Reserved', state: 'V', value: 0xFFFFFF },
          { field: 4,title: 'PGN of Requested Information', state: 'V', value: pgn },
        ],
      };
      return this.sendMsg(msg);
    }
    return false;
  };

  // Sends Proprietary SF Config Command message
  send065445(ctr, grp, pgn, dst) {
    if (this.#addrMngr.state == 'Valid') {
      let msg = {
        key: 'nmea2000/065445/-/-/-/-/-',
        header: { pgn: 59392, src: this.#addrMngr.address, dst: dst },
        fields: [
          { field: 1,title: 'Control Byte', state: 'V', value: ctr },
          { field: 2,title: 'Group Function Value', state: 'V', value: grp },
          { field: 3,title: 'NMEA Reserved', state: 'V', value: 0xFFFFFF },
          { field: 4,title: 'PGN of Requested Information', state: 'V', value: pgn },
        ],
      };
      return this.sendMsg(msg);
    }
    return false;
  };

  // Sends Heartbeat message
  #send126993() {
    if (this.#addrMngr.state == 'Valid') {
      let msg = {
      key: 'nmea2000/126993/-/-/-/-/-',
        header: { pgn: 126993, src: this.#addrMngr.address, dst: 0xFF },
        fields: [
          { field: 1,title: 'Update Rate', state: 'V', value: 60 },
          { field: 2,title: 'Heartbeat Sequence Counter', state: 'V', value: this.#heartbeat.sequence },
          { field: 3,title: 'Class 1 CAN Controller State', state: 'V', value: this.#heartbeat.can1State },
          { field: 4,title: 'Class 2 Second CAN Controller State', state: 'V', value: this.#heartbeat.can1State },
          { field: 5,title: 'Equipment Status', state: 'V', value: this.#heartbeat.equState },
          { field: 6,title: 'NMEA Reserved', state: 'V', value: 0x3FFFFFFFF },
        ],
      };
      this.#heartbeat.sequence++;
      this.#heartbeat.sequence %= 252;
      return this.sendMsg(msg);
    }
    return false;
  };

  // Sends Fluid Sender Control message
  send130825(fluid, inst, code, data1, data2) {
    if (this.#addrMngr.state == 'Valid') {
      let msg = {
        key: 'nmea2000/130825/' + code + '/161/4/-/-',
        header: { pgn: 130825, src: this.#addrMngr.address, dst: 0xFF },
        fields: [
          { field: 1,title: 'Manufacturer Code', state: 'V', value: this.#addrMngr.name[2] },
          { field: 2,title: 'Reserved', state: 'V', value: 0b11 },
          { field: 3,title: 'Industry Group', state: 'V', value: this.#addrMngr.name[9] },
          { field: 4,title: 'Fluid Type', state: 'V', value: fluid },
          { field: 5,title: 'Instance', state: 'V', value: inst },
          { field: 6,title: 'Data ID', state: 'V', value: code },
        ],
      };
      if (typeof data1 !== 'undefined') {
        msg.fields.push({ field: 7,title: 'Data1', state: 'V', value: data1 })
      }
      if (typeof data2 !== 'undefined') {
        msg.fields.push({ field: 8,title: 'Data2', state: 'V', value: data2 })
      }
      return this.sendMsg(msg);
    }
    return false;
  };
};

module.exports = NMEAEngine;
