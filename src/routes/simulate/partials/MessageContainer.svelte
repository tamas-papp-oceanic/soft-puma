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
  let selectedRowIds = new Array();
  let selection = null;
  let height;
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  function setIns(e) {
    if (selection != null) {
      for (let i in data) {
        if (data[i].id == selection.id) {
          data[i].ins = selection.ins;
          break;
        }
      }
    }
  };  

  function setFlu(e) {
    if (selection != null) {
      for (let i in data) {
        if (data[i].id == selection.id) {
          data[i].flu = selection.flu;
          break;
        }
      }
    }
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

  function setData(val) {
    let arr = new Array();
    if (val != null) {
      let dat = JSON.parse(JSON.stringify(val));
      for (let i in dat) {
        let spl = splitKey(dat[i].id);
        arr.push({ id: dat[i].id, pgn: spl.pgn, title: dat[i].val.title, ins: dat[i].ins, flu: dat[i].flu });
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
            <Toolbar>
              <ToolbarContent>
                <Tile style="display: flex; flex-flow: column nowrap; width: 70%;">
                  <span class="title">NMEA2000 message(s) for simulation.</span>
                  <span class="desrc">(select message for change of parameter(s) or add to simulaton)</span>
                </Tile>
                <ToolbarSearch />
              </ToolbarContent>
            </Toolbar>
            {#if loading}
              <DataTableSkeleton showHeader={true} showToolbar={false} {headers} size="compact" rows={pagination.pageSize} />
              <PaginationSkeleton />
            {:else}
            <!-- title="NMEA2000 message(s) for simulation." -->
            <!-- description="(select message for change of parameter(s) or add to simulaton)" -->
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
                  {#if selection.ins != null}
                    <Row padding>
                      <Column>
                        {#if running}
                          <DropdownSkeleton />
                        {:else}
                          <Dropdown titleText="Data instance" size="sm" bind:selectedId={selection.ins} items={insts}
                            disabled={running} on:select={setIns} />
                        {/if}
                      </Column>
                    </Row>
                  {/if}
                  {#if selection.flu != null}
                    <Row padding>
                      <Column>
                        {#if running}
                          <DropdownSkeleton />
                        {:else}
                          <Dropdown titleText="Fluid type" size="sm" bind:selectedId={selection.flu} items={fluts}
                            disabled={running} on:select={setFlu} />
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
    font-size: 1.25rem;
    height: 0.25rem;
  }
  .container .tilecont .descr {
    font-size: 0.8rem;
    height: 1rem;
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
