<script>
  import { onMount } from "svelte";
  import { Grid, Row, Column, DataTable, Toolbar, ToolbarContent, Tile,
    Button, Pagination, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import Restart from "carbon-icons-svelte/lib/Restart16";
  import SkipBack from "carbon-icons-svelte/lib/SkipBack16";
  import { push, pop } from 'svelte-spa-router'
  import { device, dque, restart } from "../../stores/data.js";

  export let params;

  let height;
  let key = null;
  let first = true;
  let rows = [];
  let title = null;
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };
  let headers = new Array();

  onMount(() => {
    key = params.protocol + '/' + params.pgn + '/' + params.function + '/' +
      params.manufacturer + '/' + params.industry + '/' + params.instance + '/' +
      params.type;
    title = 'Content of PGN' + params.pgn;
  }); 

  function rest(e) {
    restart($device, key);
  };

  function back(e) {
    pop();
  };

  // Data getters, setters
  $: if (first && (key != null) && (typeof $dque[$device] !== 'undefined') &&
    (typeof $dque[$device][key] !== 'undefined') && ($dque[$device][key].length > 0)) {
    let dat = $dque[$device][key].at(0);
    if (title != null) {
      title += ' - ' + dat.title;
    }
    if ((typeof dat.fields !== 'undefined') && Array.isArray(dat.fields) && (dat.fields.length > 0)) {
      let tmp = new Array();
      tmp.push({
        key: "cnt",
        value: 'Count',
        sort: false,
      });
      for (let i in dat.fields) {
        let fld = dat.fields[i];
        if (fld.reserved == null) {
          tmp.push({
            key: 'fld' + fld.field,
            value: fld.title,
            sort: false,
          });
        }
      }
      tmp.push({
        key: "overflow",
        empty: true,
      });
      headers = JSON.parse(JSON.stringify(tmp));
      first = false;
    }
  }
  $: if ((key != null) && (typeof $dque[$device] !== 'undefined') &&
    (typeof $dque[$device][key] !== 'undefined')) {
    let tmp = new Array();
    for (let i in $dque[$device][key]) {
      let dat = $dque[$device][key][i];
      let obj = {
        id: dat.id,
        cnt: dat.cnt,
      };
      for (let i in dat.fields) {
        let fld = dat.fields[i];
        obj['fld' + fld.field] = (fld.state == 'V') ? fld.value : '-';
      }
      tmp.push(obj);
    }
    rows = JSON.parse(JSON.stringify(tmp));
    pagination.totalItems = rows.length;
  }
  $: pagination.pageSize = Math.round(((height * 0.9) / getComputedStyle(document.documentElement).fontSize.replace('px', '')) / 3) - 4;
</script>

<svelte:window bind:innerHeight={height} />
<Grid>
  <Row>
    <Column>
      {#if headers.length > 0}
        <DataTable
          sortable
          {headers}
          {rows}
          pageSize={pagination.pageSize}
          page={pagination.page}>
          <Toolbar>
            <Tile>{title}</Tile>
            <ToolbarContent>
              <Button icon={Restart} on:click={(e) => rest(e)}>Restart</Button>
              <Button icon={SkipBack} on:click={(e) => back(e)}>Back</Button>
            </ToolbarContent>
          </Toolbar>
          <span slot="cell" let:cell let:row>
            {#if cell.key === 'overflow'}
            <OverflowMenu flipped>
              <OverflowMenuItem text="Details" disabled on:click={() => push('/details/'+ row.key)} />
              </OverflowMenu>
            {:else}
              {cell.value}
            {/if}
          </span>
        </DataTable>
      {/if}
      {#if pagination.totalItems > pagination.pageSize}
        <Pagination
          bind:pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          bind:page={pagination.page}
          pageSizeInputDisabled
        />
      {/if}
    </Column>
  </Row>
</Grid>
