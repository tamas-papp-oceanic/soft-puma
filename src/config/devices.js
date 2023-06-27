const devices = {
  '3125':      { id: 0x0B, conf: true,  prog: true,  address: null,       test: false, group: 'adaptors', title: 'Tank Sender Adaptor' },
  '3130':      { id: 0x17, conf: false, prog: true,  address: null,       test: false, group: 'adaptors', title: 'Fuel Sender to Resistive Output Adaptor' },
  '3155-ATC':  { id: 0x10, conf: false, prog: false, address: null,       test: false, group: 'adaptors', title: '3155_ATC Tank Level Modbus Master (ATC)' },
  '3155-MCS':  { id: 0x11, conf: false, prog: false, address: null,       test: false, group: 'adaptors', title: 'MCS HVAC MODBUS Master (MCS)' },
  '3155-SCH':  { id: 0x12, conf: false, prog: false, address: null,       test: false, group: 'adaptors', title: 'SCH AC MODBUS Master (Schneider)' },
  '3165':      { id: 0x19, conf: false, prog: true,  address: null,       test: false, group: 'adaptors', title: 'Rudder Angle Adapter' },
  '3185':      { id: 0x0C, conf: false, prog: false, address: null,       test: false, group: 'adaptors', title: 'J1939 to NMEA2000 Adaptor' },
  '3271':      { id: 0x1C, conf: true,  prog: true,  address: null,       test: false, group: 'sensors',  title: 'Volumetric Fuel Sender' },
  '3271-SAM2': { id: 0x1C, conf: false, prog: true,  address: null,       test: false, group: 'modules',  title: 'SAM2 Sender Averaging Module' },
  '3281':      { id: 0x03, conf: true,  prog: true,  address: null,       test: false, group: 'sensors',  title: 'Water Sender' },
  '3410':      { id: 0x0D, conf: true,  prog: false, address: null,       test: false, group: 'sensors',  title: 'DC Monitor' },
  '3420':      { id: 0x08, conf: true,  prog: true,  address: null,       test: false, group: 'sensors',  title: 'AC Monitor' },
  '3478':      { id: 0x05, conf: false, prog: true,  address: null,       test: true,  group: 'modules',  title: '8 Channel Relay Output Module' },
  '4272':      { id: 0x0A, conf: false, prog: false, address: null,       test: false, group: 'sensors',  title: 'Hydrostatic Tank Level Sender' },
  '4291':      { id: 0x0F, conf: true,  prog: true,  address: null,       test: false, group: 'adaptors', title: '4-20mA Tank level Adaptor' },
  '4410':      { id: 0x18, conf: false, prog: true,  address: null,       test: true,  group: 'modules',  title: '16 Channel Switch Input Module' },
  '4510':      { id: 0x04, conf: true,  prog: false, address: null,       test: false, group: 'sensors',  title: 'EGT Sender' },
  '4521':      { id: 0x06, conf: true,  prog: false, address: null,       test: false, group: 'modules',  title: '4 Channel Temperature Module' },
  '4601':      { id: 0x09, conf: true,  prog: false, address: null,       test: false, group: 'modules',  title: '4-20mA Fluid Pressure Module' },
  '4530':      { id: 0x0E, conf: false, prog: false, address: null,       test: false, group: 'modules',  title: 'Cabin Temperature & Humidity Module' },
  '4900':      { id: 0x14, conf: false, prog: false, address: null,       test: false, group: 'adaptors', title: 'AC Input Module' },
  '5720':      { id: 0x16, conf: true,  prog: true,  address: 0x08004000, test: false, group: 'adaptors', title: 'Fluid Flow Adapter' },
  '5906':      { id: 0x18, conf: false, prog: false, address: null,       test: false, group: 'adaptors', title: '6 Channel Load Controller' },
  '5985':      { id: 0x1A, conf: false, prog: true,  address: null,       test: false, group: 'adaptors', title: 'CAN to DMX512 Convertor' },
  '5985-TST':  { id: 0x1B, conf: false, prog: false, address: null,       test: false, group: 'adaptors', title: 'CAN to DMX512 Convertor Testing' },
  '9101':      { id: 0x15, conf: false, prog: false, address: null,       test: false, group: 'adaptors', title: 'Seatek Engine Adapter' },
  'iDac':      { id: 0x13, conf: false, prog: false, address: null,       test: false, group: 'displays', title: 'iDac' },
  '5185':      { id: 0x00, conf: false, prog: false, address: null,       test: true,  group: 'displays', title: 'Poseidon 7' },
  '5185-H':    { id: 0x00, conf: false, prog: false, address: null,       test: true,  group: 'displays', title: 'Poseidon 7 (Honda)' },
};

function getid(cod) {
  if (typeof devices[cod] !== 'undefined') {
    return devices[cod].id;
  }
  return null;
};

function getname(cod) {
  if (typeof devices[cod] !== 'undefined') {
    return devices[cod].title;
  }
  return null;
};

function getfunc(fun) {
  let res = {};
  for (const [key, val] of Object.entries(devices)) {
    if (typeof res[val.group] === 'undefined') {
      res[val.group] = new Array();
    }
    if (val[fun]) {
      res[val.group].push(key);
    }
  }
  for (const [key, val] of Object.entries(res)) {
    val.sort();
  }
  return res;
};

function getaddr(cod) {
  if (typeof devices[cod] !== 'undefined') {
    if (devices[cod].address != null) {
      return devices[cod].address;
    }
    return 0x0800A000;
  }
  return null;
}

export { getid, getname, getfunc, getaddr };
