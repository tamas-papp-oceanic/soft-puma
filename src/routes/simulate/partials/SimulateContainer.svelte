<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column,
    DataTableSkeleton, DataTable, NumberInput, NumberInputSkeleton,
    TextInput, Dropdown, DropdownSkeleton, CheckboxSkeleton, Checkbox } from "carbon-components-svelte";
  import Delete from "carbon-icons-svelte/lib/RowDelete16";
  import Open from "carbon-icons-svelte/lib/Document16";
  import Save from "carbon-icons-svelte/lib/Save16";
  import Empty from "carbon-icons-svelte/lib/Delete16";
  import Send from "carbon-icons-svelte/lib/SkipForward16";
  import Start from "carbon-icons-svelte/lib/Play16";
  import Pause from "carbon-icons-svelte/lib/Pause16";
  import Record from "carbon-icons-svelte/lib/Recording16";
  import Stop from "carbon-icons-svelte/lib/Stop16";
  import { protocol } from '../../../stores/data';

  export let data;
  export let style;
  export let loading;
  export let running;
  export let capturing;
  export let success;

  const dispatch = createEventDispatcher();

  const header1 = new Array(
    { key: 'pgn', value: 'PGN', sort: false },
    { key: 'instance', value: 'Instance', display: (item) => item != null ? item : '-', sort: false },
    { key: 'fluidtype', value: 'Fluid', display: (item) => item != null ? getFlu(item) : '-', sort: false },
    { key: 'title', value: 'Title', sort: false, width: '50%' },
  );
  const header2 = new Array(
    { key: 'field', value: 'Field', sort: false },
    { key: 'title', value: 'Title', width: '35%', sort: false },
    { key: 'value', value: 'Value', sort: false },
    { key: 'unit', value: 'Unit', sort: false },
    { key: 'static', value: 'Static', sort: false },
    { key: 'ranges', value: 'Ranges', sort: false },
    { key: 'simulation', value: 'Simulation', sort: false },
  );
  let insts = new Array();
  const fluts = new Array(
    { id: 0, text: 'Fuel' },
    { id: 1, text: 'Fresh Water' },
    { id: 2, text: 'Waste Water' },
    { id: 3, text: 'Live Well' },
    { id: 4, text: 'Oil' },
    { id: 5, text: 'Black Water (Sewage)' },
    { id: 6, text: 'Fuel (Gasoline)' },
  );
  const sims = new Array(
    { id: 0, text: 'Incremental' },
    { id: 1, text: 'Decremental' },
    { id: 2, text: 'Natural' },
    { id: 3, text: 'Random' },
  );
  let rows1 = new Array();
  let rows2 = new Array();
  let selectedIds1 = new Array();
  let selectedIds2 = new Array();
  let selection1 = null;
  let selection2 = null;
  let ranges = false;
  let custom = false;
  let repeat = false;

  function getFlu(id) {
    for (let i in fluts) {
      if (fluts[i].id == id) {
        return fluts[i].text;
      }
    }
    return '-';
  };

  function rowSel1(e) {
    selection1 = e.detail.row;
    selectedIds2 = new Array();
    selection2 = null;
    scroll1(250);
  };

  function rowSel2(e) {
    selection2 = e.detail.row;
    ranges = selection2.ranges !== null;
    custom = ((selection2.simulation !== null) && (selection2.simulation !== data.simulation)) ||
      ((selection2.rate !== null) && (selection2.rate !== data.rate));
    scroll1(500);
    scroll2(250);
    if (typeof e.detail.row.positions === 'undefined') {
      setTimeout(() => {
        document.getElementById('input').focus();
      }, 100);
    }
  };

  function check2(e) {
    for (let i in  data.table) {
      if (data.table[i].id === selection1.id) {
        if (e.detail) {
          if (selection2.limits !== null) {
            selection2.ranges = selection2.limits;
            data.table[i].fields[selection2.id].ranges = selection2.limits;
            setTimeout(() => {
              document.getElementById('min').focus();
            }, 100);
          }
        } else {
          selection2.ranges = null;
          data.table[i].fields[selection2.id].ranges = null;
        }
        data = data;
        break;
      }
    }
  }

  function setDig(e, row) {
    for (let i in data.table) {
      if (data.table[i].id === selection1.id) {
        let val = data.table[i].fields[row].value;
        if (val === 0) {
          val = 3;
        } else if (val === 1) {
          val = 0;
        } else if (val === 3) {
          val = 1;
        }
        data.table[i].fields[row].value = val;
        e.currentTarget.value = val;
        break;
      }
    }
  };

  function setSta(e, row) {
    if (e.detail != null) {
      for (let i in data.table) {
        if (data.table[i].id == selection1.id) {
          data.table[i].fields[row].static = e.detail;
          break;
        }
      }
    }
  };

  function input0(e) {
    if (e.detail != null) {
      for (let i in data.table) {
        if (data.table[i].id == selection1.id) {
          data.table[i].fields[selection2.id].value = parseInt(e.detail.selectedId);
          data.table[i].fluidtype = parseInt(e.detail.selectedId);
          break;
        }
      }
    }
  };

  function choice(e) {
    if (e.detail != null) {
      for (let i in data.table) {
        if (data.table[i].id == selection1.id) {
          data.table[i].fields[selection2.id].value = parseInt(e.detail.selectedId);
          break;
        }
      }
    }
  };

  function select(e) {
    if (e.detail != null) {
      for (let i in data.table) {
        if (data.table[i].id == selection1.id) {
          data.table[i].fields[selection2.id].select = parseInt(e.detail.selectedId);
          break;
        }
      }
    }
  };

  function input1(e) {
    if (e.detail != null) {
      for (let i in data.table) {
        if (data.table[i].id == selection1.id) {
          data.table[i].fields[selection2.id].value = parseFloat(e.detail);
          if (typeof data.table[i].fields[selection2.id].sival !== 'undefined') {
            data.table[i].fields[selection2.id].sival = parseFloat(e.detail);
          }
          if (typeof data.table[i].fields[selection2.id].instance !== 'undefined') {
            data.table[i].instance = parseInt(e.detail);
          } else if (typeof data.table[i].fields[selection2.id].fluid !== 'undefined') {
            data.table[i].fluidtype = parseInt(e.detail);
          }
          break;
        }
      }
    }
  };

  function input2(e) {
    if (e.detail != null) {
      for (let i in  data.table) {
        if (data.table[i].id == selection1.id) {
          data.table[i].fields[selection2.id].value = e.detail;
          break;
        }
      }
    }
  };

  function input3(e) {
    if (e.detail != null) {
      for (let i in  data.table) {
        if (data.table[i].id == selection1.id) {
          if (data.table[i].fields[selection2.id].ranges === null) {
            data.table[i].fields[selection2.id].ranges = { min: null, max: null };
          }
          data.table[i].fields[selection2.id].ranges.min = e.detail;
          break;
        }
      }
    }
  };

  function input4(e) {
    if (e.detail != null) {
      for (let i in  data.table) {
        if (data.table[i].id == selection1.id) {
          if (data.table[i].fields[selection2.id].ranges === null) {
            data.table[i].fields[selection2.id].ranges = { min: null, max: null };
          }
          data.table[i].fields[selection2.id].ranges.max = e.detail;
          break;
        }
      }
    }
  };

  function input5(e) {
    if (e.detail != null) {
      data.rate = e.detail;
    }
  };

  function check3(e) {
    for (let i in  data.table) {
      if (data.table[i].id == selection1.id) {
        if (e.detail) {
          data.table[i].fields[selection2.id].simulation = data.simulation;
          data.table[i].fields[selection2.id].rate = data.rate;
        } else {
          data.table[i].fields[selection2.id].simulation = null;
          data.table[i].fields[selection2.id].rate = null;
        }
        data = data;
        break;
      }
    }
  }

  function calcPos(fld) {
    let res = 0;
    for (let i in fld.positions) {
      if (fld.positions[i].value) {
        res += Math.pow(2, fld.positions[i].id);
      }
    }
    return res;
  }

  function setPos(fld, pos, val) {
    for (let i in fld.positions) {
      if (fld.positions[i].id === pos) {
        fld.positions[i].value = val;
        break;
      }
    }
    return fld.positions;
  }

  function check4(e, pos) {
    for (let i in  data.table) {
      if (data.table[i].id == selection1.id) {
        for (let j in  data.table[i].fields) {
          if (data.table[i].fields[j].id == selection2.id) {
            data.table[i].fields[j].positions = setPos(data.table[i].fields[j], pos, e.detail);
            data.table[i].fields[j].value = calcPos(data.table[i].fields[j]);
            data = data;
            break;
          }
        }
      }
    }
  }

  function setMimic(e) {
    dispatch("mimic");
  }

  function setSim(e) {
    if (e.detail != null) {
      for (let i in  data.table) {
        if (data.table[i].id == selection1.id) {
          data.table[i].fields[selection2.id].simulation = (e.detail.selectedId !== data.simulation) ? e.detail.selectedId : null;
          break;
        }
      }
    }
  };

  function setRate(e) {
    if (e.detail != null) {
      for (let i in  data.table) {
        if (data.table[i].id == selection1.id) {
          data.table[i].fields[selection2.id].rate = (e.detail !== data.rate) ? e.detail : null;
          break;
        }
      }
    }
  };

  function delRow(e) {
    dispatch("delrow", selection1);
    selectedIds1 = new Array();
    selectedIds2 = new Array();
    selection1 = null;
    selection2 = null;
  };

  function load() {
    selectedIds1 = new Array();
    selectedIds2 = new Array();
    selection1 = null;
    selection2 = null;
    dispatch("load");
  };

  function save(e) {
    dispatch("save");
  };

  function clrTab(e) {
    selectedIds1 = new Array();
    selectedIds2 = new Array();
    selection1 = null;
    selection2 = null;
    dispatch("clrtab");
  };

  function capStart(e) {
    selectedIds1 = new Array();
    selectedIds2 = new Array();
    selection1 = null;
    selection2 = null;
    dispatch("capstart");
  };

  function capStop(e) {
    dispatch("capstop");
  };

  function send(e) {
    dispatch("send", selection1);
  };

  function simStart(e) {
    selectedIds2 = new Array();
    selection2 = null;
    scroll1(250);
    dispatch("simstart");
  };      
  
  function simStop(e) {
    scroll1(250);
    dispatch("simstop");
  };  

  function cancel(e) {
    dispatch("cancel", e.detail);
  };

  function getlim(fld, key) {
    if ((fld.limits !== null) && (typeof fld.limits[key] !== 'undefined')) {
      return fld.limits[key];
    }
    return null;
  };

  function getrng(fld, key) {
    if ((fld.ranges !== null) && (typeof fld.ranges[key] !== 'undefined')) {
      return fld.ranges[key];
    }
    return null;
  };

  function setData(val) {
    repeat = false;
    let arr = new Array();
    if (val != null) {
      let dat = JSON.parse(JSON.stringify(val.table));
      for (let i in dat) {
        if (dat[i].interval != null) {
          repeat = true;
        }
        arr.push(dat[i]);
      }
    }
    rows1 = JSON.parse(JSON.stringify(arr));
    if (rows1.length === 0) {
      selection1 = null;
      selection2 = null;
      selectedIds1 = new Array();
      selectedIds2 = new Array();
    }
  };

  function filter() {
    let arr = new Array();
    if (selection1 !== null) {
      let fnd = false;
      for (let i in data.table) {
        if (data.table[i].id === selection1.id) {
          selection1 = data.table[i];
          fnd = true;
          break;
        }
      }
      if (fnd) {
        arr = JSON.parse(JSON.stringify(selection1.fields));
      } else {
        selection1 = null;
        selectedIds1 = new Array();
      }
    }
    rows2 = JSON.parse(JSON.stringify(arr));
    if (selection2 !== null) {
      let fnd = false;
      for (let i in rows2) {
        if (rows2[i].id === selection2.id) {
          selection2 = rows2[i];
          fnd = true;
          break;
        }
      }
      if (!fnd) {
        selection2 = null;
        selectedIds2 = new Array();
      }
    }
  }

  function scroll1(dly) {
    if (selectedIds1.length > 0) {
      setTimeout(() => {
        let elm = document.querySelector('.simtab tr.bx--data-table--selected');
        elm.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, dly);
    }
  }

  function clrSel1(val) {
    if (val) {
      selectedIds1 = new Array();
      selection1 = null;
    }
  }

  function scroll2(dly) {
    setTimeout(() => {
      let elm = document.querySelector('.tabfld tr.bx--data-table--selected');
      elm.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, dly);
  }

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i, text: i.toString() });
  }

  $: data, setData(data);
  $: data, filter();
  $: selection1, filter();
  $: success, clrSel1(success);
</script>

<div class="simcont" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row style="height: inherit;">
          <Column sm={13} md={13} lg={13} style="height: 100%; display:flex; flex-flow: column nowrap; align-items: flex-start; justify-content: space-between;">
            <Row style="min-height: 33%; max-height: 100%; width: 100%;">
              <Column style="height: 100%; display:flex; flex-flow: column nowrap; align-items: flex-start; justify-content: flex-start;">
                <Tile class="head">
                  <h4 class="title">{$protocol.toUpperCase()} message(s) as part of simulation.</h4>
                  <p class="descr">(select message for setting field values)</p>
                </Tile>
                {#if loading}
                  <DataTableSkeleton showHeader={false} showToolbar={false} headers={header1} size="compact" rows={20} />
                {:else}
                  <DataTable
                    class="simtab"
                    size="compact"
                    radio
                    bind:selectedRowIds={selectedIds1}
                    headers={header1}
                    rows={rows1}
                    on:click:row--select={rowSel1}>
                  </DataTable>
                {/if}
              </Column>
            </Row>
            {#if selection1 != null}
              <Row style="height: 1rem; width: 100%;"><Column>&nbsp;</Column></Row>
              <Row style="min-height: 33%; max-height: 66%; width: 100%;">
                <Column style="height: 100%; display:flex; flex-flow: column nowrap; align-items: flex-start; justify-content: flex-start;">
                  <Tile class="head">
                    <h4 class="title">Message fields.</h4>
                    <p class="descr">(select field for setting values)</p>
                  </Tile>
                  {#if loading}
                    <DataTableSkeleton showHeader={false} showToolbar={false} headers={header2} size="compact" rows={10} />
                  {:else}
                    <DataTable
                      class="tabfld"
                      size="compact"
                      radio
                      nonSelectableRowIds={selection1.disabledIds}
                      bind:selectedRowIds={selectedIds2}
                      headers={header2}
                      rows={rows2}
                      on:click:row--select={rowSel2}>
                      <svelte:fragment slot="cell" let:row let:rowIndex let:cell>
                        {#if (selection1.disabledSim.indexOf(row.id) !== -1)}
                          {#if (cell.key === "value")}
                            {#if row.dictionary === 'DD001'}
                              {""}
                            {:else if (selection1.key.startsWith('nmea2000') && ((row.dictionary === 'DD002') || (row.dictionary === 'DD003'))) ||
                              (selection1.key.startsWith('j1939') && (row.type === 'bit(2)'))}
                              <Checkbox hideLabel checked={cell.value === 1} indeterminate={cell.value === 3} on:change={(e) => setDig(e, rowIndex)} />
                            {:else}
                              {cell.value}
                            {/if}
                          {:else if ((cell.key === "unit") || (cell.key === "static") || (cell.key === "ranges") || (cell.key === "simulation"))}
                            {""}
                          {:else}
                            {cell.value}
                          {/if}
                        {:else if ((cell.key === "unit") && (cell.value === null))}
                          {"-"}
                        {:else if cell.key === "static"}
                          {#if row.static !== null}
                            <Checkbox labelText="Static" hideLabel checked={row.static} on:check={(e) => setSta(e, rowIndex)} />
                          {:else}
                            {""}
                          {/if}
                        {:else if cell.key === "ranges"}
                          {#if row.ranges !== null}
                            {(row.ranges.min !== null ? row.ranges.min + " " : "")  + "-" + (row.ranges.max !== null ? " " + row.ranges.max : "")}
                          {:else}
                            {"-"}
                          {/if}
                        {:else if cell.key === "simulation"}
                          {#if ((row.simulation !== null) && (row.simulation !== data.simulation)) || ((row.rate !== null) && (row.rate !== data.rate))}
                            {"Custom"}
                          {:else}
                            {"-"}
                          {/if}
                        {:else}
                          {cell.value}
                        {/if}
                      </svelte:fragment>
                    </DataTable>
                  {/if}
                </Column>
              </Row>
              {#if !running && (selection2 != null)}
                <Row style="max-height: 33%; width: 100%;">
                  <Column style="height: 100%;">
                    <Grid fullWidth noGutter>
                      <Row style="height: 0.5rem; width 100%;"><Column>&nbsp;</Column></Row>
                      <Row style="width 100%;">
                        <Column sm={5} md={5} lg={5} style="display: flex; flex-flow: column nowrap; justify-content: space-between;">
                          {#if (typeof selection2.fluid !== 'undefined') || (typeof selection2.choices !== 'undefined') ||
                            (typeof selection2.positions !== 'undefined') || (typeof selection2.selects !== 'undefined')}
                            <Row style="display:flex; flex-flow: row nowrap; align-items: center; justify-content: flex-start;">
                              <Column>
                                {#if typeof selection2.fluid !== 'undefined'}
                                  <Dropdown
                                    id="input"
                                    size="sm"
                                    direction="top"
                                    titleText={selection2.title}
                                    selectedId={selection2.value}
                                    items={fluts}
                                    on:select={input0} />
                                {:else if typeof selection2.choices !== 'undefined'}
                                  <Dropdown
                                    id="input"
                                    size="sm"
                                    direction="top"
                                    titleText={selection2.title}
                                    selectedId={selection2.value}
                                    items={selection2.choices}
                                    on:select={choice} />
                                {:else if typeof selection2.positions !== 'undefined'}
                                  <Row style="height: 2rem;">
                                    <Column>
                                      <Tile class="bhead">
                                        <p class="descr">{selection2.title}</p>
                                      </Tile>
                                    </Column>
                                  </Row>
                                  <Row>
                                    <Column style="display:flex; flex-flow: column nowrap; align-items: flex-start; justify-content: flex-start;">
                                      {#each Array(4) as _, idx1}
                                        {#if selection2.bits > (idx1 * 8)}
                                          <Row>
                                            <Column style="width: 100%; display:flex; flex-flow: row nowrap; align-items: flex-start; justify-content: flex-start;">
                                              {#each selection2.positions as pos, idx2}
                                                {#if Math.floor(idx2 / 8) == idx1}
                                                  <div class="bit">
                                                    <Checkbox hideLabel checked={pos.value} on:check={(e) => check4(e, pos.id)} />
                                                  </div>
                                                {/if}
                                              {/each}
                                            </Column>
                                          </Row>
                                        {/if}
                                      {/each}
                                    </Column>
                                  </Row>
                                {:else if typeof selection2.selects !== 'undefined'}
                                  <Dropdown
                                    id="input"
                                    size="sm"
                                    direction="top"
                                    titleText="Value Select"
                                    selectedId={selection2.select}
                                    items={selection2.selects}
                                    on:select={select} />
                                {/if}
                              </Column>
                            </Row>
                          {/if}
                          {#if ((typeof selection2.fluid === 'undefined') && (typeof selection2.choices === 'undefined') &&
                            (typeof selection2.positions === 'undefined') && (typeof selection2.selects === 'undefined')) ||
                            ((typeof selection2.selects !== 'undefined') && (selection2.select == 1))}
                            <Row style="display:flex; flex-flow: row nowrap; align-items: center; justify-content: flex-start;">
                              <Column>
                                {#if selection2['type'].startsWith('int') || selection2['type'].startsWith('uint') ||
                                  selection2['type'].startsWith('float') || selection2['type'].startsWith('bit(')}
                                  <NumberInput
                                    id="input"
                                    min={getlim(selection2, 'min')}
                                    max={getlim(selection2, 'max')}
                                    step={
                                      (typeof selection2.multiplier !== 'undefined') && (selection2.multiplier < 1) ?
                                      selection2.multiplier : 1
                                    }
                                    label={selection2.title}
                                    invalidText={"Number must be between " + getlim(selection2, 'min') + " and " + getlim(selection2, 'max')}
                                    value={selection2.value}
                                    on:input={input1} />
                                {:else if selection2['type'].startsWith('chr(') || selection2['type'].startsWith('str')}
                                  <TextInput
                                    id="input"
                                    disabled={running}
                                    labelText={selection2.title}
                                    invalidText={"Text length must be between 0 and " + selection2.chrnum}
                                    value={selection2.value}
                                    on:input={input2} />
                                {/if}
                              </Column>
                            </Row>
                          {/if}
                        </Column>
                        <Column>
                          <Row style="display:flex; flex-flow: row nowrap; align-items: center; justify-content: space-between;">
                            <Column sm={5} md={5} lg={5}>
                              <Checkbox disabled={running || (selection1.disabledSim.indexOf(selection2.id) !== -1)} labelText="Custom ranges" bind:checked={ranges} on:check={check2} />
                            </Column>
                            <Column sm={5} md={5} lg={5}>
                              <NumberInput
                                id="min"
                                allowEmpty
                                min={getlim(selection2, 'min')}
                                max={getlim(selection2, 'max')}
                                disabled={!ranges}
                                label="Minimum"
                                invalidText={"Number must be between " + getlim(selection2, 'min') + " and " + getlim(selection2, 'max')}
                                value={getrng(selection2, 'min')}
                                on:input={input3} />
                            </Column>
                            <Column sm={5} md={5} lg={5}>
                              <NumberInput
                                id="max"
                                allowEmpty
                                min={getrng(selection2, 'min') !== null ? getrng(selection2, 'min') : getlim(selection2, 'min')}
                                max={getlim(selection2, 'max')}
                                disabled={!ranges}
                                label="Maximum"
                                invalidText={
                                  "Number must be between " +
                                  getrng(selection2, 'min') !== null ? getrng(selection2, 'min') : getlim(selection2, 'min') +
                                  " and " +
                                  getlim(selection2, 'max')}
                                value={getrng(selection2, 'max')}
                                on:input={input4} />
                            </Column>
                          </Row>
                          <Row style="display:flex; flex-flow: row nowrap; align-items: center; justify-content: space-between;">
                            <Column sm={5} md={5} lg={5}>
                              <Checkbox disabled={running || (selection1.disabledSim.indexOf(selection2.id) !== -1)} labelText="Custom simulation" bind:checked={custom} on:check={check3} />
                            </Column>
                            <Column sm={5} md={5} lg={5}>
                              <Dropdown
                                id="simulation"
                                allowEmpty
                                size="sm"
                                direction="top"
                                disabled={!custom}
                                titleText="Simulation"
                                selectedId={selection2.simulation !== null ? selection2.simulation : data.simulation}
                                items={sims}
                                on:select={setSim} />
                            </Column>
                            <Column sm={5} md={5} lg={5}>
                              <NumberInput
                                id="rate2"
                                allowEmpty
                                min={0.1}
                                max={5.0}
                                step={0.1}
                                disabled={!custom}
                                label="Rate of change (%)"
                                invalidText={"Number must be between 0.1% and 50%"}
                                value={selection2.rate !== null ? selection2.rate : data.rate}
                                on:input={setRate} />
                            </Column>
                          </Row>
                        </Column>
                      </Row>
                    </Grid>
                  </Column>
                </Row>
              {/if}
            {/if}
          </Column>
          <Column sm={3} md={3} lg={3} style="display: flex; flex-flow: column nowrap; justify-content: space-between;">
            <Row>
              <Column>
                <Row>
                  <Column>Operations</Column>
                </Row>
                <Row padding>
                  <Column>
                    <div class="buttons">
                      <Button disabled={running} iconDescription="Load table" icon={Open} on:click={load} />
                      <Button disabled={(rows1.length === 0) || running} iconDescription="Save table" icon={Save} on:click={save} />
                      <Button disabled={(selectedIds1.length === 0) || running} iconDescription="Delete message" icon={Delete} on:click={delRow} />
                      <Button disabled={(rows1.length === 0) || running} iconDescription="Clear table" icon={Empty} on:click={clrTab} />
                      <Button disabled={capturing || running} iconDescription="Start capturing" icon={Record} on:click={capStart} />
                      <Button disabled={!capturing} iconDescription="Stop capturing" icon={Stop} on:click={capStop} />
                    </div>
                  </Column>
                </Row>
              </Column>
            </Row>
            <Row>
              <Column>
                <Row>
                  <Column>Simulation</Column>
                </Row>
                <Row padding>
                  <Column style="display: flex; flex-flow: column nowrap; justify-content: flex-start;">
                    {#if loading}
                      <DropdownSkeleton />
                      <div style="height: 1rem;"></div>
                      <NumberInputSkeleton />
                      <div style="height: 1rem;"></div>
                      <CheckboxSkeleton />
                    {:else}
                      <Dropdown
                        size="sm"
                        titleText="Simulation mode"
                        disabled={(rows1.length === 0)}
                        bind:selectedId={data.simulation}
                        items={sims} />
                      <div style="height: 1rem;"></div>
                      <NumberInput
                        id="rate"
                        allowEmpty
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        label="Rate of change (%)"
                        invalidText={"Number must be between 0.1% and 50%"}
                        disabled={(rows1.length === 0) || (data.simulation === 3)}
                        value={data.rate}
                        on:input={input5} />
                      <div style="height: 1rem;"></div>
                      <Checkbox labelText="Relay mimic" bind:checked={data.mimic} on:check={setMimic} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    <div class="buttons">
                      <Button disabled={(selectedIds1.length === 0) || running} iconDescription="Send message" icon={Send} on:click={send} />
                      <Button disabled={(rows1.length === 0) || running || !repeat} iconDescription="Start simulation" icon={Start} on:click={simStart} />
                      <Button disabled={!running}  iconDescription="Stop simulation" icon={Pause} on:click={simStop} />
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
  .simcont {
    display: flex;
    flex-flow: column nowrap;
    justify-content: stretch;
    border: 1px solid gray;
    width: 100%;
    height: calc(100vh - 10rem);
  }
  .simcont .tilecont {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    height: -webkit-fill-available
  }
  .simcont .tilecont .left {
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;
    align-items: center;
    height: -webkit-fill-available
  }
  .simcont .tilecont .head {
    padding: 0 !important;
    width: 100%;
    height: 3.25rem;
  }
  .simcont .tilecont .title {
    font-size: 1.25rem;
  }
  .simcont .tilecont .descr {
    font-size: 0.8rem;
    color: #c6c6c6;
  }
  .simcont .tilecont .buttons {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: flex-start;
  }
  .simcont .tilecont .buttons button {
    margin: 0.2rem;
  }
  .simtab {
    max-height: calc(100% - 3.5rem);
    overflow-x: hidden;
    overflow-y: auto;
  }
  .simtab th:first-child,
  .simtab td:first-child {
    width: 3rem;
  }
  .simtab th:nth-child(3),
  .simtab td:nth-child(3) {
    text-align: center;
  }
  .simtab td:last-child {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .simtab .bx--form-item.bx--checkbox-wrapper {
    align-items: center;
  }
  .tabfld {
    max-height: calc(100% - 3.5rem);
    overflow-x: hidden;
    overflow-y: auto;
  }
  .tabfld th:first-child,
  .tabfld td:first-child,
  .tabfld th:nth-child(2),
  .tabfld td:nth-child(2) {
    width: 3rem;
  }
  .tabfld th:nth-child(2),
  .tabfld th:nth-child(4),
  .tabfld th:nth-child(6),
  .tabfld th:nth-child(7),
  .tabfld th:last-child,
  .tabfld td:nth-child(2),
  .tabfld td:nth-child(4),
  .tabfld td:nth-child(6),
  .tabfld td:nth-child(7),
  .tabfld td:last-child {
    text-align: center;
  }
  .tabfld td:nth-child(3) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tabfld .bx--form-item.bx--checkbox-wrapper {
    align-items: center;
  }
  .simcont button[type="button"],
  .simcont input[type="number"],
  .simcont input[type="text"] {
    font-size: 1rem;
  }
  .simcont .bx--dropdown__wrapper.bx--list-box__wrapper {
    width: 100%;
  }
  .simcont input[type="number"] {
    padding-right: 5.5rem;
  }
  .simcont .bx--form-item.bx--checkbox-wrapper:first-of-type {
    margin-top: 0;
  }
  .simcont  .bx--checkbox:indeterminate+.bx--checkbox-label::before {
    background-color: rgba(0,0,0,0);
  }
  .simcont  .bx--checkbox:indeterminate+.bx--checkbox-label::after {
    border-bottom: 2px solid gray;
  }
  .simcont .tilecont .bhead {
    padding: 0 !important;
    width: 100%;
    font-size: 0.8rem;
    color: #c6c6c6;
  }
  .simcont .bit {
    padding-right: 0.5rem;
  }
</style>
