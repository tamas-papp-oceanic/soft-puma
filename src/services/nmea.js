/* NMEA2000 messages

    key = nmea2000/{pgn}/{function}/{manufacturer}/{industry}/{instance}/{fluidtype}

    Single-frame Proprietary
      061184          - addressable
      065280 - 065535 - global

    Fast-packet Proprietary
      12720           - addressable
      130816 - 131071 - global

    Proprietary required fields:
      1. Manufacturer   11 bit
      2. Reserved        2 bit
      3. Industry Group  3 bit
 */ 
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { object_without_properties } = require('svelte/internal');

let nmeadefs = {};
let nmeaconv = {};
let fastbuff = {};

function init() {
  let nde = path.join(app.getAppPath(), 'src/config/nmeadefs.json');
  let nco = path.join(app.getAppPath(), 'src/config/nmeaconv.json');
  try {
    if (fs.existsSync(nde)) {
      nmeadefs = JSON.parse(fs.readFileSync(nde, 'utf8'));
    }
    if (fs.existsSync(nco)) {
      nmeaconv = JSON.parse(fs.readFileSync(nco, 'utf8'));
    }
  } catch(err) {
    console.log(err);
  }
};

function load(cfg) {
  let fil = path.join(app.getAppPath(), 'src/config/' + cfg + '.json');
  if (fs.existsSync(fil)) {
    return JSON.parse(fs.readFileSync(fil, 'utf8'));
  }
  return null;
};

function getPgn(frm) {
  let pgn = (frm.id & 0x1FFFF00) >> 8;
	if (((pgn >> 8) & 0xFF) < 0xF0)
	{
		pgn &= 0x1FF00;
	}
  return pgn.toString().padStart(6, '0');
};

function isSingle(frm) {
  let pgn = getPgn(frm);
  if ((pgn == "061184") || ((pgn >= "065280") && (pgn <= "065535"))) {
    return true;      
  } else if ((pgn.pgn == "126720") || ((pgn.pgn >= "130816") && (pgn.pgn <= "131071"))) {
    return false;
  }
  for (const [key, val] of Object.entries(nmeadefs)) {
    let tmp = "nmea2000/" + pgn;
    if (key.startsWith(tmp)) {
      return val.single;
    }
  }
  return true;
};

function calcLenght(typ, val) {
  let len = null;
  if (typ.startsWith('bit(')) {
    len = parseInt(typ.replace('bit(', '').replace(')', ''));
  } else if (typ.startsWith('chr(')) {
    let tmp = typ.replace('chr(', '').replace(')', '');
    if (tmp != 'x') {
      len = parseInt(tmp);
    } else {
      len = val + 1;
    }
  } else if (typ == 'str') {
    len = val;
  } else if (typ.startsWith('int')) {
    len = parseInt(typ.replace('int', ''));
  } else if (typ.startsWith('uint')) {
    len = parseInt(typ.replace('uint', ''));
  } else if (typ.startsWith('float')) {
    len = parseInt(typ.replace('float', ''));
  }
  return len;
}

function findPgn(frm) {
  let pgn = getPgn(frm);
  let key = "nmea2000/" + pgn;
  let cnv = nmeaconv[key];
  if (typeof cnv !== "undefined") {
    if (typeof cnv.function !== "undefined") {
      key += "/" + frm.data[cnv.function];
    } else {
      key += "/-";
    }
    if ((pgn == "061184") || ((pgn >= "065280") && (pgn <= "065535")) || 
      (pgn == "126720") || ((pgn >= "130816") && (pgn <= "131071"))) {
      let val = (parseInt(frm.data[1]) * 256) + parseInt(frm.data[0])
      key += "/" + (val & 0x7FF) + "/" + ((val >> 13) & 7);
    } else {
      key += "/-/-";
    }
  } else {
    key += "/-/-/-";
  }
  if (typeof nmeadefs[key] !== "undefined") {
    let out = JSON.parse(JSON.stringify(nmeadefs[key]));
    out.key = key;
    return out;
  }    
  return null;
};


function unpack(frm) {
  key = frm.id.toString(16).padStart(8, '0');
  if (isSingle(frm)) {
    return frm;
  } else {
    let fap = {};
    let seq = parseInt(frm.data[0]) >> 5;
    let cnt = parseInt(frm.data[0]) & 0x1F;
    let min = 0;
    if (typeof fastbuff[key] === "undefined") {
      let len = parseInt(frm.data[1]);
      fap = {
        sequence: seq,
        counter: cnt,
        length: len,
        index: 0,
        start: Date.now(),
        timeout: 750,
        finished: false,
        corrupted: cnt != 0,
      };
      if (len > 0) {
        fap.data = Buffer.alloc(len);
      } else {
        fap.corrupted = true;
      }
      if (!fap.corrupted) {
        min = Math.min(6, len);
        let dat = Buffer.alloc(min);
        for (let i = 0; i < min; i++) {
          dat[i] = frm.data[i + 2];
        }
        dat.copy(fap.data);
      }
    } else {
      fap = fastbuff[key];
      min = Math.min(7, (fap.length - fap.index));
      if (!fap.corrupted &&  (seq != fap.sequence)) {
        fap.corrupted = true;
      }
      if (!fap.corrupted) {
        if (cnt != (fap.counter + 1)) {
          fap.corrupted = true;
        } else {
          fap.counter = cnt;
        }
      }
      if (!fap.corrupted && ((Date.now() - fap.start) > fap.timeout)) {
        fap.corrupted = true;
      }
      if (!fap.corrupted) {
        let dat = Buffer.alloc(min);
        for (let i = 0; i < min; i++) {
          dat[i] = frm.data[i + 1];
        }
        dat.copy(fap.data, fap.index);
      }
    }
    if (!fap.corrupted) {
      fap.index += min;
      fap.finished = (fap.index >= fap.length);
    }
    if (!fap.finished && !fap.corrupted) {
      fastbuff[key] = fap;
    } else {
      delete fastbuff[key];
    }
    if (!fap.corrupted) {
      if (fap.finished) {
        delete frm.data;
        frm.data = Buffer.alloc(fap.length);
        fap.data.copy(frm.data);
        return frm;
      }
    }
  }
  return null;
};

// Returns with field status
function setStatus(val, typ) {
  let sts = 'V';
  if (typ.startsWith('int')) {
    let bit = parseInt(typ.replace('int', ''));
    if (bit < 64) {
      if (val == (2 ** (bit - 1)) - 1) {
        sts = '-';
      } else if (val == (2 ** (bit - 1)) - 2) {
        sts = 'E';
      }
    } else {
      if (BigInt(val) == (2n ** BigInt(bit - 1)) - 1n) {
        sts = '-';
      } else if (BigInt(val) == (2n ** BigInt(bit - 1)) - 2n) {
        sts = 'E';
      }
    }
  } else if (typ.startsWith('uint')) {
    let bit = parseInt(typ.replace('uint', ''));
    if (bit < 64) {
      if (val == (2 ** bit) - 1) {
        sts = '-';
      } else if (val == (2 ** bit) - 2) {
        sts = 'E';
      }
    } else {
      if (BigInt(val) == (2n ** BigInt(bit)) - 1n) {
        sts = '-';
      } else if (BigInt(val) == (2n ** BigInt(bit)) - 2n) {
        sts = 'E';
      }
    }
  }
  return sts;
};

// Convert can frame to message
function decode(frm) {
  let msg = null;
  let def = findPgn(frm);
  if (def != null) {
    let raw = Buffer.alloc(4 + frm.data.length);
    let pgn = Buffer.from(frm.id.toString(16).padStart(8, '0'), "hex");
    pgn.copy(raw);
    frm.data.copy(raw, 4);
    msg = {
      key: def.key,
      title: def.title,
      fields: new Array(),
      raw: raw,
    }
    if (typeof def.repeat !== "undefined") {
      let max = null;
      for (let i in def.repeat) {
        let ptr = 0;
        for (let j in def.fields) {
          let fld = def.fields[j];
          let len = 0;
          if (fld.field < def.repeat[i].field) {
            if (fld.field > max) {
              max = fld.field;
            }
            if ((fld.type == 'chr(x)') || (fld.type == 'str')) {
              len = calcLenght(fld.type, frm.data.readUInt8(Math.floor(ptr / 8)));
            } else {
              len = calcLenght(fld.type);
            }
            if (len != null) {
              ptr += len;
            }
          } else {
            def.repeat[i].value = frm.data.readUInt8(Math.floor(ptr / 8));
            max = fld.field;
            break;
          }
        }
      }
      let tmp = new Array();
      for (let i in def.fields) {
        let fld = def.fields[i];
        if (fld.field <= max) {
          tmp.push(fld);
        }
      }
      for (let i in def.repeat) {
        let rep = def.repeat[i];
        if ((rep.value > 0) && (rep.value <= 252)) {
          for (let j = 0; j < rep.value; j++) {
            for (let k in def.fields) {
              let fld = def.fields[k];
              if ((fld.field >= rep.start) && (fld.field < (rep.start + rep.count))) {
                fld.field = ++max;
                tmp.push(fld);
              }
            }
          }
        }
      }
      delete def.repeat;
      delete def.fields;
      def.fields = tmp;
    }
    let ins = null;
    let typ = null;
    let ptr = 0;
    let val = null;
    for (let i in def.fields) {
      try {
        let fld = def.fields[i];
        let byt = Math.floor(ptr / 8);
        let len = 0;
        if ((fld.type == 'chr(x)') || (fld.type == 'str')) {
          len = calcLenght(fld.type, frm.data.readUInt8(byt));
        } else {
          len = calcLenght(fld.type);
        }
        if ((len != null) && (len > 0) && (frm.data.length >= (byt + Math.ceil(len / 8)))) {
          fld.state = 'V';
          if (fld.type.startsWith('bit(')) {
            let cnt = Math.ceil(len / 8);
            let buf = Buffer.alloc(8);
            frm.data.copy(buf, 0, byt, byt + cnt);
            let dat = buf.readBigUInt64LE(0);
            let msk = BigInt((1 << len) - 1)
            let off = BigInt(ptr - (byt * 8));
            val = parseInt(((dat >> off) & msk).toString());
            ptr += len;
          } else if (fld.type == 'chr(x)') {
            if (len > 0) {
              let buf = Buffer.alloc(len);
              frm.data.copy(buf, 0, byt + 1);
              val = buf.toString('utf8').replace(/[^\x01-\x7F]/g, "");
            }
            ptr += (len * 8);
          } else if (fld.type.startsWith('chr(')) {
            let buf = Buffer.alloc(len);
            frm.data.copy(buf, 0, byt);
            val = buf.toString('utf8').replace(/[^\x01-\x7F]/g, "");
            ptr += (len * 8);
          } else if (fld.type == 'str') {
            let asc = frm.data.readUInt8(byt + 1);
            if (len > 2) {
              let buf = Buffer.alloc(len - 2);
              frm.data.copy(buf, 0, byt + 2);
              val = buf.toString(asc == 0 ? 'utf8' : 'ucs2').replace(/[^\x01-\x7F]/g, "");
            }
            ptr += (len * 8);
          } else {
            switch (fld.type) {
              case "int8":
                val = frm.data.readInt8(byt);
                break;
              case "uint8":
                val = frm.data.readUInt8(byt);
                break;
              case "int16":
                val = frm.data.readInt16LE(byt);
                break;
              case "uint16":
                val = frm.data.readUInt16LE(byt);
                break;
              case "int24":
                val = frm.data.readIntLE(byt, 3);
                break;
              case "uint24":
                val = frm.data.readUIntLE(byt, 3);
                break;
              case "int32":
                val = frm.data.readInt32LE(byt);
                break;
              case "uint32":
                val = frm.data.readUInt32LE(byt);
                break;
              case "float32":
                val = frm.data.readFloatLE(byt);
                break;
              case "int48":
                val = frm.data.readIntLE(byt, 6);
                break;
              case "uint48":
                val = frm.data.readUIntLE(byt, 6);
                break;
              case "int64":
                val = frm.data.readBigInt64LE(byt);
                break;
              case "uint64":
                val = frm.data.readBigUInt64LE(byt);
                break;
              case "float64":
                val = frm.data.readDoubleLE(byt);
                break;
            }
            fld.state = setStatus(val, fld.type);
            if (fld.multiplier != null) {
              if (typeof val == 'bigint') {
                if (fld.multiplier >= 1) {
                  let mul = fld.multiplier;
                  val *= BigInt(fld.multiplier);
                } else {
                  val /= BigInt(1 / fld.multiplier);
                }
              } else {
                val *= fld.multiplier;
              }
            }
            ptr += len;
          }
          fld.value = val;
          delete fld.multiplier;
          if (typeof fld.instance !== "undefined") {
            ins = val;
            delete fld.instance;
          }
          if (msg.key.startsWith("nmea2000/127505") && (fld.field == 2)) {
            typ = val;
          }
          msg.fields.push(fld);
        }
      } catch (err) {
        console.log("ERROR", pgn, frm, def, err)
      }
    }
    if (ins != null) {
      msg.key += "/" + ins;
    } else {
      msg.key += "/-";
    }
    if (typ != null) {
      msg.key += "/" + typ;
    } else {
      msg.key += "/-";
    }
  }
  return msg;
};

// func ExtendPgnDefDecode(def message.PgnDef, raw []byte) message.PgnDef {
// 	switch def.Pgn {
// 	case "126208":
// 		if len(raw) > 5 {
// 			val, err := n2000util.BytesToUint64([]byte{raw[1], raw[2], raw[3]}, "uint24", util.ByteOrder)
// 			if err == nil {
// 				pgn := int(val)
// 				def1 := def
// 				def1.Fields = def1.Fields[:5]
// 				def2, err := GetPgnDefinition(uint32(pgn), &raw)
// 				if err == nil {
// 					rep := 0
// 					ptr := 0
// 					switch def.Function {
// 					case "0", "1":
// 						if def.Function == "0" {
// 							rep = int(raw[10])
// 							ptr = 11
// 						} else if def.Function == "1" {
// 							rep = int(raw[5])
// 							ptr = 6
// 						}
// 						for i := 0; i < rep; i++ {
// 							f := def.Fields[5]
// 							f.Field = uint16((i * 2) + 6)
// 							if strings.Index(f.Description, " '1'") != -1 {
// 								f.Description = f.Description[:strings.Index(f.Description, " '")]
// 							}
// 							if strings.Index(f.Description, "'1'") != -1 {
// 								f.Description = f.Description[:strings.Index(f.Description, "'")]
// 							}
// 							if strings.Index(f.Description, " \"") != -1 {
// 								f.Description = f.Description[:strings.Index(f.Description, " \"")]
// 							}
// 							f.Description += " \"" + strconv.Itoa(i+1) + "\""
// 							def1.Fields = append(def1.Fields, f)
// 							fld := raw[ptr]
// 							ptr++
// 							f = def2.Fields[fld-1]
// 							f.Field = uint16((i * 2) + 7)
// 							def1.Fields = append(def1.Fields, f)
// 							ptr += f.BitSize / 8
// 						}
// 						n2000util.ReGroup(&def1)
// 						return def1
// 					}
// 				}
// 			}
// 		}
// 	case "126464":
// 		if len(raw) > 1 {
// 			def1 := def
// 			def1.Fields = def1.Fields[:1]
// 			rep := 0
// 			switch def.Function {
// 			case "0", "1":
// 				rep = (len(raw) - 1) / 3
// 				for i := 0; i < rep; i++ {
// 					f := def.Fields[1]
// 					f.Field = uint16(i + 2)
// 					if strings.Index(f.Description, " '1'") != -1 {
// 						f.Description = f.Description[:strings.Index(f.Description, " '")]
// 					}
// 					if strings.Index(f.Description, "'1'") != -1 {
// 						f.Description = f.Description[:strings.Index(f.Description, "'")]
// 					}
// 					if strings.Index(f.Description, " \"") != -1 {
// 						f.Description = f.Description[:strings.Index(f.Description, " \"")]
// 					}
// 					f.Description += " \"" + strconv.Itoa(i+1) + "\""
// 					def1.Fields = append(def1.Fields, f)
// 				}
// 				n2000util.ReGroup(&def1)
// 				return def1
// 			}
// 		}
// 	default:
// 		if (def.RepeatField != 0) && (def.StartField != 0) && (def.FieldCount != 0) {
// 			bitCount := 0
// 			for i := 0; i < def.RepeatField-1; i++ {
// 				bitCount += def.Fields[i].BitSize
// 			}
// 			fld := bitCount / 8
// 			typ := def.Fields[def.RepeatField-1].Type
// 			siz := def.Fields[def.RepeatField-1].BitSize / 8
// 			rep := 0
// 			if len(raw) > fld+(siz-1) {
// 				val, err := n2000util.BytesToUint64(raw[fld:fld+siz], typ, util.ByteOrder)
// 				if err == nil {
// 					rep = int(val)
// 				}
// 			}
// 			if rep != 0 {
// 				def = addFields(def, def.StartField, def.FieldCount, rep)
// 				n2000util.ReGroup(&def)
// 			}
// 		}
// 	}
// 	return def
// }

// // ExtendPgnDefEncode - Extends field definitions
// func ExtendPgnDefEncode(def message.PgnDef, fields []message.Field) message.PgnDef {
// 	switch def.Pgn {
// 	case "126208":
// 		chk := true
// 		for i := 0; i < len(fields); i++ {
// 			if fields[i].Field != uint16(i+1) {
// 				chk = false
// 				break
// 			}
// 		}
// 		if (len(fields) > 4) && chk {
// 			if pgn, ok := n2000util.CastField(fields[1]).(float64); ok {
// 				def1 := def
// 				def1.Fields = def1.Fields[:5]
// 				def2, err := GetPgnDefinition(uint32(pgn), &[]byte{0, 0, 0, 0, 0})
// 				if err == nil {
// 					switch def.Function {
// 					case "0", "1":
// 						if rep, ok := n2000util.CastField(fields[4]).(float64); ok {
// 							for i := 0; i < int(rep); i++ {
// 								if fields[(i*2)+5].Field == uint16((i*2)+6) {
// 									if fld, ok := n2000util.CastField(fields[(i*2)+5]).(float64); ok {
// 										f := def.Fields[5]
// 										f.Field = uint16((i * 2) + 6)
// 										def1.Fields = append(def1.Fields, f)
// 										f = def2.Fields[uint8(fld)-1]
// 										f.Field = uint16((i * 2) + 7)
// 										def1.Fields = append(def1.Fields, f)
// 									}
// 								}
// 							}
// 							n2000util.ReGroup(&def1)
// 						}
// 						return def1
// 					}
// 				}
// 			}
// 		}
// 	case "126464":
// 		chk := true
// 		for i := 0; i < len(fields); i++ {
// 			if fields[i].Field != uint16(i+1) {
// 				chk = false
// 				break
// 			}
// 		}
// 		if (len(fields) > 2) && chk {
// 			rep := len(fields) - 1
// 			def = addFields(def, 2, 1, rep)
// 			n2000util.ReGroup(&def)
// 		}
// 	default:
// 		if (def.RepeatField != 0) && (def.StartField != 0) && (def.FieldCount != 0) {
// 			chk := true
// 			for i := 0; i < len(fields); i++ {
// 				if fields[i].Field != uint16(i+1) {
// 					chk = false
// 					break
// 				}
// 			}
// 			if (len(fields) >= def.StartField+def.FieldCount-1) && chk {
// 				if fields[def.RepeatField-1].Field == uint16(def.RepeatField) {
// 					if rep, ok := n2000util.CastField(fields[def.RepeatField-1]).(float64); ok {
// 						if int(rep) != 0 {
// 							def = addFields(def, def.StartField, def.FieldCount, int(rep))
// 							n2000util.ReGroup(&def)
// 						}
// 					}
// 				}
// 			}
// 		}
// 	}
// 	return def
// }

// NMEA data processing function
function process(frm) {
  let tmp = unpack(frm);
  if (tmp != null) {
    let msg = decode(tmp);
    if (msg != null) {
      return msg;
    }
  }
  return null;
}

module.exports = {
  init,
  load,
  process,
};
