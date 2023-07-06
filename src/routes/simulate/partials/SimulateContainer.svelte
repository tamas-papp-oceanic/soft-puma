<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, DataTableSkeleton,
    PaginationSkeleton, DataTable, Pagination, Dropdown,
    DropdownSkeleton } from "carbon-components-svelte";

  export let data;
  export let style;
  export let running;
  export let loading;

  const dispatch = createEventDispatcher();

  const headers = new Array(
    { key: 'pgn', value: 'PGN', sort: false },
    { key: 'instance', value: 'Instance', sort: false },
    { key: 'fluidtype', value: 'Fluid', display: (item) => item == null ? null : getFlu(item), sort: false },
    { key: 'title', value: 'Title', sort: false, width: '55%' },
  );
  const sims = new Array(
    { id: 0, text: 'Static' },
    { id: 1, text: 'Incremental' },
    { id: 2, text: 'Decremental' },
    { id: 3, text: 'Natural' },
    { id: 4, text: 'Random' },
  );
  let insts = new Array();
  const fluts = [
    { id: 0, text: 'Fuel' },
    { id: 1, text: 'Fresh Water' },
    { id: 2, text: 'Waste Water' },
    { id: 3, text: 'Live Well' },
    { id: 4, text: 'Oil' },
    { id: 5, text: 'Black Water (Sewage)' },
    { id: 6, text: 'Fuel (Gasoline)' },
  ];
  let rows = new Array();
  let selectedRowIds = new Array();
  let selection = null;
  let simulation = 0;
  let height;
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  function getFlu(id) {
    for (let i in fluts) {
      if (fluts[i].id == id) {
        return fluts[i].text;
      }
    }
    return null;
  };

  function setSim(e) {
    dispatch("setsim", e.detail);
  };

  function start(e) {
    dispatch("start");
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

  function delRow(e) {
    dispatch("delrow", selection);
    selectedRowIds = new Array();
    selection = null;
};

  function clrTab(e) {
    dispatch("clrtab");
    selectedRowIds = new Array();
    selection = null;
};

  function stop(e) {
    dispatch("stop");
  };

  function send(e) {
    dispatch("send", selection);
  };
  function cancel(e) {
    dispatch("cancel");
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
  $: pagination.totalItems = rows.length;
  $: pagination.pageSize = Math.round((height / getComputedStyle(document.documentElement).fontSize.replace('px', '')) / 2) - 7;
</script>

<svelte:window bind:innerHeight={height} />
<div class="simcont" style={style}>
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
                class="simtab"
                size="compact"
                radio
                title="NMEA2000 message(s) as part of simulation."
                description="(select message for individual operation)"
                {headers}
                {rows}
                bind:selectedRowIds
                pageSize={pagination.pageSize}
                page={pagination.page}
                on:click:row={selRow}
                on:click:row--select={rowSel}>
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
                  <Column>Operation</Column>
                </Row>
                <Row padding>
                  <Column>
                    <ButtonSet stacked style="padding: 0.2rem;">
                      <Button disabled={(selectedRowIds.length == 0) || running} style="margin: 0.2rem 0" on:click={delRow}>Delete message</Button>
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
                      <Button style="margin: 0.2rem 0" disabled={(selectedRowIds.length == 0) || running} on:click={send}>Send message</Button>
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
  }
  .simcont .tilecont .title {
    max-width: 90%;
    white-space: pre-line;
    font-size: 1.25rem;
    text-align: justify;
    margin-bottom: 1rem;
  }
  .simtab td:last-child {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .simtab td:first-child {
    width: 2rem;
  }
  .simtab .bx--data-table-header {
    padding: 0 0 1em 0;
  }
  .simtab .bx--data-table-header__title {
    font-size: 1.25rem;
  }
  .simtab .bx--data-table-header__description {
    font-size: 0.85rem;
  }
  .simtab .bx--data-table tbody tr.selected {
    background-color: #666666;
  }
</style>
