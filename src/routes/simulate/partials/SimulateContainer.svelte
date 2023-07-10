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
    ranges = ((selection2.ranges.min !== null) && (selection2.ranges.max !== null));
    setTimeout(() => {
      document.getElementById('input').focus();
    }, 100);
  };

  function check2(e) {
    if (e.detail) {
      if (selection2.limits !== null) {
        selection2.ranges.min = selection2.limits.min;
        selection2.ranges.max = selection2.limits.max;
      }
    } else {
      selection2.ranges.min = null;
      selection2.ranges.max = null;
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

  function divSet(val) {
    let div = jq('.tabdiv');
    if (div.length > 0) {
      if (val === null) {
        div.css("height", "100%");
      } else {
        div.css("height", "75%");
      }
      if (selection2 !== null) {
        let len = jq('.tabfld tbody tr:last-child');
        if (len.length > 0) {
          let row = jq('.tabfld tbody tr:nth-child(' + (selection2.id + 1) + ')');
          if (row.length > 0) {


// console.log(div.offset().top, div.height(), jq('.tabfld').height())

            // div.animate({ scrollTop: div.height() * row.position().top / len.position().top }, 100);
            // div.animate({ scrollTop: div.offset().top + div.height() }, 100);
            // jq('.tabfld').animate({ scrollTop: div.height() * row.position().top / len.position().top }, 100);
            // jq('.tabfld').animate({ scrollTop: 260 }, 100);

            setTimeout(() => {
              let elm = document.querySelectorAll('.tabfld tr');
              elm[selection2.id + 1].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            }, 150);
          }
        }
      }
    }
  }

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i, text: i.toString() });
  }

  $: data, setData(data);
  $: selection1, filter(selection2);
  $: selection2, divSet(selection2);
</script>

<div class="simcont" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row style="height: inherit;">
          <Column sm={13} md={13} lg={13} class="left">
            <Row style="height: 39vh;">
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
              <Row style="height: 39vh;">
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
                              {#if (row.ranges.min !== null) || (row.ranges.max !== null)}
                                {(row.ranges.min !== null ? row.ranges.min + " " : "")  + "-" + (row.ranges.max !== null ? " " + row.ranges.max : "")}
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
                                  {#if selection2['type'].startsWith('int') || selection2['type'].startsWith('uint') ||
                                    selection2['type'].startsWith('float') || selection2['type'].startsWith('bit(')}
                                    <NumberInput
                                      id="input"
                                      min={selection2.limits.min}
                                      max={selection2.limits.max}
                                      disabled={running}
                                      label={selection2.title}
                                      invalidText={"Number must be between " + selection2.limits.min + " and " + selection2.limits.max}
                                      value={selection2.value}
                                      on:input={input1} />
                                  {:else if selection2['type'].startsWith('chr(') || selection2['type'].startsWith('str')}
                                    <TextInput
                                      id="input"
                                      disabled={running}
                                      labelText={selection2.title}
                                      invalidText={"Text length must be between 0 and " + selection2.character}
                                      value={selection2.value}
                                      on:input={input2} />
                                  {/if}
                                </Column>
                                <Column sm={3} md={3} lg={3}>
                                  <Checkbox labelText="Custom ranges" bind:checked={ranges} on:check={check2} />
                                </Column>
                                <Column sm={4} md={4} lg={4} style="display:flex; flex-flow: row nowrap; align-items: center;">
                                  <NumberInput
                                    id="min"
                                    allowEmpty
                                    min={selection2.limits.min}
                                    max={selection2.limits.max}
                                    disabled={running || !ranges}
                                    label="Minimum"
                                    invalidText={"Number must be between " + selection2.limits.min + " and " + selection2.limits.max}
                                    value={selection2.ranges.min}
                                    on:input={input1} />
                                </Column>
                                <Column sm={4} md={4} lg={4} style="display:flex; flex-flow: row nowrap; align-items: center;">
                                  <NumberInput
                                    id="max"
                                    allowEmpty
                                    min={selection2.ranges.min}
                                    max={selection2.limits.max}
                                    disabled={running || !ranges}
                                    label="Maximum"
                                    invalidText={"Number must be between " + selection2.ranges.min + " and " + selection2.limits.max}
                                    value={selection2.ranges.max}
                                    on:input={input1} />
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
    height: 100%; display: flex; flex-flow: column nowrap; justify-content: space-between;
  }
  .tabdiv {
    height: 100%;
  }
  .tabfld {
    max-height: calc(100% - 3.5rem);
    overflow-x: hidden;
    overflow-y: auto;
  }
  .tabfld th:first-child,
  .tabfld td:first-child {
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
  .simcont input[type="number"],
  .simcont input[type="text"] {
    font-size: 1rem;
  }
  .simcont .detdiv .field {
    padding-right: 1rem;
  }
  .simcont .detdiv .field.disabled {
    color: #525252;
  }

</style>
