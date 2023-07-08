<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column,
    DataTableSkeleton, DataTable, NumberInput, TextInput, Dropdown,
    DropdownSkeleton, Checkbox } from "carbon-components-svelte";

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
  let rows = new Array();
  let selectedIds1 = new Array();
  let selectedIds2 = new Array();
  let selection1 = null;
  let selection2 = null;
  let simulation = 0;

  function getFlu(id) {
    for (let i in fluts) {
      if (fluts[i].id == id) {
        return fluts[i].text;
      }
    }
    return null;
  };

  function selRow1(e) {
    if (JSON.stringify(selection1) === JSON.stringify(e.detail)) {
      selectedIds1 = new Array();
      selectedIds2 = new Array();
      selection1 = null;
      selection2 = null;
    }
  };

  function rowSel1(e) {
    selection1 = e.detail.row;
    selectedIds2 = new Array();
    selection2 = null;
  };

  function rowSel2(e) {
    selection2 = e.detail.row;
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
    rows = JSON.parse(JSON.stringify(arr));
  };

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i, text: i.toString() });
  }

  $: data, setData(data);
</script>

<div class="simcont" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row style="height: inherit;">
          <Column sm={13} md={13} lg={13} class="left">
            <Row style="height: 48%;">
              <Column style="height: 100%;">
                <Tile class="head">
                  <h4 class="title">NMEA2000 message(s) as part of simulation.</h4>
                  <p class="descr">(select message for setting field values)</p>
                </Tile>
              {#if loading}
                  <DataTableSkeleton showHeader={false} showToolbar={false} headers={header1} size="compact" rows={20} />
                {:else}
                <!-- title="NMEA2000 message(s) as part of simulation."
                description="(select message for setting field values)" -->
                  <DataTable
                    class="simtab"
                    size="compact"
                    radio
                    bind:selectedRowIds={selectedIds1}
                    headers={header1}
                    {rows}
                    on:click:row={selRow1}
                    on:click:row--select={rowSel1}>
                  </DataTable>
                {/if}
              </Column>
            </Row>
            {#if selection1 != null}
              <Row style="height: 48%;">
                <Column style="height: 100%;">
                  <Tile class="head">
                    <h4 class="title">Message fields.</h4>
                    <p class="descr">(select field for setting values)</p>
                  </Tile>
                  {#if loading}
                    <DataTableSkeleton showHeader={false} showToolbar={false} headers={header2} size="compact" rows={20} />
                  {:else}
                  <!-- title="Message fields."
                  description="(select field for setting values)" -->
                    <DataTable
                      class="fldtab"
                      size="compact"
                      radio
                      nonSelectableRowIds={selection1.disabledIds}
                      bind:selectedRowIds={selectedIds2}
                      headers={header2}
                      rows={selection1.fields}
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
                </Column>
              </Row>
            {/if}
            {#if selection2 != null}
              <Row>
                <Column>
                  <Row>
                    {#if selection2['type'].startsWith('int') || selection2['type'].startsWith('uint') ||
                      selection2['type'].startsWith('float') || selection2['type'].startsWith('bit(')}
                      <Column sm={3} md={3} lg={3}>
                        <NumberInput
                          id="input"
                          min={selection2.limits.min}
                          max={selection2.limits.max}
                          disabled={running}
                          label={selection2.title}
                          invalidText={"Number must be between " + selection2.limits.min + " and " + selection2.limits.max}
                          value={selection2.value}
                          on:input={input1} />
                      </Column>
                    {:else if selection2['type'].startsWith('chr(') || selection2['type'].startsWith('str')}
                      <Column>
                        <TextInput
                          id="input"
                          disabled={running}
                          labelText={selection2.title}
                          invalidText={"Text length must be between 0 and " + selection2.character}
                          value={selection2.value}
                          on:input={input2} />
                      </Column>
                    {/if}
                    <Column></Column>
                    <Column sm={3} md={3} lg={3}>
                      <NumberInput
                        id="min"
                        min={selection2.limits.min}
                        max={selection2.limits.max}
                        disabled={running}
                        label="Minimum"
                        invalidText={"Number must be between " + selection2.limits.min + " and " + selection2.limits.max}
                        value={selection2.range.min}
                        on:input={input1} />
                    </Column>
                    <Column></Column>
                    <Column sm={3} md={3} lg={3}>
                      <NumberInput
                        id="max"
                        min={selection2.range.min}
                        max={selection2.limits.max}
                        disabled={running}
                        label="Maximum"
                        invalidText={"Number must be between " + selection2.range.min + " and " + selection2.limits.max}
                        value={selection2.range.max}
                        on:input={input1} />
                    </Column>
                  </Row>
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
                      <Button disabled={(rows.length == 0) || running} style="margin: 0.2rem 0" on:click={clrTab}>Clear table</Button>
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
                      <Button style="margin: 0.2rem 0" disabled={(rows.length == 0) || running} on:click={start}>Start simulation</Button>
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
</style>
