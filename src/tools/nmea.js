const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// key = nmea2000/{pgn}/{function}/{manufacturer}/{industry}

function create() {
  let n20 = '/home/tamas/go/src/git/poseidon/kratos/default/nmea2000.json';
  let p21 = '/home/tamas/go/src/git/poseidon/kratos/default/prop2000.json';
  let p22 = '/home/tamas/go/src/git/poseidon/kratos/templates/nike/prop2000.json';
  let nde = path.join(app.getAppPath(), 'src/config/nmeadefs.json');
  let nco = path.join(app.getAppPath(), 'src/config/nmeaconv.json');
  try {
    let ls1 = new Array();
    let ls2 = new Array();
    let ls3 = new Array();
    let out = {};
    if (fs.existsSync(n20)) {
      ls1 = JSON.parse(fs.readFileSync(n20, 'utf8'));
    }
    if (fs.existsSync(p21)) {
      ls2 = JSON.parse(fs.readFileSync(p21, 'utf8'));
    }
    if (fs.existsSync(p22)) {
      ls3 = JSON.parse(fs.readFileSync(p22, 'utf8'));
    }
    let lst = ls1.concat(ls2).concat(ls3);
    let key = "";
    for (let i in lst) {
      let pgn = lst[i];
      key = "nmea2000/" + pgn.pgn;
      let obj = {
        title: pgn.description,
        single: pgn.singleFrame,
        priority: pgn.priority,
        interval: pgn.interval,
      };
      if (typeof pgn.repeatField !== 'undefined') {
        obj.repeat = [{
          field: pgn.repeatField,
          start: pgn.startField,
          count: pgn.fieldCount,
        }];
      } else if (typeof pgn.repeatField1 !== 'undefined') {
        obj.repeat = [{
          field: pgn.repeatField1,
          start: pgn.startField1,
          count: pgn.fieldCount1,
        }];
      }
      if (typeof pgn.repeatField2 !== 'undefined') {
        obj.repeat.push({
          field: pgn.repeatField2,
          start: pgn.startField2,
          count: pgn.fieldCount2,
        });
      }
      obj.fields = new Array();
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
          case "char8(x)":
            typ = "chr(x)";
            break;
        }
        let mul = null;
        if (fld.multiplier != null) {
          mul = fld.multiplier;
        }
        if (fld.divider != null) {
          mul = (mul != null ? mul : 1) / fld.divider;
        }
        let dic = null;
        switch (fld.dictionary) {
        case "DD001":
        case "DD002":
        case "DD003":
        case "DD056":
          dic = fld.dictionary;
        }
        let tmp = {
          field: fld.field,
          title: fld.description,
          type: typ,
          unit: fld.unit,
          multiplier: mul,
          dictionary: dic,
        };
        if (typeof fld.instance !== 'undefined') {
          tmp.instance = true;
        }
        if (typeof fld.group !== 'undefined') {
          tmp.fluid = true;
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
    out = {
      "nmea2000/060416": { function: 0, field: 0 },
      "nmea2000/065289": { function: 5, field: 5 },
      "nmea2000/126208": { function: 0, field: 0 },
      "nmea2000/126464": { function: 0, field: 0 },
      "nmea2000/126720": { function: 2, field: 3 },
      "nmea2000/130825": { function: 5, field: 5 },
      "nmea2000/131011": { function: 4, field: 5 },
    };
    fs.writeFileSync(nco, JSON.stringify(out, null, 2));
  } catch(err) {
    console.log(err);
  }
};

module.exports = {
  create,
};
