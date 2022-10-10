const devnames = {
  'senders': {
    '3271': 'Volumetric Fuel Sender',
    '3281': 'Water Level Sender',
    '3420': 'AC Monitor',
  },
  'adaptors': {
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

export { devnames, getname };