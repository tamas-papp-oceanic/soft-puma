<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column,
    DataTableSkeleton, PaginationSkeleton, DataTable,
    Pagination, ToolbarContent, ToolbarSearch,
    Toolbar } from "carbon-components-svelte";
  import { splitKey } from "../../../helpers/route";

  export let data;
  export let style;
  // export let running;
  export let loading;

  const dispatch = createEventDispatcher();

  const headers = new Array(
    { key: 'pgn', value: 'PGN', sort: false },
    { key: 'title', value: 'Title', sort: false, width: '70%' },
  );
  const fluts = new Array(
    { id: 0, text: 'Fuel' },
    { id: 1, text: 'Fresh Water' },
    { id: 2, text: 'Waste Water' },
    { id: 3, text: 'Live Well' },
    { id: 4, text: 'Oil' },
    { id: 5, text: 'Black Water (Sewage)' },
    { id: 6, text: 'Fuel (Gasoline)' },
  );
  let insts = new Array();
  let rows = new Array();
  let selectedRowIds = new Array();
  let filteredRowIds = new Array();
  let height;
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  function search(e) {
    pagination.page = 1;
  };

  function addRow(e) {
    for (let i in selectedRowIds) {
      for (let j in rows) {
        if (rows[j].id == selectedRowIds[i]) {
          dispatch("addrow", JSON.parse(JSON.stringify(rows[j])));
          break;
        }
      }
    }
    selectedRowIds = new Array();
  };

  function cancel(e) {
    dispatch("cancel");
  };

  function setData(val) {
    let arr = new Array();
    if (val != null) {
      let dat = JSON.parse(JSON.stringify(val));
      for (let i in dat) {
        let spl = splitKey(dat[i].key);
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
  $: pagination.pageSize = Math.round(((height - 350) / 24));
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
                selectable
                {headers}
                {rows}
                bind:selectedRowIds
                pageSize={pagination.pageSize}
                page={pagination.page}>
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
          <Column sm={3} md={3} lg={3} style="display: flex; flex-flow: column nowrap; justify-content: space-between;">
            <Row>
              <Column>
                <Row>
                  <Column>Operation</Column>
                </Row>
                <Row padding>
                  <Column>
                    <ButtonSet stacked style="padding: 0.2rem;">
                      <Button disabled={selectedRowIds.length == 0} style="margin: 0.2rem 0" on:click={addRow}>Add message(s)</Button>
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
  .msgtab th:first-child,
  .msgtab td:first-child {
    width: 3rem;
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
