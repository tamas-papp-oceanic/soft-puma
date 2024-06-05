const devices = {
  '3125':      { id: 0x0B, conf: true,  fluid: true,  prog: true,  test: false, group: 'adaptors', image: '3125.webp',      title: 'Tank Sender Adaptor' },
  '3130':      { id: 0x17, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', image: '3130.webp',      title: 'Fuel Sender to Resistive Output Adaptor' },
  '3155':      { id: 0x36, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', image: '3155.webp',      title: 'NMEA2000 Modbus Gateway' },
  '3155-ATC':  { id: 0x10, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', image: '3155.webp',      title: 'Tank Level Modbus Master (ATC)' },
  '3155-MCS':  { id: 0x11, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', image: '3155.webp',      title: 'HVAC MODBUS Master (MCS)' },
  '3155-SCH':  { id: 0x12, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', image: '3155.webp',      title: 'AC MODBUS Master (Schneider)' },
  '3165':      { id: 0x19, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', image: '3165.webp',      title: 'Rudder Angle Adaptor' },
  '3185':      { id: 0x0C, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', image: '3185.webp',      title: 'J1939 to NMEA2000 Adaptor' },
  '3271':      { id: 0x02, conf: true,  fluid: true,  prog: true,  test: false, group: 'sensors',  image: '3271.webp',      title: 'Fuel Volume / Level Sender' },
  '3271-SAM2': { id: 0x1C, conf: false, fluid: false, prog: true,  test: false, group: 'modules',  image: '3271-SAM2.webp', title: 'SAM2 Sender Averaging Module' },
  '3281':      { id: 0x03, conf: true,  fluid: true,  prog: true,  test: false, group: 'sensors',  image: '3281.webp',      title: 'Water Volume / Level Sender' },
  '3350-C':    { id: 0x35, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', image: '3350-C.webp',    title: 'Controller' },
  '3350-G':    { id: 0x35, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', image: '3350-G.webp',    title: 'Panel Gauge' },
  '3410':      { id: 0x0D, conf: true,  fluid: false, prog: false, test: false, group: 'modules',  image: '3410.webp',      title: 'DC Monitor' },
  '3420':      { id: 0x08, conf: true,  fluid: false, prog: true,  test: false, group: 'modules',  image: '3420.webp',      title: 'AC Monitor' },
  '3478':      { id: 0x05, conf: false, fluid: false, prog: true,  test: true,  group: 'modules',  image: '3478.webp',      title: '8 Channel Relay Output Module' },
  '3501':      { id: 0x33, conf: false, fluid: true,  prog: true,  test: false, group: 'adaptors', image: '3501.webp',      title: 'Tank Volume Computer' },
  '4272':      { id: 0x0A, conf: false, fluid: false, prog: false, test: false, group: 'sensors',  image: '4272.webp',      title: 'Hydrostatic Tank Level Sender' },
  '4291':      { id: 0x0F, conf: true,  fluid: true,  prog: true,  test: false, group: 'adaptors', image: '4291.webp',      title: '4-20mA Tank level Adaptor' },
  '4410':      { id: 0x18, conf: false, fluid: false, prog: true,  test: true,  group: 'modules',  image: '4410.webp',      title: '16 Channel Switch Input Module' },
  '4510':      { id: 0x04, conf: true,  fluid: false, prog: false, test: false, group: 'sensors',  image: '4510.webp',      title: 'EGT Sender' },
  '4521':      { id: 0x06, conf: true,  fluid: false, prog: false, test: false, group: 'modules',  image: '4521.webp',      title: '4 Channel Temperature Module' },
  '4601':      { id: 0x09, conf: true,  fluid: false, prog: true,  test: false, group: 'adaptors', image: '4601.webp',      title: '4-20mA Pressure Adaptor' },
  '4530':      { id: 0x0E, conf: false, fluid: false, prog: false, test: false, group: 'modules',  image: '4530.webp',      title: 'Cabin Temperature & Humidity Module' },
  '4900':      { id: 0x14, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', image: '4900.webp',      title: 'AC Input Module' },
  '5250':      { id: 0x34, conf: false, fluid: true,  prog: true,  test: false, group: 'adaptors', image: '5250.webp',      title: 'Deck Gauge' },
  '5720':      { id: 0x16, conf: true,  fluid: false, prog: true,  test: false, group: 'adaptors', image: '5720.webp',      title: 'Fluid Flow Adaptor', address: 0x08004000 },
  '5906':      { id: 0x18, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', image: '5906.webp',      title: '6 Channel Load Controller' },
  '5985':      { id: 0x1A, conf: false, fluid: false, prog: true,  test: false, group: 'adaptors', image: '5985.webp',      title: 'CAN to DMX512 Convertor' },
  // '5985-TST':  { id: 0x1B, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', image: '5985.webp',      title: 'CAN to DMX512 Convertor Testing' },
  '9101':      { id: 0x15, conf: false, fluid: false, prog: false, test: false, group: 'adaptors', image: '9101.webp',      title: 'Seatek Engine Adapter' },
  'iDac':      { id: 0x13, conf: false, fluid: false, prog: false, test: false, group: 'displays', image: 'iDac.webp',      title: 'iDac' },
  '5185':      { id: 0x00, conf: false, fluid: false, prog: false, test: true,  group: 'displays', image: '5185.webp',      title: 'Poseidon 7' },
  '5185-H':    { id: 0x00, conf: false, fluid: false, prog: false, test: true,  group: 'displays', image: '5185-H.webp',    title: 'Poseidon 7 (Honda)' },
};

const variants = {
  '3350-C': [
    { id: '0', text: 'Fuel Transfer' },
    { id: '1', text: 'Holding Tank Pump Out' },
    { id: '2', text: 'Grey Tank Pump Out' },
  ],
  '3350-G': [
    { id: '0', text: 'Fuel' },
    { id: '1', text: 'Fresh Water' },
    { id: '2', text: 'Black Water' },
  ],
  '3501': [
    { id: '0', text: 'Pearl 62' },
    { id: '1', text: 'Pearl 72' },
    { id: '2', text: 'Sunseeker 28 Yacht' },
    { id: '3', text: 'Sunseeker 30 Yacht' },
    { id: '4', text: 'Sunseeker 80 Yacht' },
    { id: '5', text: 'Sunseeker 84 Predator' },
    { id: '6', text: 'Sunseeker 84 Predator v2' },
    { id: '7', text: 'Sunseeker 84 Predator Hull 716' },
    { id: '8', text: 'Sunseeker 86 Yacht' },
    { id: '9', text: 'Sunseeker 86Y Yacht' },
    { id: '10', text: 'Sunseeker 88 Yacht' },
    { id: '11', text: 'Sunseeker 88 Yacht 7500L' },
    { id: '12', text: 'Sunseeker 88 Yacht 8500L' },
    { id: '13', text: 'Sunseeker 88Y Yacht v2' },
    { id: '14', text: 'Sunseeker 92 Predator' },
    { id: '15', text: 'Sunseeker 92 Predator Hull 5191092' },
    { id: '16', text: 'Sunseeker 101 Sport Yacht' },
  ],
  '5250': [
    { id: '0', text: 'Fuel' },
    { id: '1', text: 'Water' },
  ],
}

function getdev(cod) {
  if (devices.hasOwnProperty(cod)) {
    return devices[cod];
  }
  return null;
};

function getvars(cod) {
  if (variants.hasOwnProperty(cod)) {
    return variants[cod];
  }
  return new Array();
};

function getname(cod) {
  if (devices.hasOwnProperty(cod)) {
    return devices[cod].title;
  }
  return null;
};

function getimage(cod) {
  if (devices.hasOwnProperty(cod)) {
    return devices[cod].image;
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

export { getdev, getvars, getname, getimage, getfunc, getaddr };
