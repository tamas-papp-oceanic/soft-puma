const { ipcRenderer } = require('electron')
const { can } = require('github.com/brutella/can');

let port;
let active = false;

ipcRenderer.on('can-worker', (evt) => {
  port = evt.ports[0];
  port.onmessage = (evt) => {
    switch (evt.data) {
      case 'can-start':

console.log("START")

      active = true;
        canRead("can0");
        break;
      case 'can-stop':

console.log("STOP")

        active = false;
        break;
      default:
        const res = "data";
        port.postMessage(res);
        break;
    }
  }
});

function sleepFor(sleepDuration){
  var now = new Date().getTime();
  while(new Date().getTime() < now + sleepDuration){ 
      /* Do nothing */ 
  }
}

function delay() {
  return new Promise(resolve => setTimeout(resolve, 1));
}
async function delayPost(itm) {
  await delay();
  port.postMessage(itm);
}

async function canRead(dev) {
  // canData.forEach(async (itm) => {
  //   await delayPost(itm);
  // });
}
