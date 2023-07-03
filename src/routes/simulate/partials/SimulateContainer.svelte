<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, DataTableSkeleton,
    PaginationSkeleton, DataTable, Pagination, Truncate, Dropdown,
    DropdownSkeleton } from "carbon-components-svelte";
  import { splitKey } from "../../../helpers/route";

  export let data;
  export let style;
  export let running;

  const dispatch = createEventDispatcher();

  const headers = new Array(
    { key: 'pgn', value: 'PGN', sort: false },
    { key: 'title', value: 'Title', sort: false, width: '65%' },
  );
  const simulations = new Array(
    { id: '0', text: 'Increasing' },
    { id: '1', text: 'Decreasing' },
    { id: '2', text: 'Natural' },
  );
  let rows = new Array();
  let selected = new Array();
  let height;
  let simulation = '0';
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  function check(e) {
    dispatch("check", e);
  };

  function cancel(e) {
    dispatch("cancel", e);
  };

  function setsim(e) {
    console.log(e)
  };

  function setData(val) {
    let arr = new Array();
    if (val != null) {
      let dat = JSON.parse(JSON.stringify(val.table));
      for (let i in dat) {
        let spl = splitKey(dat[i].key);
        arr.push({ id: dat[i].key, pgn: spl.pgn, title: dat[i].val.title });
      }
      arr.sort((a, b) => {
        return a.pgn.localeCompare(b.pgn) || a.title.localeCompare(b.title);
      });
    }
    rows = JSON.parse(JSON.stringify(arr));
  };

  $: data, setData(data);
  $: pagination.totalItems = rows.length;
  $: pagination.pageSize = Math.round((height / getComputedStyle(document.documentElement).fontSize.replace('px', '')) / 2) - 8;
</script>

<svelte:window bind:innerHeight={height} />
<div class="container" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row>
          <Column><div class="title">Select message(s) for simulation from below.</div></Column>
        </Row>
        <Row style="height: inherit;">
          <Column></Column>
          <Column sm={9} md={9} lg={9}>
            {#if running}
              <DataTableSkeleton showHeader={false} showToolbar={false} {headers} size="compact" rows={pagination.pageSize} />
              <PaginationSkeleton />
            {:else}
              <DataTable
                size="compact"
                selectable
                bind:selectedRowIds={selected}
                {headers}
                {rows}
                pageSize={pagination.pageSize}
                page={pagination.page}>
                <span slot="cell" let:cell><Truncate style="font-size: unset; font-weight: unset; line-height: unset; letter-spacing: unset;">{cell.value}</Truncate></span>
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
          <Column></Column>
          <Column sm={6} md={6} lg={6}>
            <Row>
              <Column>Parameters</Column>
            </Row>
            <Row padding>
              <Column>
                {#if running}
                  <DropdownSkeleton />
                {:else}
                  <Dropdown titleText="Simulation mode" size="sm" bind:selectedId={simulation} items={simulations} on:select={(e) => setsim(e)}/>
                {/if}
              </Column>
            </Row>
            <Row>
              <Column>Operation</Column>
            </Row>
            <Row padding>
              <Column>
                <Button kind="primary" on:click={(e) => cancel(e)}>Start</Button>
              </Column>
              <Column>
                <Button kind="primary" on:click={(e) => cancel(e)}>Stop</Button>
              </Column>
            </Row>
          </Column>
          <Column></Column>
        </Row>
      </Grid>
    </div>
  </Tile>
  <ButtonSet style="justify-content: flex-end;">
    <Button kind="secondary" on:click={(e) => cancel(e)}>Close</Button>
  </ButtonSet>
</div>

<style type="css">
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
    width: 100%;
    height: 100%;
  }
  .container .tilecont .title {
    max-width: 90%;
    white-space: pre-line;
    font-size: 1.25rem;
    text-align: justify;
    margin-bottom: 1rem;
  }
</style>
