// Returns with field
function getfield(fld, fls) {
  for (let i in fls) {
    if (fls[i].field == fld) {
      return JSON.parse(JSON.stringify(fls[i]));
    }
  }
  return null;
};

// Sets field
function setfield(fld, fls) {
  for (let i in fls) {
    if (fls[i].field == fld.field) {
      fls[i] = JSON.parse(JSON.stringify(fld));
      return;
    }
  }
};

// Returns true if proprietary PGN
function isproprietary(pgn) {
  if ((pgn == 61184) || ((pgn >= 65280) && (pgn <= 65535)) || 
    (pgn == 126720) || ((pgn >= 130816) && (pgn <= 131071))) {
    return true;
  }
  return false;
}

export { getfield, setfield, isproprietary };
