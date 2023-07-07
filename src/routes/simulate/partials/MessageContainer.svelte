<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column,
    DataTableSkeleton, PaginationSkeleton, DataTable,
    Pagination, ToolbarContent, ToolbarSearch, Toolbar,
    NumberInput, TextInput } from "carbon-components-svelte";
  import { splitKey } from "../../../helpers/route";

  export let data;
  export let style;
  export let running;
  export let loading;

  const dispatch = createEventDispatcher();

  const header1 = new Array(
    { key: 'pgn', value: 'PGN', sort: false },
    { key: 'title', value: 'Title', sort: false, width: '70%' },
  );
  const header2 = new Array(
    { key: 'field', value: 'Field', sort: false },
    { key: 'title', value: 'Title', width: '45%', sort: false },
    { key: 'value', value: 'Value', width: '20%', sort: false },
    { key: 'unit', value: 'Unit', sort: false },
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
  let rows = new Array();
  let filteredRowIds = new Array();
  let selectedIds1 = new Array();
  let selectedIds2 = new Array();
  let selection1 = null;
  let selection2 = null;
  let height;
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  function search(e) {
    pagination.page = 1;
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

  function addRow1(e) {
    dispatch("addrow", JSON.parse(JSON.stringify(selection1)));
    selectedIds1 = new Array();
    selectedIds2 = new Array();
    selection1 = null;
    selection2 = null;
  };

  function cancel(e) {
    dispatch("cancel", e.detail);
  };

  function setData(val) {
    let arr = new Array();
    if (val != null) {
      let dat = JSON.parse(JSON.stringify(val));
      for (let i in dat) {
        let spl = splitKey(dat[i].id);
        dat[i].pgn = spl.pgn;
        arr.push(dat[i]);
      }
    }
    rows = JSON.parse(JSON.stringify(arr));
  };

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i, text: i.toString() });
  }

  $: data, setData(data);
  $: pagination.totalItems = filteredRowIds.length;
  $: pagination.pageSize = Math.round((height / getComputedStyle(document.documentElement).fontSize.replace('px', '')) / 2) - 7;
</script>

<svelte:window bind:innerHeight={height} />
<div class="msgcont" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row style="height: inherit;">
          <Column sm={9} md={9} lg={9}>
            {#if loading}
              <DataTableSkeleton showHeader={true} showToolbar={false} headers={header1} size="compact" rows={pagination.pageSize} />
              <PaginationSkeleton />
            {:else}
              <DataTable
                class="msgtab"
                size="compact"
                radio
                bind:selectedRowIds={selectedIds1}
                headers={header1}
                {rows}
                pageSize={pagination.pageSize}
                page={pagination.page}
                on:click:row={selRow1}
                on:click:row--select={rowSel1}>
                <Toolbar>
                  <ToolbarContent>
                    <Tile class="head">
                      <h4 class="title">NMEA2000 message(s) for simulation.</h4>
                      <p class="descr">(select message for change of parameter(s) or add to simulaton)</p>
                    </Tile>
                    <ToolbarSearch
                      bind:filteredRowIds
                      shouldFilterRows={(row, value) => {
                        return (
                          row.pgn.toLowerCase().includes(value.toLowerCase()) ||
                          row.title.toLowerCase().includes(value.toLowerCase())
                        );
                      }}
                      on:focus={search} />
                  </ToolbarContent>
                </Toolbar>
              </DataTable>
              {#if pagination.totalItems > pagination.pageSize}
                <Pagination
                  bind:pageSize={pagination.pageSize}
                  totalItems={pagination.totalItems}
                  bind:page={pagination.page}
                  pageSizeInputDisabled
                />
              {/if}
            {/if}
          </Column>
          <Column sm={7} md={7} lg={7} style="display: flex; flex-flow: column nowrap; justify-content: space-between;">
            <Row>
              <Column>
                <Row>
                  <Column>Fields</Column>
                </Row>
                {#if selection1 != null}
                  <Row padding>
                    <Column>
                      <DataTable
                        class="fldtab"
                        size="compact"
                        radio
                        nonSelectableRowIds={selection1.disabledIds}
                        bind:selectedRowIds={selectedIds2}
                        headers={header2}
                        rows={selection1.fields}
                        on:click:row--select={rowSel2}>
                        <svelte:fragment slot="cell" let:row let:cell let:cellIndex>
                          {((row.dictionary == 'DD001') && (cellIndex == 2)) || ((cellIndex == 3) && (cell.value == null)) ? '-' : cell.value}
                        </svelte:fragment>
                      </DataTable>
                    </Column>
                  </Row>
                {/if}
              </Column>
            </Row>
            <Row>
              <Column>
                {#if selection2 != null}
                  <Row>
                    {#if selection2['type'].startsWith('int') || selection2['type'].startsWith('uint') ||
                      selection2['type'].startsWith('float') || selection2['type'].startsWith('bit(')}
                      <Column sm={8} md={8} lg={8}>
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
                  </Row>
                {/if}
              </Column>
            </Row>
            <Row>
              <Column>
                <Row>
                  <Column>Operation</Column>
                </Row>
                <Row padding>
                  <Column>
                    <ButtonSet stacked style="padding: 0.2rem;">
                      <Button disabled={selectedIds1.length == 0} style="margin: 0.2rem 0" on:click={addRow1}>Add message</Button>
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
  .msgcont {
    display: flex;
    flex-flow: column nowrap;
    justify-content: stretch;
    border: 1px solid gray;
    width: 100%;
  }
  .msgcont .tilecont {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    height: 100%;
  }
  .msgcont .bx--toolbar-content {
    justify-content: space-between;
    height: 3.75rem;
  }
  .msgcont .tilecont .head {
    padding: 0.125rem 0 1em 0 !important;
    width: 60%;
  }
  .msgcont .tilecont .title {
    font-size: 1.25rem;
  }
  .msgcont .tilecont .descr {
    font-size: 0.8rem;
    color: #c6c6c6;
  }
  .msgcont .bx--toolbar-search-container-active.bx--search {
    width: 30%;
  }
  .msgtab tbody td:last-child {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .msgtab .bx--data-table-header {
    padding: 0 0 1em 0;
  }
  .msgtab .bx--data-table-header__title {
    font-size: 1.25rem;
  }
  .msgtab .bx--data-table-header__description {
    font-size: 0.85rem;
  }
  .fldtab tbody td:nth-child(3) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fldtab {
    max-height: 30vh;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .msgcont input[type="number"],
  .msgcont input[type="text"] {
    font-size: 1rem;
  }
</style>
