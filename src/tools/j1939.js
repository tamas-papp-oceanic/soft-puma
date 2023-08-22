const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// key = nmea2000/{pgn}

function create() {
  let j19 = '/home/tamas/go/src/git/poseidon/kratos/default/j1939.json';
  let jde = path.join(app.getAppPath(), 'src/config/j1939defs.json');
  try {
    let lst = new Array();
    let out = {};
    if (fs.existsSync(j19)) {
      lst = JSON.parse(fs.readFileSync(j19, 'utf8'));
    }
    let key = "";
    for (let i in lst) {
      let pgn = lst[i];
      key = "j1939/" + pgn.pgn;
      let obj = {
        title: pgn.description,
        single: pgn.singleFrame,
        priority: pgn.priority,
        interval: pgn.interval,
      };
      obj.fields = new Array();
      for (let j in pgn.fields) {
        let fld = pgn.fields[j];
        let typ = fld.type;
        switch (fld.type) {
          case "bit(n)":
            if (fld.bitSize != null) {
              typ = "bit(" + fld.bitSize + ")";
            } else if (fld.resSize != null) {
              typ = "bit(" + fld.resSize + ")";
            }
            break;
        }
        let mul = null;
        if (fld.multiplier != null) {
          mul = fld.multiplier;
        }
        if (fld.divider != null) {
          mul = (mul != null ? mul : 1) / fld.divider;
        }
        let tmp = {
          field: fld.field,
          title: fld.description,
          type: typ,
          unit: fld.unit,
          multiplier: mul,
          offset: fld.offset,
        };
        obj.fields.push(tmp);
      }
      out[key] = obj;
    }
    fs.writeFileSync(jde, JSON.stringify(out, null, 2));
  } catch(err) {
    console.log(err);
  }
};

module.exports = {
  create,
};
