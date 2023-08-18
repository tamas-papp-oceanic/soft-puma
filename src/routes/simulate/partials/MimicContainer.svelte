<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column,
    DataTable, ToolbarContent, Toolbar } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add16";

  export let data;
  export let style;

  const dispatch = createEventDispatcher();

  const head1 = new Array(
    { key: 'device', value: 'Device', sort: false, width: '15%' },
    { key: 'title', value: 'Title', sort: false, width: '60%' },
    { key: 'image', value: 'Image', sort: false },
  );
  const head2 = new Array(
    { key: 'device', value: 'Device', sort: false, width: '15%' },
    { key: 'instance', value: 'Instance', sort: false },
    { key: 'title', value: 'Title', sort: false, width: '70%' },
  );
  let insts = new Array();
  let rows1 = new Array();
  let rows2 = new Array();
  let selectedRowIds = new Array();

  rows1.push({ id: 0, device: '3410', title: '3410 Relay Module', image: '<img src="images/3410.webp" alt="3410" />' });

  function addRow(e) {
    for (let i in selectedRowIds) {
      for (let j in rows1) {
        if (rows1[j].id == selectedRowIds[i]) {
          dispatch("addmimic", JSON.parse(JSON.stringify(rows1[j])));
          break;
        }
      }
    }
    selectedRowIds = new Array();
  };

  function cancel(e) {
    dispatch("cancel");
  };

  function setData(val) {
    let arr = new Array();
    if (val != null) {
      let dat = JSON.parse(JSON.stringify(val));
      for (let i in dat) {
        // let spl = splitKey(dat[i].key);
        // dat[i].pgn = spl.pgn;
        arr.push(dat[i]);
      }
    }
    rows2 = JSON.parse(JSON.stringify(arr));
    rows2.push({ id: 0, device: '3410', instance: 0, title: '3410 Relay Module'});
  };

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i, text: i.toString() });
  }

  $: data, setData(data);
</script>

<div class="mimcont" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row style="height: inherit;">
          <Column sm={13} md={13} lg={13} style="height: 100%; display:flex; flex-flow: column nowrap; align-items: flex-start; justify-content: space-between;">
            <Row style="height: 40%; width: 100%;">
              <Column style="height: 100%; display:flex; flex-flow: column nowrap; align-items: flex-start; justify-content: flex-start;">
                <DataTable
                  class="devtab"
                  size="compact"
                  selectable
                  headers={head1}
                  rows={rows1}
                  bind:selectedRowIds>
                  <Toolbar>
                    <ToolbarContent>
                      <Tile class="head">
                        <h4 class="title">Device(s) to mimic.</h4>
                        <p class="descr">(select device for add to mimics)</p>
                      </Tile>
                    </ToolbarContent>
                  </Toolbar>
                </DataTable>
              </Column>
            </Row>
            <Row style="height: 59%; width: 100%;">
              <Column style="height: 100%; display:flex; flex-flow: column nowrap; align-items: flex-start; justify-content: flex-start;">
                <DataTable
                  class="seltab"
                  size="compact"
                  headers={head2}
                  rows={rows2}>
                  <Toolbar>
                    <ToolbarContent>
                      <Tile class="head">
                        <h4 class="title">Active device(s) for mimic.</h4>
                        <p class="descr">(select device for change of parameter(s))</p>
                      </Tile>
                    </ToolbarContent>
                  </Toolbar>
                </DataTable>
              </Column>
            </Row>
          </Column>
          <Column sm={3} md={3} lg={3} style="display: flex; flex-flow: column nowrap; justify-content: space-between;">
            <Row>
              <Column>
                <Row>
                  <Column>Operation</Column>
                </Row>
                <Row padding>
                  <Column>
                    <div class="buttons">
                      <Button disabled={selectedRowIds.length == 0}  iconDescription="Add message(s)" icon={Add} on:click={addRow} />
                    </div>
                  </Column>
                </Row>
              </Column>
            </Row>
          </Column>
        </Row>
      </Grid>
    </div>
  </Tile>
  <ButtonSet style="justify-content: flex-end;">
    <Button kind="secondary" on:click={cancel}>Close</Button>
  </ButtonSet>
</div>

<style type="css" global>
  .mimcont {
    display: flex;
    flex-flow: column nowrap;
    justify-content: stretch;
    border: 1px solid gray;
    width: 100%;
    height: calc(100vh - 10rem);
  }
  .mimcont .tilecont {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    height: -webkit-fill-available
  }
  .mimcont .tilecont .left {
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;
    align-items: center;
    height: -webkit-fill-available
  }
  .mimcont .tilecont .head {
    padding: 0 !important;
    width: 100%;
    height: 3.25rem;
  }
  .mimcont .tilecont .title {
    font-size: 1.25rem;
  }
  .mimcont .tilecont .descr {
    font-size: 0.8rem;
    color: #c6c6c6;
  }
  .mimcont .tilecont .buttons {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: flex-start;
  }
  .mimcont .tilecont .buttons button {
    margin: 0.2rem;
  }
  .devtab {
    max-height: calc(100% - 3.5rem);
    overflow-x: hidden;
    overflow-y: auto;
  }
  .devtab th:first-child,
  .devtab td:first-child {
    width: 3rem;
  }
  .devtab td:nth-child(2) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .devtab .bx--form-item.bx--checkbox-wrapper {
    align-items: center;
  }
  .seltab {
    max-height: calc(100% - 3.5rem);
    overflow-x: hidden;
    overflow-y: auto;
  }
  .seltab th:nth-child(2),
  .seltab td:nth-child(2) {
    text-align: center;
  }
  .seltab td:nth-child(3) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .seltab .bx--form-item.bx--checkbox-wrapper {
    align-items: center;
  }
  .mimcont button[type="button"],
  .mimcont input[type="number"],
  .mimcont input[type="text"] {
    font-size: 1rem;
  }
  .mimcont .bx--dropdown__wrapper.bx--list-box__wrapper {
    width: 100%;
  }
  .mimcont input[type="number"] {
    padding-right: 5.5rem;
  }
  .mimcont .bx--form-item.bx--checkbox-wrapper:first-of-type {
    margin-top: 0;
  }
  .mimcont  .bx--checkbox:indeterminate+.bx--checkbox-label::before {
    background-color: rgba(0,0,0,0);
  }
  .mimcont  .bx--checkbox:indeterminate+.bx--checkbox-label::after {
    border-bottom: 2px solid gray;
  }
  .mimcont .tilecont .bhead {
    padding: 0 !important;
    width: 100%;
    font-size: 0.8rem;
    color: #c6c6c6;
  }
  .mimcont .bit {
    padding-right: 0.5rem;
  }
</style>
