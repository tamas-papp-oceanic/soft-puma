const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// key = nmea2000/{pgn}/{function}/{manufacturer}/{industry}

function create() {
  let n20 = path.join(app.getAppPath(), 'src/config/nmea2000.json');
  let p20 = path.join(app.getAppPath(), 'src/config/prop2000.json');
  let nde = path.join(app.getAppPath(), 'src/config/nmeadefs.json');
  let nco = path.join(app.getAppPath(), 'src/config/nmeaconv.json');
  try {
    let ls1 = new Array();
    let ls2 = new Array();
    let out = {};
    if (fs.existsSync(n20)) {
      ls1 = JSON.parse(fs.readFileSync(n20, 'utf8'));
    }
    if (fs.existsSync(p20)) {
      ls2 = JSON.parse(fs.readFileSync(p20, 'utf8'));
    }
    let lst = ls1.concat(ls2);
    let key = "";
    for (let i in lst) {
      let pgn = lst[i];
      key = "nmea2000/" + pgn.pgn;
      let obj = {
        title: pgn.description,
        single: pgn.singleFrame,
        priority: pgn.priority,
        interval: pgn.interval,
        fields: [],
      };
      for (let j in pgn.fields) {
        let fld = pgn.fields[j];
        let typ = fld.type;
        switch (fld.type) {
          case "bit(n)":
          case "bit0(n)":
            if (fld.bitSize != null) {
              typ = "bit(" + fld.bitSize + ")";
            } else if (fld.resSize != null) {
              typ = "bit(" + fld.resSize + ")";
            }
            break;
          case "ch8or16(n)":
            typ = "str";
            break;
          case "char8(n)":
            typ = "chr(" + fld.charSize + ")";
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
        };
        if (typeof fld.instance !== "undefined") {
          tmp.instance = true;
        }
        obj.fields.push(tmp);
      }
      if (pgn.function != null) {
        key += "/" + pgn.function;
      } else {
        key += "/-"
      }
      if ((pgn.pgn == "061184") || ((pgn.pgn >= "065280") && (pgn.pgn <= "065535")) ||
        (pgn.pgn == "126720") || ((pgn.pgn >= "130816") && (pgn.pgn <= "131071"))) {
        key += "/" + pgn.manufacturer + "/" + pgn.industry; 
      } else {
        key += "/-/-"; 
      }
      out[key] = obj;
    }
    fs.writeFileSync(nde, JSON.stringify(out, null, 2));
    delete out;
    out = {};
    out["nmea2000/060416"] = {
      function: 0,
    }
    out["nmea2000/126208"] = {
      function: 0,
    }
    out["nmea2000/126464"] = {
      function: 0,
    }
    out["nmea2000/126720"] = {
      function: 2,
    }
    fs.writeFileSync(nco, JSON.stringify(out, null, 2));
  } catch(err) {
    console.log(err);
  }
};

module.exports = {
  create,
};
