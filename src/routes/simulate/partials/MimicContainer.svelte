<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column,
    DataTable, ToolbarContent, Toolbar } from "carbon-components-svelte";

  export let data;
  export let style;

  const dispatch = createEventDispatcher();
  const greyImage = "/images/circle-grey.png";
  const redImage = "/images/circle-red.png";
  const greenImage = "/images/circle-green.png";
  const yellowImage = "/images/circle-yellow.png";

  const head = new Array(
    { key: 'device', value: 'Device', sort: false, width: '5%' },
    { key: 'instance', value: 'Instance', sort: false, width: '10%' },
    { key: 'title', value: 'Title', sort: false, width: '30%' },
    { key: 'status', value: 'Status', sort: false },
  );
  let rows = new Array();

  function cancel(e) {
    dispatch("cancel");
  };

  function setData(val) {
    let arr = new Array();
    if (val != null) {
      let dat = JSON.parse(JSON.stringify(val));
      for (let i in dat) {
        arr.push(dat[i]);
      }
    }
    rows = JSON.parse(JSON.stringify(arr));
  };

  $: data, setData(data);
</script>

<div class="mimcont" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row style="height: inherit;">
          <Column sm={16} md={16} lg={16} style="height: 100%; display:flex; flex-flow: column nowrap; align-items: flex-start; justify-content: space-between;">
            <Row style="height: 100%; width: 100%;">
              <Column style="height: 100%; display:flex; flex-flow: column nowrap; align-items: flex-start; justify-content: flex-start;">
                <DataTable
                  class="seltab"
                  size="compact"
                  headers={head}
                  rows={rows}>
                  <Toolbar>
                    <ToolbarContent>
                      <Tile class="head">
                        <h4 class="title">Active mimic device(s).</h4>
                        <p class="descr">(column "Status" reflects the current digital value)</p>
                      </Tile>
                    </ToolbarContent>
                  </Toolbar>
                  <svelte:fragment slot="cell" let:row let:rowIndex let:cell>
                    {#if (cell.key === "status")}
                      {#each new Array(28) as _, i}
                        <img src={cell.value[i] === 0 ? redImage : cell.value[i] === 1 ? greenImage : cell.value[i] === 2 ? yellowImage : greyImage}
                          alt style="width: 1rem; margin-right: 0.25rem;" />
                      {/each}
                    {:else}
                      {cell.value}
                    {/if}
                  </svelte:fragment>
                </DataTable>
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
