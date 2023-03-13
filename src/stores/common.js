// const authURL = 'http://localhost:8080';
const authURL = 'http://192.168.16.52:8080';

const devnames = {
  'senders': {
    '3271': 'Volumetric Fuel Sender',
    '3281': 'Water Level Sender',
    '3420': 'AC Monitor',
    '3478': '8 Channel Relay Output Module',
    '4410': '16 Channel Switch Input Module',
  },
  'adaptors': {
    '3125': 'Tank Sender Adaptor',
    '4291': 'Tank Level Adaptor',
  },
  'displays': {
    '5185': 'Poseidon 7',
    '5185-H': 'Poseidon 7 (Honda)',
  }
};

function getname(cod) {
  for (const grp of Object.values(devnames)) {
    if (typeof grp[cod] !== 'undefined') {
      return grp[cod];
    }
  }
  return null;
};

module.exports = { authURL, devnames, getname };
