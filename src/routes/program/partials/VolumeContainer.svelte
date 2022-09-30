<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, DataTable, 
    Dropdown, TextInput, Pagination } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add16";
  import Del from "carbon-icons-svelte/lib/Delete16";

  export let mode;
  export let table;
  export let style;
  export let running;

  String.prototype.isNumber = function() {
    return /^\d+$|^\d+\.\d+$/.test(this);
  }

  const dispatch = createEventDispatcher();
  
  const modes = new Array(
    { id: '0', text: 'Percentage' },
    { id: '1', text: 'Volume' },
  );
  const units = new Array(
    { id: '0', text: '%' },
    { id: '1', text: 'L' },
  );
  const headers = new Array(
    { key: 'perlvl', value: 'Height (%)', sort: false },
    { key: 'pervol', value: 'Volume (%)', sort: false },
    { key: 'volume', value: 'Volume (L)', sort: false },
  );
  let height;
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };
  let unit = '0';
  let rows = new Array();
  let selected = new Array();
  let valid = { cap: false, lvl: false, vol: false };
  
  // Re-calculates table values
  function calculate() {
    let cap = document.getElementById('capacity');
    if (cap != null) {
      for (let i in table) {
        table[i].volume = cap.value * table[i].pervol * (units[unit].text == '%' ? 0.01 : 1);
      }
    }
  }

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
    let cap = document.getElementById('capacity');
    let lvl = document.getElementById('level');
    let vol = document.getElementById('volume');
    if ((cap != null) && (lvl != null) && (vol != null)) {
      let idx = table.length > 0 ? table[table.length - 1].id + 1 : 0;
      let val = cap.value * vol.value * (units[unit].text == '%' ? 0.01 : 1);
      table.push({ 'id': idx, 'perlvl': parseFloat(lvl.value), 'pervol': parseFloat(vol.value), 'volume': val });
      rows = JSON.parse(JSON.stringify(table));
      lvl.value = null;
      vol.value = null;
      lvl.select();
    }
  };

  function delrow(e) {
    if (selected.length > 0) {
    }
  };

  function capinput(e) {
    valid.cap = e.detail.isNumber();
  };

  function capchange(e) {
    calculate();
  };

  function lvlinput(e) {
    valid.lvl = e.detail.isNumber();
  };

  function volinput(e) {
    valid.vol = e.detail.isNumber();
  };

  // Data getters
  $: rows = JSON.parse(JSON.stringify(table));
  $: pagination.totalItems = rows.length;
  $: pagination.pageSize = Math.round((height / getComputedStyle(document.documentElement).fontSize.replace('px', '')) / 2) - 8;
  $: if (selected.length > 0) {
    let lvl = document.getElementById('level');
    let vol = document.getElementById('volume');
    if (lvl != null) {
      lvl.value = null;
    }
    if (vol != null) {
      vol.value = null;
    }
  }
</script>

<svelte:window bind:innerHeight={height} />
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
                <TextInput id="capacity" size="sm" labelText="Capacity (L)" disabled={running}
                  on:input={(e) => capinput(e)} on:change={(e) => capchange(e)} />
              </Column>
              <Column>
                <TextInput id="level" size="sm" labelText="Height (%)" disabled={running}
                  on:input={(e) => lvlinput(e)}/>
              </Column>
              <Column>
                <TextInput id="volume" size="sm" labelText="Volume" disabled={running}
                  on:input={(e) => volinput(e)} />
              </Column>
              <Column>
                <Dropdown titleText="Unit" size="sm" selectedId={unit} items={units} disabled={table.length > 0} />
              </Column>
              <Column style="flex-grow: 0; padding: 0 0.2rem;">
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Add element" icon={Add}
                  disabled={(selected.length > 0) || !valid.cap || !valid.lvl || !valid.vol}
                  on:click={(e) => addrow(e)}></Button>
              </Column>
              <Column style="flex-grow: 0; padding-left: 0.2rem;">
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Delete element(s)" icon={Del}
                  disabled={selected.length == 0} on:click={(e) => delrow(e)}></Button>
              </Column>
            </Row>
            <Row>
              <Column style="width: 100%;">
                <DataTable
                  size="compact"
                  selectable
                  bind:selectedRowIds={selected}
                  {headers}
                  {rows}
                  pageSize={pagination.pageSize}
                  page={pagination.page}>
                  <span slot="cell" let:cell let:row>{cell.value}</span>
                </DataTable>
                {#if pagination.totalItems > pagination.pageSize}
                <Pagination
                  bind:pageSize={pagination.pageSize}
                  totalItems={pagination.totalItems}
                  bind:page={pagination.page}
                  pageSizeInputDisabled
                />
              {/if}
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
