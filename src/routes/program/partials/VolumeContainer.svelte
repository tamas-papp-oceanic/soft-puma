<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, DataTable, Toolbar,
    ToolbarContent, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add16";

  export let style;
  export let running;
  export let table;

  const dispatch = createEventDispatcher();
  
  const headers = new Array({
    key: 'per1',
    value: 'Percentage',
    sort: false
  },{
    key: 'per2',
    value: 'Percentage',
    sort: false
  },{
    key: 'vol',
    value: 'Volume',
    sort: false
  },{
    key: 'overflow',
    empty: true
  });
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  function getmode(e) {
    dispatch("getmode", e);
  };

  function setmode(e) {
    dispatch("setmode", e);
  };

  function download(e) {
    dispatch("download", e);
  };

  function upload(e) {
    dispatch("upload", e);
  };

  function cancel(e) {
    dispatch("cancel", e);
  };

  function addrow(e) {
  };

  function delrow(e, key) {
  };
</script>

<div class="container" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <div class="title">Connect the device to CAN network and press a button below.</div>
      <Grid padding fullWidth noGutter>
        <Row>
          <Column sm={2} md={6} lg={12}>
            <DataTable
              {headers}
              {table}
              pageSize={pagination.pageSize}
              page={pagination.page}>
              <Toolbar>
                <!-- <Tile>{title}</Tile> -->
                <ToolbarContent>
                  <Button icon={Add} on:click={(e) => addrow(e)}></Button>
                </ToolbarContent>
              </Toolbar>
              <span slot="cell" let:cell let:row>
                {#if cell.key === 'overflow'}
                <OverflowMenu flipped>
                  <OverflowMenuItem text="Delete" disabled on:click={(e) => delrow(e, row.key)} />
                  </OverflowMenu>
                {:else}
                  {cell.value}
                {/if}
              </span>
            </DataTable>
          </Column>
          <Column sm={1} md={2} lg={4}>
            <Row>
              <Column>
                <Button kind="primary" disabled={running} on:click={(e) => getmode(e)}>Get mode</Button>
              </Column>
            </Row>
            <Row>
              <Column>
                <Button kind="primary" disabled={running} on:click={(e) => setmode(e)}>Set mode</Button>
              </Column>
            </Row>
            <Row>
              <Column>
                <Button kind="primary" disabled={running} on:click={(e) => download(e)}>Read Table</Button>
              </Column>
            </Row>
            <Row>
              <Column>
                <Button kind="primary" disabled={running} on:click={(e) => upload(e)}>Write Table</Button>
              </Column>
            </Row>
          </Column>
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
    margin-bottom: 2rem;
  }
</style>
