<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, DataTable, 
    Dropdown, TextInput, Pagination } from "carbon-components-svelte";
  import Open from "carbon-icons-svelte/lib/Document16";
  import Save from "carbon-icons-svelte/lib/Save16";
  import Add from "carbon-icons-svelte/lib/Add16";
  import Del from "carbon-icons-svelte/lib/Delete16";

  export let data;
  export let style;
  export let running;

  String.prototype.isNumber = function() {
    return /^\d+$|^\d+\.\d+$/.test(this);
  }

  String.prototype.isInteger = function() {
    return /^\d+$/.test(this);
  }

  const dispatch = createEventDispatcher();
  
  const modes = new Array(
    { id: '0', text: 'Level' },
    { id: '1', text: 'Volumetric' },
  );
  const units = new Array(
    { id: '0', text: '%' },
    { id: '1', text: 'L' },
  );
  const fluids = new Array(
    { id: '0', text: 'Fuel' },
    { id: '1', text: 'Fresh Water' },
    { id: '2', text: 'Waste Water' },
    { id: '3', text: 'Live Well' },
    { id: '4', text: 'Oil' },
    { id: '5', text: 'Black Water' },
    { id: '6', text: 'Gasoline' },
  );
  const insts = new Array(
    { id: '0', text: '0' },
    { id: '1', text: '1' },
    { id: '2', text: '2' },
    { id: '3', text: '3' },
    { id: '4', text: '4' },
    { id: '5', text: '5' },
    { id: '6', text: '6' },
    { id: '7', text: '7' },
    { id: '8', text: '8' },
    { id: '9', text: '9' },
    { id: '10', text: '10' },
    { id: '11', text: '11' },
    { id: '12', text: '12' },
    { id: '13', text: '13' },
    { id: '14', text: '14' },
    { id: '15', text: '15' },
  );
  const headers = new Array(
    { key: 'perlvl', value: 'Height (%)', sort: false },
    { key: 'pervol', value: 'Volume (%)', sort: false },
    { key: 'volume', value: 'Volume (L)', sort: false },
  );
  const rounding = false;
  let height;
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };
  let unit = '0';
  let rows = new Array();
  let selected = new Array();
  let valid = { int: false, cap: false, lvl: false, vol: false };
  
  // Re-calculates data.table values
  function calculate() {
    for (let i in data.table) {
      let val = Math.round(data.capacity * data.table[i].pervol * (units[unit].text == '%' ? 0.01 : 1) * 100) / 100;
      data.table[i].volume = rounding ? Math.round(val) : val;
    }
  }

  function find(lvl) {
    for (let i in data.table) {
      if (data.table[i].perlvl == lvl) {
        return i;
      }
    }
    return null;
  };

  function next() {
    let ret = 0;
    for (let i in data.table) {
      let id = parseInt(data.table[i].id) + 1;
      if (id > ret) {
        ret = id;
      }
    }
    return ret.toString();
  };

  /* interpolation calculation
      hes - height % start
      hee - height % end
      vos - volume % start
      voe - volume % end
  */
	function range(hes, hee, vos, voe) {
    let stp = (voe - vos) / (hee - hes);
    var ret = new Array();
    for (let i = hes; (i < hee) || (i == 100); i++) {
      let cap = document.getElementById('capacity');
      if (cap != null) {
        let per = Math.round((vos + ((i - hes) * stp)) * 100) / 100;
        let vol = Math.round(per * cap.value) / 100;
        ret.push({ 'id': null, 'perlvl': i, 'pervol': per, 'volume': vol });
      }
    }
    return ret;
	}

  function load(e) {
    dispatch("load");
  };
  
  function save(e) {
    dispatch("save");
  };
  
  function getmode(e) {
    dispatch("getmode");
  };

  function setmode(e) {
    dispatch("setmode");
  };
  
  function clear(e) {
    selected = new Array();
    data.capacity = null;
    data.table = new Array();
    rows = JSON.parse(JSON.stringify(data.table));
  };
  
  function download(e) {
    dispatch("download");
  };

  function interpolate(e) {
    selected = new Array();
    if (find(0) == null) {
      data.table.push({ 'id': next(), 'perlvl': 0, 'pervol': 0, 'volume': 0 });
    };
    if (find(100) == null) {
      let cap = document.getElementById('capacity');
      if (cap != null) {
        data.table.push({ 'id': next(), 'perlvl': 100, 'pervol': 100, 'volume': parseFloat(cap.value) });
      }
    };
    data.table.sort((a, b) => a.perlvl - b.perlvl);
    let res = new Array();
    for (let i in data.table) {
      let curr = data.table[i];
      if (i > 0) {
        let prev = data.table[i - 1];
        let diff = curr.perlvl - prev.perlvl;
        if (diff > 1) {
          let tmp = range(prev.perlvl, curr.perlvl, prev.pervol, curr.pervol);
          res = [...res, ...tmp];
        } else {
          res = [...res, prev];
        }
      }
    }
    res.sort((a, b) => a.perlvl - b.perlvl);
    for (let i in res) {
      res[i].id = i.toString();
    }
    data.table = JSON.parse(JSON.stringify(res));
    rows = JSON.parse(JSON.stringify(res));
  };

  function upload(e) {
    dispatch("upload");
  };

  function cancel(e) {
    dispatch("cancel");
  };

  function addrow(e) {
    let cap = document.getElementById('capacity');
    let lvl = document.getElementById('level');
    let vol = document.getElementById('volume');
    if ((cap != null) && (lvl != null) && (vol != null)) {
      let val = null;
      if (units[unit].text == '%') {
        val = cap.value * vol.value * (units[unit].text == '%' ? 0.01 : 1);
        let elm = find(parseInt(lvl.value));
        if (elm != null) {
          data.table[elm].pervol = parseFloat(vol.value);
          data.table[elm].volume = val;
        } else {
          data.table.push({ 'id': next(), 'perlvl': parseInt(lvl.value), 'pervol': parseFloat(vol.value), 'volume': val });
        }
      } else {
        val = vol.value / cap.value * 100;
        let elm = find(parseInt(lvl.value));
        if (elm != null) {
          data.table[elm].pervol = val
          data.table[elm].volume = parseFloat(vol.value);;
        } else {
          data.table.push({ 'id': next(), 'perlvl': parseInt(lvl.value), 'pervol': val, 'volume': parseFloat(vol.value) });
        }
      }
      data.table.sort((a, b) => a.perlvl - b.perlvl);
      rows = JSON.parse(JSON.stringify(data.table));
      lvl.value = null;
      vol.value = null;
      valid.lvl = false;
      valid.vol = false;
      lvl.select();
    }
  };

  function delrows(e) {
    if (selected.length > 0) {
      for (let i in selected) {
        for (let j in data.table) {
          if (data.table[j].id == selected[i]) {
            data.table.splice(j, 1);
            break;
          }
        }
      }
      selected = new Array();
      rows = JSON.parse(JSON.stringify(data.table));
    }
  };

  function capinput(e) {
    valid.cap = e.detail.isNumber();
    valid.int = e.detail.isNumber();
  };

  function capchange(e) {
    valid.int = e.detail.isNumber();
    if (valid.int) {
      data.capacity = parseFloat(e.detail);
      calculate();
    }
  };

  function lvlinput(e) {
    valid.lvl = e.detail.isInteger();
  };

  function volinput(e) {
    valid.vol = e.detail.isNumber();
  };

  function unitselect(e) {
    unit = e.detail.selectedItem.id;
    let lvl = document.getElementById('volume');
    if (lvl != null) {
      const lbs = document.getElementsByTagName("label");
      for (const lab of lbs) {
        if (lab.htmlFor === 'volume') {
          lab.innerHTML = 'Volume (' + e.detail.selectedItem.text + ')';
        }
      }
    }
  };

  // Data getters / setters
  $: valid.int = (typeof data.capacity !== 'undefined') && (data.capacity != null) && data.capacity.toString().isNumber();
  $: rows = JSON.parse(JSON.stringify(data.table));
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
            <Row>
              <Column style="display: flex; flex-flow: row nowrap; justify-content: flex-end;">
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Load table" icon={Open}
                  style="margin-right: 0.2rem;" disabled={running} on:click={(e) => load(e)}></Button>
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Save table" icon={Save}
                  style="margin-left: 0.2rem;" disabled={running} on:click={(e) => save(e)}></Button>
              </Column>
            </Row>
            <Row padding>
              <Column>
                <Dropdown titleText="Fluid type" size="sm" bind:selectedId={data.fluid} items={fluids} />
              </Column>
            </Row>
            <Row>
              <Column>
                <Dropdown titleText="Instance" size="sm" bind:selectedId={data.instance} items={insts} />
              </Column>
            </Row>
            <Row padding style="text-align: right;">
              <Column>
                <ButtonSet stacked style="padding: 0.2rem;">
                  <Button style="margin: 0.2rem 0" disabled={running} on:click={(e) => clear(e)}>Clear table</Button>
                  <Button style="margin: 0.2rem 0" disabled={running} on:click={(e) => download(e)}>Read from Sender</Button>
                  <Button style="margin: 0.2rem 0" disabled={running || !valid.int} on:click={(e) => interpolate(e)}>Interpolate</Button>
                  <Button style="margin: 0.2rem 0" disabled={running} on:click={(e) => upload(e)}>Write to Sender</Button>
                </ButtonSet>
              </Column>
            </Row>
          </Column>
          <Column sm={1} md={6} lg={10} padding>
            <Row>
              <Column>
                <TextInput id="capacity" size="sm" labelText="Capacity (L)" value={data.capacity} disabled={running}
                  on:input={(e) => capinput(e)} on:change={(e) => capchange(e)} />
              </Column>
              <Column>
                <TextInput id="level" size="sm" labelText="Height (%)" disabled={running}
                  on:input={(e) => lvlinput(e)}/>
              </Column>
              <Column>
                <TextInput id="volume" size="sm" labelText="Volume (%)" disabled={running}
                  on:input={(e) => volinput(e)} />
              </Column>
              <Column>
                <Dropdown titleText="Unit" size="sm" bind:selectedId={unit} items={units} on:select={(e) => unitselect(e)} />
              </Column>
              <Column style="flex-grow: 0; padding: 0 0.2rem;">
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Add element" icon={Add}
                  disabled={(selected.length > 0) || !valid.cap || !valid.lvl || !valid.vol}
                  on:click={(e) => addrow(e)}></Button>
              </Column>
              <Column style="flex-grow: 0; padding-left: 0.2rem;">
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Delete element(s)" icon={Del}
                  disabled={selected.length == 0} on:click={(e) => delrows(e)}></Button>
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
                <Dropdown hideLabel titleText="Select mode" size="xl" bind:selectedId={data.mode} items={modes} />
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
