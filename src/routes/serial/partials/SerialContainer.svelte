<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, DataTableSkeleton, 
    DataTable, TextInput } from "carbon-components-svelte";
  import Information from "carbon-icons-svelte/lib/Information24"
  import Upload from "carbon-icons-svelte/lib/Upload24"

  export let data;
  export let running;
  export let style;

  const dispatch = createEventDispatcher();
  
  const headers = new Array(
    { key: "title", value: "Parameter", width: "40%" },
    { key: "value", value: "Value" },
  );

  const trans = {
    uniqueNumber: { id: 0, title: "Unique Number" },
    modelVersion: { id: 1, title: "Model Version" },
    modelID: { id: 2, title: "Model ID" },
    softwareVersion: { id: 3, title: "Software Verison" },
    serialCode: { id: 4, title: "Serial Code" },
    productCode: { id: 5, title: "Product Code" },
    manufacturer: { id: 6, title: "Manufacturer" },
    class: { id: 7, title: "Device Class" },
    function: { id: 8, title: "Device Function" },
    industry: { id: 9, title: "Industry" },
    systemInstance: { id: 10, title: "System Instance" },
    deviceInstance: { id: 11, title: "Device Instance" },
    databaseVersion: { id: 12, title: "Database Version" },
    certification: { id: 13, title: "Cerification Level" },
    loadEquivalency: { id: 14, title: "Load Equivalency" },
  };
  
  String.prototype.isInteger = function() {
    return /^\d+$/.test(this);
  }

  let rows = new Array();
  let valid = false;

  function getproduct(e) {
    dispatch("getproduct", e);
  };

  function input(e) {
    valid = e.detail.isInteger();
  };

  function setserial(e) {
    let ser = document.getElementById('serial');
    data.serial = ser.value;
    dispatch("setserial", e);
  };

  function cancel(e) {
    dispatch("cancel", e);
  };

  function setData(dat) {
    let ser = document.getElementById('serial');
    if (ser !== null) {
      ser.value = "";
    }
    valid = false;
    let tmp = new Array();
    if (dat.hasOwnProperty("name")) {
      for (const [key, val] of Object.entries(dat.name)) {
        if (val !== null) {
          let res = val;
          if (key === "uniqueNumber") {
            if (ser !== null) {
              ser.value = val;
              valid = ser.value.isInteger();
            }
          } else if (dat.name.decoded.hasOwnProperty(key)) {
            res = dat.name.decoded[key] + " (" + val + ")";
          }
          if (trans.hasOwnProperty(key)) {
            tmp.push({ id: trans[key].id, param: key, title: trans[key].title, value: res });
          }
        }
      }
    }
    tmp.sort((a, b) => a.id - b.id);
    rows = JSON.parse(JSON.stringify(tmp));
  };

  $: data, setData(data);
</script>

<div class="container" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row>
          <Column><div class="title">Connect the (only) device to CAN network and press a button below.</div></Column>
        </Row>
        <Row style="height: inherit;">
          <Grid fullWidth noGutter>
            <Row style="height: inherit;">
              <Column></Column>
              <Column sm={11} md={11} lg={11}>
                  <Row padding>
                  <Column>Product Information</Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <DataTableSkeleton size="compact" showHeader={false} showToolbar={false} {headers} rows={15} />
                    {:else}
                      <DataTable
                        size="compact"
                        {headers}
                        {rows}>
                        <span slot="cell" let:cell let:row>{cell.value}</span>
                      </DataTable>
                    {/if}
                  </Column>
                </Row>
              </Column>
              <Column></Column>
              <Column>
                <Row padding>
                  <Column>
                    <Button disabled={running} icon={Information} on:click={(e) => getproduct(e)} style="width: inherit;">Get product info</Button>
                  </Column>
                </Row>
                <Row>
                  <Column>
                    <TextInput disabled={running} id="serial" size="sm" labelText="Serial number" on:input={(e) => input(e)}/>
                  </Column>
                </Row>
                <Row padding>
                  <Column>
                    <Button disabled={running || !valid} icon={Upload} on:click={(e) => setserial(e)} style="width: inherit;">Set serial number</Button>
                  </Column>
                </Row>
              </Column>
              <Column></Column>
            </Row>
          </Grid>
        </Row>
      </Grid>
    </div>
  </Tile>
  <ButtonSet style="justify-content: flex-end;">
    <Button kind="secondary" on:click={(e) => cancel(e)}>Close</Button>
  </ButtonSet>
</div>

<style>
  .container {
    display: flex;
    flex-flow: column nowrap;
    justify-content: stretch;
    border: 1px solid gray;
    width: 100%;
  }
  .container .tilecont {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    height: 100%;
  }
  .container .tilecont .title {
    max-width: 90%;
    white-space: pre-line;
    font-size: 1.25rem;
    text-align: justify;
    margin-bottom: 1rem;
  }
</style>
