/* NMEA2000 messages

    key = nmea2000/{pgn}/{function}/{manufacturer}/{industry}

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
let cnt = 0;

// NMEA data processing function
function process(msg) {
  console.log(++cnt, msg);
}

module.exports = {
  process,
};
