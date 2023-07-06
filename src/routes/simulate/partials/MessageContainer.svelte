<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, DataTableSkeleton,
    PaginationSkeleton, DataTable, Pagination, Dropdown,
    DropdownSkeleton, ToolbarContent, ToolbarSearch, Toolbar } from "carbon-components-svelte";
  import { splitKey } from "../../../helpers/route";

  export let data;
  export let style;
  export let running;
  export let loading;

  const dispatch = createEventDispatcher();

  const headers = new Array(
    { key: 'pgn', value: 'PGN', sort: false },
    { key: 'title', value: 'Title', sort: false, width: '80%' },
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
  let selectedRowIds = new Array();
  let selection = null;
  let height;
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  function selRow(e) {
    if (JSON.stringify(selection) === JSON.stringify(e.detail)) {
      selectedRowIds = new Array();
      selection = null;
    }
  };

  function rowSel(e) {
    selection = e.detail.row;
  };

  function addRow(e) {
    dispatch("addrow", JSON.parse(JSON.stringify(selection)));
    selectedRowIds = new Array();
    selection = null;
  };

  function cancel(e) {
    dispatch("cancel", e.detail);
  };

  function getValue(rec, pro) {
    if (rec != null) {
      for (let i in rec.fields) {
        if (typeof rec.fields[i][pro] !== 'undefined') {
          return rec.fields[i].value;
        }
      }
    }
    return null;
  };

  function setValue(e, rec, pro) {
    if (rec != null) {
      for (let i in rec.fields) {
        if (typeof rec.fields[i][pro] !== 'undefined') {
          rec.fields[i].value = e.detail.selectedId;
        }
      }
    }
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
          <Column sm={13} md={13} lg={13}>
            {#if loading}
              <DataTableSkeleton showHeader={true} showToolbar={false} {headers} size="compact" rows={pagination.pageSize} />
              <PaginationSkeleton />
            {:else}
              <DataTable
                class="msgtab"
                size="compact"
                radio
                bind:selectedRowIds
                {headers}
                {rows}
                pageSize={pagination.pageSize}
                page={pagination.page}
                on:click:row={selRow}
                on:click:row--select={rowSel}>
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
                      }} />
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
          <Column sm={3} md={3} lg={3} style="display: flex; flex-flow: column nowrap; justify-content: space-between;">
            <Row>
              <Column>
                <Row>
                  <Column>Parameter(s)</Column>
                </Row>
                {#if selection != null} 
                  {#if getValue(selection, 'instance') != null}
                    <Row padding>
                      <Column>
                        {#if running}
                          <DropdownSkeleton />
                        {:else}
                          <Dropdown titleText="Data instance" size="sm" selectedId={getValue(selection, 'instance')} items={insts}
                            disabled={running} on:select={(e) => setValue(e, selection, 'instance')} />
                        {/if}
                      </Column>
                    </Row>
                  {/if}
                  {#if getValue(selection, 'fluid') != null}
                    <Row padding>
                      <Column>
                        {#if running}
                          <DropdownSkeleton />
                        {:else}
                          <Dropdown titleText="Fluid type" size="sm" selectedId={getValue(selection, 'fluid')} items={fluts}
                            disabled={running} on:select={(e) => setValue(e, selection, 'fluid')} />
                        {/if}
                      </Column>
                    </Row>
                  {/if}
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
                      <Button disabled={selectedRowIds.length == 0} style="margin: 0.2rem 0" on:click={addRow}>Add message</Button>
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
    max-width: 40%;
  }
  .msgtab td:last-child {
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
</style>
