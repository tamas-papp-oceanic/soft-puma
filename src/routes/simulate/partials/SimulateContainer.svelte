<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column,
    DataTableSkeleton, DataTable, NumberInput, NumberInputSkeleton,
    TextInput, Dropdown, DropdownSkeleton, Checkbox } from "carbon-components-svelte";
  import Delete from "carbon-icons-svelte/lib/RowDelete16";
  import Open from "carbon-icons-svelte/lib/Document16";
  import Save from "carbon-icons-svelte/lib/Save16";
  import Empty from "carbon-icons-svelte/lib/Delete16";
  import Send from "carbon-icons-svelte/lib/SkipForward16";
  import Start from "carbon-icons-svelte/lib/Play16";
  import Stop from "carbon-icons-svelte/lib/Pause16";

  export let data;
  export let style;
  export let loading;
  export let running;
  export let success;

  const dispatch = createEventDispatcher();

  const header1 = new Array(
    { key: 'pgn', value: 'PGN', sort: false },
    { key: 'instance', value: 'Instance', display: (item) => item != null ? item : '-', sort: false },
    { key: 'fluidtype', value: 'Fluid', display: (item) => item != null ? getFlu(item) : '-', sort: false },
    { key: 'title', value: 'Title', sort: false, width: '55%' },
  );
  const header2 = new Array(
    { key: 'field', value: 'Field', sort: false },
    { key: 'title', value: 'Title', width: '35%', sort: false },
    { key: 'value', value: 'Value', sort: false },
    { key: 'unit', value: 'Unit', sort: false },
    { key: 'ranges', value: 'Ranges', sort: false },
    { key: 'static', value: 'Static', sort: false },
  );
  let insts = new Array();
  let fluts = [
    { id: 0, text: 'Fuel' },
    { id: 1, text: 'Fresh Water' },
    { id: 2, text: 'Waste Water' },
    { id: 3, text: 'Live Well' },
    { id: 4, text: 'Oil' },
    { id: 5, text: 'Black Water (Sewage)' },
    { id: 6, text: 'Fuel (Gasoline)' },
  ];
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
  let simulation = 0;

  function getFlu(id) {
    for (let i in fluts) {
      if (fluts[i].id == id) {
        return fluts[i].text;
      }
    }
    return null;
  };

  function rowSel1(e) {
    selection1 = e.detail.row;
    selectedIds2 = new Array();
    selection2 = null;
  };

  function rowSel2(e) {
    selection2 = e.detail.row;
    ranges = selection2.ranges !== null;
    setTimeout(() => {
      document.getElementById('input').focus();
    }, 100);
  };

  function check2(e) {
    for (let i in  data.table) {
      if (data.table[i].id == selection1.id) {
        if (e.detail) {
          if (selection2.limits !== null) {
            let rgs = { min: selection2.limits.min, max: selection2.limits.max };
            selection2.ranges = rgs;
            data.table[i].fields[selection2.id].ranges = rgs;
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

  function input1(e) {
    if (e.detail != null) {
      for (let i in data.table) {
        if (data.table[i].id == selection1.id) {
          data.table[i].fields[selection2.id].value = parseFloat(e.detail);
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

  function delRow(e) {
    dispatch("delrow", selection1);
    selectedIds1 = new Array();
    selection1 = null;
  };

  function load() {
    dispatch("load");
  };

  function save(e) {
    dispatch("save");
  };

  function clrTab(e) {
    dispatch("clrtab");
    selectedIds1 = new Array();
    selection1 = null;
  };

  function setSim(e) {
    dispatch("setsim", e.detail);
  };

  function send(e) {
    dispatch("send", selection1);
  };

  function start(e) {
    selectedIds2 = new Array();
    selection2 = null;
    dispatch("start");
  };      
  
  function stop(e) {
    dispatch("stop");
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
    let arr = new Array();
    if (val != null) {
      simulation = val.simulation != null ? val.simulation : 0;
      let dat = JSON.parse(JSON.stringify(val.table));
      for (let i in dat) {
        arr.push(dat[i]);
      }
    }
    rows1 = JSON.parse(JSON.stringify(arr));
  };

  function filter() {
    let arr = new Array();
    if (selection1 !== null) {
      for (let i in data.table) {
        if (data.table[i].id == selection1.id) {
          selection1 = data.table[i];
          break;
        }
      }
      arr = JSON.parse(JSON.stringify(selection1.fields));
    }
    rows2 = JSON.parse(JSON.stringify(arr));
    if (selection2 !== null) {
      for (let i in rows2) {
        if (rows2[i].id == selection2.id) {
          selection2 = rows2[i];
          break;
        }
      }
    }
  }

  function divSet(val) {
    let div = document.querySelector('.tabdiv');
    if (div !== null) {
      if (val === null) {
        div.style.height = "100%";
      } else {
        div.style.height = "75%"
      }
      if (val !== null) {
        setTimeout(() => {
          let elm = document.querySelectorAll('.tabfld tr');
          elm[val.id + 1].scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 150);
      }
    }
  }

  function clrSel1(val) {
    if (val) {
      selectedIds1 = new Array();
      selection1 = null;
    }
  }

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i, text: i.toString() });
  }

  $: data, setData(data);
  $: data, filter();
  $: selection1, filter();
  $: selection2, divSet(selection2);
  $: running, divSet(running ? null : selection2);
  $: success, clrSel1(success);
</script>

<div class="simcont" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row style="height: inherit;">
          <Column sm={13} md={13} lg={13} class="left">
            <Row style="height: 49%;">
              <Column style="height: 100%;">
                <div class="seldiv">
                  <Tile class="head">
                    <h4 class="title">NMEA2000 message(s) as part of simulation.</h4>
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
                </div>
              </Column>
            </Row>
            {#if selection1 != null}
              <Row style="height: 49%;">
                <Column style="height: 100%;">
                  <div class="flddiv">
                    <div class="tabdiv">
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
                          <svelte:fragment slot="cell" let:row let:rowIndex let:cell let:cellIndex>
                            {#if (row.dictionary === 'DD001')}
                              {#if (cell.key === "value") || (cell.key === "unit")}
                                {"-"}
                              {:else if cell.key === "ranges"}
                                {"-"}
                              {:else if cell.key === "static"}
                                {""}
                              {:else}
                                {cell.value}
                              {/if}
                            {:else if ((cell.key === "unit") && (cell.value === null))}
                              {"-"}
                            {:else if cell.key === "ranges"}
                              {#if row.ranges !== null}
                                {(row.ranges.min !== null ? row.ranges.min + " " : "")  + "-" + (row.ranges.max !== null ? " " + row.ranges.max : "")}
                              {:else}
                                {"-"}
                              {/if}
                            {:else if cell.key === "static"}
                              {#if row.static != null}
                                <Checkbox labelText="Static" hideLabel checked={row.static} on:check={(e) => setSta(e, rowIndex)} />
                              {:else}
                                {""}
                              {/if}
                            {:else}
                              {cell.value}
                            {/if}
                          </svelte:fragment>
                        </DataTable>
                      {/if}
                    </div>
                    {#if !running && (selection2 != null)}
                      <div class="detdiv">
                        <Grid fullWidth noGutter>
                          <Row>
                            <Column>
                              <Row style="display:flex; flex-flow: row nowrap; align-items: center;">
                                <Column style="display:flex; flex-flow: row nowrap; align-items: center;">
                                  {#if typeof selection2.fluid !== 'undefined'}
                                    <Dropdown
                                      id="input"
                                      size="sm"
                                      direction="top"
                                      titleText={selection2.title}
                                      selectedId={selection2.value}
                                      items={fluts}
                                      on:select={input0} />
                                  {:else if selection2['type'].startsWith('int') || selection2['type'].startsWith('uint') ||
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
                                <Column sm={3} md={3} lg={3}>
                                  <Checkbox disabled={running} labelText="Custom ranges" bind:checked={ranges} on:check={check2} />
                                </Column>
                                <Column sm={4} md={4} lg={4} style="display:flex; flex-flow: row nowrap; align-items: center;">
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
                                <Column sm={4} md={4} lg={4} style="display:flex; flex-flow: row nowrap; align-items: center;">
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
                            </Column>
                          </Row>
                        </Grid>
                      </div>
                    {/if}
                  </div>
                </Column>
              </Row>
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
                      <Button disabled={(rows1.length == 0) || running} iconDescription="Save table" icon={Save} on:click={save} />
                      <Button disabled={(selectedIds1.length == 0) || running} iconDescription="Delete message" icon={Delete} on:click={delRow} />
                      <Button disabled={(rows1.length == 0) || running} iconDescription="Clear table" icon={Empty} on:click={clrTab} />
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
                      <NumberInputSkeleton />
                      <div style="height: 1rem;"></div>
                      <DropdownSkeleton />
                    {:else}
                      <NumberInput
                        id="rate"
                        allowEmpty
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        label="Rate of change (%)"
                        invalidText={"Number must be between 0.1% and 50%"}
                        disabled={simulation === 3}
                        value={data.rate}
                        on:input={input5} />
                      <div style="height: 1rem;"></div>
                      <Dropdown titleText="Simulation mode" size="sm" bind:selectedId={simulation} items={sims} on:select={setSim} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    <div class="buttons">
                      <Button disabled={(selectedIds1.length == 0) || running} iconDescription="Send message" icon={Send} on:click={send} />
                      <Button disabled={(rows1.length == 0) || running} iconDescription="Start simulation" icon={Start} on:click={start} />
                      <Button disabled={!running}  iconDescription="Stop simulation" icon={Stop} on:click={stop} />
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
  .flddiv {
    height: 100%; display: flex; flex-flow: column nowrap; justify-content: space-between;
  }
  .seldiv, .tabdiv {
    height: 100%;
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
  .tabfld th:last-child,
  .tabfld td:nth-child(2),
  .tabfld td:nth-child(4),
  .tabfld td:nth-child(6) {
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
  .simcont .detdiv .field {
    padding-right: 1rem;
  }
  .simcont .detdiv .field.disabled {
    color: #525252;
  }

</style>
