<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, DataTable, Toolbar,
    ToolbarContent, OverflowMenu, OverflowMenuItem, Dropdown, TextInput } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add16";
  import Del from "carbon-icons-svelte/lib/Delete16";

  export let mode;
  export let table;
  export let style;
  export let running;

  const dispatch = createEventDispatcher();
  
  const modes = new Array(
    { id: '0', text: 'Percentage' },
    { id: '1', text: 'Volume' },
  );
  const headers = new Array(
    { key: 'perlvl', value: 'Percentage of Level', sort: false },
    { key: 'pervol', value: 'Percentage of Volume', sort: false },
    { key: 'volume', value: 'Volume', sort: false },
  );
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };
  let capacity = null;
  let level = null;
  let volume = null;
  let rows = new Array();
  let selected = new Array();
  
  function getmode(e) {
    dispatch("getmode", e);
  };

  function setmode(e) {
    dispatch("setmode", e);
  };

  function download(e) {
    dispatch("download", e);
  };

  function clear(e) {
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
    if (selected.length > 0) {
    }
  };

  // Data getters
  $: rows = JSON.parse(JSON.stringify(table));
  $: if (selected.length == 1) {

  } else if (selected.length > 1) {

  }
</script>

<div class="container" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row>
          <Column sm={1} md={1} lg={3} padding>
            <Row style="text-align: right;">
              <Column>
                <Button kind="primary" disabled={running} on:click={(e) => clear(e)}>Clear Table</Button>
              </Column>
            </Row>
            <Row padding style="text-align: right;">
              <Column>
                <Button kind="primary" disabled={running} on:click={(e) => download(e)}>Read Table</Button>
              </Column>
            </Row>
            <Row style="text-align: right;">
              <Column>
                <Button kind="primary" disabled={running} on:click={(e) => upload(e)}>Write Table</Button>
              </Column>
            </Row>
          </Column>
          <Column sm={1} md={6} lg={10} padding>
            <Row style="text-align: right;">
              <Column>
                <TextInput id="capacity" size="sm" labelText="Tank Capacity" disabled={running} value={capacity} />
              </Column>
              <Column>
                <TextInput id="level" size="sm" labelText="Level Percentage" disabled={running} value={level} />
              </Column>
              <Column>
                <TextInput id="volume" size="sm" labelText="Volume Percentage" disabled={running} value={volume} />
              </Column>
              <Column style="flex-grow: 0; padding: 0 0.2rem;">
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Add element" icon={Add}
                  on:click={(e) => addrow(e)}></Button>
              </Column>
              <Column style="flex-grow: 0; padding-left: 0.2rem;">
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Delete element(s)" icon={Del}
                  disabled={selected.length == 0} on:click={(e) => delrow(e)}></Button>
              </Column>
            </Row>
            <Row padding>
              <Column style="width: 100%;">
                <DataTable
                  size="short"
                  selectable
                  bind:selectedRowIds={selected}
                  {headers}
                  {rows}
                  pageSize={pagination.pageSize}
                  page={pagination.page}>
                  <!-- <Toolbar>
                    <Tile>{title}</Tile>
                    <ToolbarContent>
                      <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Add element" icon={Add}
                        on:click={(e) => addrow(e)}></Button>
                      <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Delete element" icon={Del}
                        disabled={selected.length == 0} on:click={(e) => delrow(e)}></Button>
                    </ToolbarContent>
                  </Toolbar> -->
                  <span slot="cell" let:cell let:row>{cell.value}</span>
                </DataTable>
              </Column>
            </Row>
          </Column>
          <Column sm={1} md={1} lg={3} padding  style="justify-self: flex-end;">
            <Row>
              <Column>
                <Button kind="primary" disabled={running} on:click={(e) => getmode(e)}>Get mode</Button>
              </Column>
            </Row>
            <Row padding>
              <Column>
                <Dropdown hideLabel titleText="Select mode" size="xl" selectedId={mode} items={modes} />
              </Column>
            </Row>
            <Row>
              <Column>
                <Button kind="primary" disabled={running} on:click={(e) => setmode(e)}>Set mode</Button>
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
    width: 100%;
    height: 100%;
  }
</style>
