window.pumaAPI.onCan('can-port', (e, val) => {
  const [ port ] = e.ports;
  console.log("CAN", port);
  port.postMessage("CAN DATA");
});

window.pumaAPI.onCan('can-data', (e, val) => {
  console.log("CAN", val);
});

window.pumaAPI.sendCan('can-ready');

window.pumaAPI.onCan('ser-port', (e, val) => {
  const [ port ] = e.ports;
  console.log("SER", port);
  port.postMessage("SERIAL DATA");
});

window.pumaAPI.onSer('ser-data', (e, val) => {
  console.log("SER", val);
});

window.pumaAPI.sendSer('ser-ready');
