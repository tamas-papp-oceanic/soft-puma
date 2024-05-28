const devices = {
  '3125':      { id: 0x0B, conf: true,  fluid: true,  prog: true,  test: false, group: 'adaptors', title: 'Tank Sender Adaptor' },
  '3130':      { id: 0x17, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', title: 'Fuel Sender to Resistive Output Adaptor' },
  '3155':      { id: 0x36, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', title: 'NMEA2000 Modbus Gateway' },
  '3155-ATC':  { id: 0x10, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', title: 'Tank Level Modbus Master (ATC)' },
  '3155-MCS':  { id: 0x11, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', title: 'HVAC MODBUS Master (MCS)' },
  '3155-SCH':  { id: 0x12, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', title: 'AC MODBUS Master (Schneider)' },
  '3165':      { id: 0x19, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', title: 'Rudder Angle Adaptor' },
  '3185':      { id: 0x0C, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', title: 'J1939 to NMEA2000 Adaptor' },
  '3271':      { id: 0x1C, conf: true,  fluid: true,  prog: true,  test: false, group: 'sensors',  title: 'Volumetric Fuel Sender' },
  '3271-SAM2': { id: 0x1C, conf: false, fluid: false, prog: true,  test: false, group: 'modules',  title: 'SAM2 Sender Averaging Module' },
  '3281':      { id: 0x03, conf: true,  fluid: true,  prog: true,  test: false, group: 'sensors',  title: 'Water Sender' },
  '3350-B':    { id: 0x35, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', title: 'Black Water Level Panel Gauge' },
  '3350-F':    { id: 0x35, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', title: 'Fuel Level Panel Gauge' },
  '3350-W':    { id: 0x35, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', title: 'Fresh Water Level Panel Gauge' },
  '3350-HTPO': { id: 0x35, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', title: 'Holding Tank Pump Out Controller' },
  '3350-GTPO': { id: 0x35, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', title: 'Grey Tank Pump Out Controller' },
  '3350-FTC':  { id: 0x35, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', title: 'Fuel Transfer Controller' },
  '3410':      { id: 0x0D, conf: true,  fluid: false, prog: false, test: false, group: 'sensors',  title: 'DC Monitor' },
  '3420':      { id: 0x08, conf: true,  fluid: false, prog: true,  test: false, group: 'sensors',  title: 'AC Monitor' },
  '3478':      { id: 0x05, conf: false, fluid: false, prog: true,  test: true,  group: 'modules',  title: '8 Channel Relay Output Module' },
  '3501':      { id: 0x33, conf: true,  fluid: true,  prog: true,  test: false, group: 'adaptors', title: 'Tank Volume Computer' },
  '4272':      { id: 0x0A, conf: false, fluid: false, prog: false, test: false, group: 'sensors',  title: 'Hydrostatic Tank Level Sender' },
  '4291':      { id: 0x0F, conf: true,  fluid: true,  prog: true,  test: false, group: 'adaptors', title: '4-20mA Tank level Adaptor' },
  '4410':      { id: 0x18, conf: false, fluid: false, prog: true,  test: true,  group: 'modules',  title: '16 Channel Switch Input Module' },
  '4510':      { id: 0x04, conf: true,  fluid: false, prog: false, test: false, group: 'sensors',  title: 'EGT Sender' },
  '4521':      { id: 0x06, conf: true,  fluid: false, prog: false, test: false, group: 'modules',  title: '4 Channel Temperature Module' },
  '4601':      { id: 0x09, conf: true,  fluid: false, prog: true,  test: false, group: 'modules',  title: '4-20mA Pressure Adaptor' },
  '4530':      { id: 0x0E, conf: false, fluid: false, prog: false, test: false, group: 'modules',  title: 'Cabin Temperature & Humidity Module' },
  '4900':      { id: 0x14, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', title: 'AC Input Module' },
  '5250-F':    { id: 0x34, conf: false, fluid: true,  prog: true,  test: false, group: 'adaptors', title: 'Deck Gauge (Fuel)' },
  '5250-W':    { id: 0x34, conf: false, fluid: true,  prog: true,  test: false, group: 'adaptors', title: 'Deck Gauge (Water)' },
  '5720':      { id: 0x16, conf: true,  fluid: false, prog: true,  test: false, group: 'adaptors', title: 'Fluid Flow Adaptor', address: 0x08004000 },
  '5906':      { id: 0x18, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', title: '6 Channel Load Controller' },
  '5985':      { id: 0x1A, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', title: 'CAN to DMX512 Convertor' },
  '5985-TST':  { id: 0x1B, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', title: 'CAN to DMX512 Convertor Testing' },
  '9101':      { id: 0x15, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', title: 'Seatek Engine Adapter' },
  'iDac':      { id: 0x13, conf: false, fluid: false, prog: false, test: false, group: 'displays', title: 'iDac' },
  '5185':      { id: 0x00, conf: false, fluid: false, prog: false, test: true,  group: 'displays', title: 'Poseidon 7' },
  '5185-H':    { id: 0x00, conf: false, fluid: false, prog: false, test: true,  group: 'displays', title: 'Poseidon 7 (Honda)' },
};

function getdev(cod) {
  if (devices.hasOwnProperty(cod)) {
    return devices[cod];
  }
  return null;
};

function getname(cod) {
  if (devices.hasOwnProperty(cod)) {
    return devices[cod].title;
  }
  return null;
};

function getfunc(fun) {
  let res = {};
  for (const [key, val] of Object.entries(devices)) {
    if (!res.hasOwnProperty(val.group)) {
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
  if (devices.hasOwnProperty(cod)) {
    if (devices[cod].hasOwnProperty("address")) {
      return devices[cod].address;
    }
    return 0x0800A000;
  }
  return null;
}

export { getdev, getname, getfunc, getaddr };
