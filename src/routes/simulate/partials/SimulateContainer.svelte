<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, DataTableSkeleton,
    PaginationSkeleton, DataTable, Pagination, Dropdown,
    DropdownSkeleton } from "carbon-components-svelte";
  import { splitKey } from "../../../helpers/route";

  export let data;
  export let style;
  export let running;
  export let loading;

  const dispatch = createEventDispatcher();

  const headers = new Array(
    { key: 'pgn', value: 'PGN', sort: false },
    { key: 'ins', value: 'Instance', sort: false },
    { key: 'title', value: 'Title', sort: false, width: '70%' },
  );
  const sims = new Array(
    { id: 0, text: 'Incremental' },
    { id: 1, text: 'Decremental' },
    { id: 2, text: 'Natural' },
    { id: 3, text: 'Random' },
  );
  let insts = new Array();
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
        let spl = splitKey(dat[i].id);
        arr.push({ id: dat[i].id, pgn: spl.pgn, title: dat[i].title, ins: dat[i].ins, def: dat[i].def });
      }
      arr.sort((a, b) => {
        return a.pgn.localeCompare(b.pgn) || a.title.localeCompare(b.title);
      });
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
<div class="container" style={style}>
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
                bind:selectedRowIds
                {headers}
                {rows}
                pageSize={pagination.pageSize}
                page={pagination.page}
                on:click:row={selRow}
                on:click:row--select={rowSel}>
                <span slot="title">Message(s) part of simulation.</span>
                <span slot="description">(select row for remove from simulaton)</span>
                <svelte:fragment slot="cell" let:cell>{cell.value != null ? cell.value : ''}</svelte:fragment>
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
                  <Column>Operation(s)</Column>
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
                <Row style="padding: 1rem 0 0 0;">
                  <Column>
                    <ButtonSet stacked style="padding: 0.2rem;">
                      <Button style="margin: 0.2rem 0" disabled={(selectedRowIds.length == 0) || running} on:click={send}>Send message</Button>
                    </ButtonSet>
                  </Column>
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
  .container {
    display: flex;
    flex-flow: column nowrap;
    justify-content: stretch;
    border: 1px solid gray;
    width: 100%;
  }
  .container .tilecont {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
  }
  .container .tilecont .title {
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
