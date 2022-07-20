async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Detect device
async function scanDevice() {
  console.log("SCAN...");
}
// Wait for scan result
async function waitDevice() {
  await sleep(2000);
  console.log("DONE...");
}

async function doEthernetTest(){}

async function doTouchTest(){}

async function doBrightnessTest(){}

async function setSerialNumber(){}

module.exports = {
  scanDevice,
  waitDevice,
}
