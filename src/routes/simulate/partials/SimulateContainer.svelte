<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column,
    DataTableSkeleton, DataTable, NumberInput, TextInput, Dropdown,
    DropdownSkeleton, Checkbox } from "carbon-components-svelte";
  import jq from "jquery";

  export let data;
  export let style;
  export let running;
  export let loading;

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
    { key: 'range', value: 'Range', sort: false },
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
  let filteredIds2 = new Array();
  let selection1 = null;
  let selection2 = null;
  let range2 = false;
  let fldhgt = 100;
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
    for (let i in selection1.fields) {
      let fid = selection1.fields[i].id;
      if (fid !== selection2.id) {
        filteredIds2.push(fid);
      }
    }
    setTimeout(() => {
      document.getElementById('input').focus();
    }, 100);
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

  function input1(e) {
    if (e.detail != null) {
      for (let i in data) {
        if (data[i].id == selection1.id) {
          selection1.fields[selection2.id].value = parseFloat(e.detail);
          break;
        }
      }
    }
  };

  function input2(e) {
    if (e.detail != null) {
      for (let i in data) {
        if (data[i].id == selection1.id) {
          selection1.fields[selection2.id].value = e.detail;
          break;
        }
      }
    }
  };

  function setSim(e) {
    dispatch("setsim", e.detail);
  };

  function delRow(e) {
    dispatch("delrow", selection1);
    selectedIds1 = new Array();
    selection1 = null;
  };

  function clrTab(e) {
    dispatch("clrtab");
    selectedIds1 = new Array();
    selection1 = null;
  };

  function start(e) {
    dispatch("start");
  };    
  
  function stop(e) {
    dispatch("stop");
  };

  function send(e) {
    dispatch("send", selection1);
  };

  function cancel(e) {
    dispatch("cancel", e.detail);
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

  function filter(val) {
    let arr = new Array();
    if (selection1 !== null) {
      arr = JSON.parse(JSON.stringify(selection1.fields));
    }
    rows2 = JSON.parse(JSON.stringify(arr));
  }

  function hgtSet(val) {
    let div = jq('.flddiv');
    let elh = 0;
    if (div.length > 0) {
      if (val === null) {
        div.css("height", "100%");
      } else {
        div.css("height", "80%");
      }
    }
    let tab = jq('.fldtab');
    if (tab.length > 0) {
      elh = tab.height();
    }
//     let row = jq('.fldtab tbody tr:last-child');
//     if (row.length > 0) {
//       let top = row.position().top;


// console.log(elh, top)

//       tab.scrollTop(elh);
//     }
  }

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i, text: i.toString() });
  }

  $: data, setData(data);
  $: selection1, filter(selection2);
  $: selection2, hgtSet(selection2);
</script>

<div class="simcont" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row style="height: inherit;">
          <Column sm={13} md={13} lg={13} class="left">
            <Row style="height: 49%;">
              <Column style="height: 100%;">
                <div>
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
                <Column style="height: 100%; display: flex; flex-flow: column nowrap; justify-content: space-between;">
                  <div class="flddiv">
                    <Tile class="head">
                      <h4 class="title">Message fields.</h4>
                      <p class="descr">(select field for setting values)</p>
                    </Tile>
                    {#if loading}
                      <DataTableSkeleton showHeader={false} showToolbar={false} headers={header2} size="compact" rows={10} />
                    {:else}
                      <DataTable
                        class="fldtab"
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
                            {:else if cell.key === "range"}
                              {"-"}
                            {:else if cell.key === "static"}
                              {""}
                            {:else}
                              {cell.value}
                            {/if}
                          {:else if ((cell.key === "unit") && (cell.value === null))}
                            {"-"}
                          {:else if cell.key === "range"}
                            {#if (row.range.min !== null) || (row.range.max !== null)}
                              {(row.range.min !== null ? row.range.min + " " : "")  + "-" + (row.range.max !== null ? " " + row.range.max : "")}
                            {:else}
                              {"-"}
                            {/if}
                          {:else if cell.key === "static"}
                            {#if selection1.disabledIds.indexOf(rowIndex) === -1}
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
                  {#if selection2 != null}
                    <div class="detdiv">
                      <Grid fullWidth noGutter>
                        <Row>
                          <Column>
                            <Row style="display:flex; flex-flow: row nowrap; align-items: center;">
                              <Column style="display:flex; flex-flow: row nowrap; align-items: center;">
                                <span>{selection2.title}:&nbsp;</span>
                                {#if selection2['type'].startsWith('int') || selection2['type'].startsWith('uint') ||
                                  selection2['type'].startsWith('float') || selection2['type'].startsWith('bit(')}
                                  <NumberInput
                                    id="input"
                                    min={selection2.limits.min}
                                    max={selection2.limits.max}
                                    disabled={running}
                                    label={selection2.title}
                                    hideLabel
                                    invalidText={"Number must be between " + selection2.limits.min + " and " + selection2.limits.max}
                                    value={selection2.value}
                                    on:input={input1} />
                                {:else if selection2['type'].startsWith('chr(') || selection2['type'].startsWith('str')}
                                  <TextInput
                                    id="input"
                                    disabled={running}
                                    labelText={selection2.title}
                                    hideLabel
                                    invalidText={"Text length must be between 0 and " + selection2.character}
                                    value={selection2.value}
                                    on:input={input2} />
                                {/if}
                              </Column>
                              <Column sm={2} md={2} lg={2}>
                                <Checkbox labelText="Custom range" bind:checked={range2} />
                              </Column>
                              <Column sm={4} md={4} lg={4} style="display:flex; flex-flow: row nowrap; align-items: center;">
                                <span>Minimum:&nbsp;</span>
                                <NumberInput
                                  id="min"
                                  allowEmpty
                                  min={selection2.limits.min}
                                  max={selection2.limits.max}
                                  disabled={running || !range2}
                                  label="Minimum"
                                  hideLabel
                                  invalidText={"Number must be between " + selection2.limits.min + " and " + selection2.limits.max}
                                  value={selection2.range.min}
                                  on:input={input1} />
                              </Column>
                              <Column sm={4} md={4} lg={4} style="display:flex; flex-flow: row nowrap; align-items: center;">
                                <span>Maximum:&nbsp;</span>
                                <NumberInput
                                  id="max"
                                  allowEmpty
                                  min={selection2.range.min}
                                  max={selection2.limits.max}
                                  disabled={running || !range2}
                                  label="Maximum"
                                  hideLabel
                                  invalidText={"Number must be between " + selection2.range.min + " and " + selection2.limits.max}
                                  value={selection2.range.max}
                                  on:input={input1} />
                              </Column>
                            </Row>
                          </Column>
                        </Row>
                      </Grid>
                    </div>
                  {/if}
                </Column>
              </Row>
            {/if}
          </Column>
          <Column sm={3} md={3} lg={3} style="display: flex; flex-flow: column nowrap; justify-content: space-between;">
            <Row>
              <Column>
                <Row>
                  <Column>Operation</Column>
                </Row>
                <Row padding>
                  <Column>
                    <ButtonSet stacked style="padding: 0.2rem;">
                      <Button disabled={(selectedIds1.length == 0) || running} style="margin: 0.2rem 0" on:click={delRow}>Delete message</Button>
                      <Button disabled={(rows1.length == 0) || running} style="margin: 0.2rem 0" on:click={clrTab}>Clear table</Button>
                    </ButtonSet>
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
                  <Column>
                    {#if loading}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={running} titleText="Simulation mode" size="sm" bind:selectedId={simulation} items={sims} on:select={setSim} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    <ButtonSet stacked style="padding: 0.2rem;">
                      <Button style="margin: 0.2rem 0" disabled={(selectedIds1.length == 0) || running} on:click={send}>Send message</Button>
                      <Button style="margin: 0.2rem 0" disabled={(rows1.length == 0) || running} on:click={start}>Start simulation</Button>
                      <Button style="margin: 0.2rem 0" disabled={!running} on:click={stop}>Stop simulation</Button>
                    </ButtonSet>
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
  .simtab {
    max-height: 84%;
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
    height: 100%;
  }
  .fldtab {
    max-height: calc(100% - 3.5rem);;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .fldtab th:first-child,
  .fldtab td:first-child {
    width: 3rem;
  }
  .fldtab th:nth-child(2),
  .fldtab th:nth-child(4),
  .fldtab th:nth-child(6),
  .fldtab th:last-child,
  .fldtab td:nth-child(2),
  .fldtab td:nth-child(4),
  .fldtab td:nth-child(6) {
    text-align: center;
  }
  .fldtab td:nth-child(3) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fldtab .bx--form-item.bx--checkbox-wrapper {
    align-items: center;
  }
  .msgcont input[type="number"],
  .msgcont input[type="text"] {
    font-size: 1rem;
  }
  .simtab .detdiv {
    padding-top: 1rem;
  }
</style>
