<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, DataTableSkeleton,
    PaginationSkeleton, DataTable, Pagination, Truncate, Dropdown,
    DropdownSkeleton, 
    truncate,
    ClickableTile} from "carbon-components-svelte";
  import { splitKey } from "../../../helpers/route";

  export let data;
  export let style;
  export let running;
  export let loading;

  const dispatch = createEventDispatcher();

  const headers = new Array(
    { key: 'pgn', value: 'PGN', sort: false },
    { key: 'ins', value: 'Instance', sort: false },
    { key: 'title', value: 'Title', sort: false, width: '60%' },
  );
  const sims = new Array(
    { id: 0, text: 'Increasing' },
    { id: 1, text: 'Decreasing' },
    { id: 2, text: 'Natural' },
    { id: 3, text: 'Random' },
  );
  let insts = new Array();
  let rows = new Array();
  let selectedRowIds = new Array();
  let height;
  let simulation = '0';
  let instance = null;
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };
  let selection = null;

  function clkrow(e) {
    selection = e.detail.id;
  };

  function clkcell(e) {
    if (e.detail.key == 'ins') {
      instance = e.detail.value;
    } else {
      instance = null;
    }
  };

  function setinst(e) {
    if (selection != null) {
      for (let i in data.table) {
        if (data.table[i].key == selection) {
          data.table[i].ins = instance;
          selection = null;
          instance = null;
          break;
        }
      }
    }
  };  

  function setsim(e) {
    dispatch("setsim", e.detail);
  };

  function start(e) {
    dispatch("start", e.detail);
  };    
  
  function select(e) {
    dispatch("select", e.detail);
  };

  function stop(e) {
    dispatch("stop", e.detail);
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
        let spl = splitKey(dat[i].key);
        arr.push({ id: dat[i].key, pgn: spl.pgn, title: dat[i].val.title, ins: dat[i].ins });
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
          <Column></Column>
          <Column sm={10} md={10} lg={10}>
            {#if loading}
              <DataTableSkeleton showHeader={true} showToolbar={false} {headers} size="compact" rows={pagination.pageSize} />
              <PaginationSkeleton />
            {:else}
              <DataTable
                class="simtab"
                size="compact"
                selectable
                bind:selectedRowIds
                {headers}
                {rows}
                pageSize={pagination.pageSize}
                page={pagination.page}
                on:click:row={(e) => clkrow(e)}
                on:click:cell={(e) => clkcell(e)}
                on:click:row--select={(e) => select(e)}>
                <span slot="title">Select message(s) for simulation from below.</span>
                <span slot="description">(click on instance field for change of data instance)</span>
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
          <Column></Column>
          <Column sm={5} md={5} lg={5} style="display: flex; flex-flow: column nowrap; justify-content: space-between;">
            <Row>
              <Column>
                <Row>
                  <Column>Parameters</Column>
                </Row>
                {#if (selection != null) && (instance != null)}
                  <Row padding>
                    <Column>
                      {#if running}
                        <DropdownSkeleton />
                      {:else}
                        <Dropdown titleText="Data instance" size="sm" bind:selectedId={instance} items={insts}
                          disabled={running} />
                      {/if}
                    </Column>
                    <Column sm={1} md={1} lg={1}></Column>
                    <Column>
                      <ButtonSet stacked style="padding: 0.2rem;">
                        <Button style="margin: 0.2rem 0" on:click={(e) => setinst(e)}>Set</Button>
                      </ButtonSet>
                    </Column>
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
                    {#if loading}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown titleText="Simulation mode" size="sm" bind:selectedId={simulation} items={sims} on:select={(e) => setsim(e)} />
                    {/if}
                  </Column>
                    </Row>
              </Column>
              <Column sm={1} md={1} lg={1}></Column>
              <Column>
                <Row>
                  <Column>
                    <ButtonSet stacked style="padding: 0.2rem;">
                      <Button style="margin: 0.2rem 0" disabled={(selectedRowIds.length == 0) || running} on:click={(e) => start(e)}>Start</Button>
                      <Button style="margin: 0.2rem 0" disabled={!running} on:click={(e) => stop(e)}>Stop</Button>
                    </ButtonSet>
                  </Column>
                </Row>
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
</style>
