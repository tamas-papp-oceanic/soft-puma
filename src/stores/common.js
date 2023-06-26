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

export { getfield, setfield };
