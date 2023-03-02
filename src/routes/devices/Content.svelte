<script>
  import { onMount, onDestroy } from "svelte";
  import { Grid, Row, Column, DataTable, Toolbar, ToolbarContent, Tile,
    Button, Pagination, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import Restart from "carbon-icons-svelte/lib/Restart16";
  import SkipBack from "carbon-icons-svelte/lib/SkipBack16";
  import { push, pop } from 'svelte-spa-router'
  import { queue, start, stop, restart } from "../../stores/data.js";

  export let params;

  let height;
  let key = null;
  let first = true;
  let rows = new Array();
  let curr = new Array();
  let title = null;
  let pagination = {
    pageSize: 10,
    totalItems: 0,
    page: 1,
  };
  let headers = new Array({
    key: 'wait',
    value: 'Waiting for first record...',
    sort: false
  });

  onMount(() => {
    key = params.protocol + '/' + params.pgn + '/' + params.function + '/' +
      params.manufacturer + '/' + params.industry + '/' + params.instance + '/' +
      params.type;
    title = 'Content of PGN' + params.pgn;
    start(key);
  }); 

  onDestroy(() => {
    stop();
  });

  function rest(e) {
    restart();
  };

  function back(e) {
    pop();
  };

  // Data getters, setters
  $: if (first && (key != null) && ($queue.length > 0)) {
    let dat = $queue.at(0);
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
  $: {
    if ($queue.length > 0) {
      let tmp = new Array();
      let lst = JSON.parse(JSON.stringify($queue[$queue.length - 1]));
      lst.id = 'first';
      let obj = {
        id: lst.id,
        cnt: lst.cnt,
      };
      for (let i in lst.fields) {
        let fld = lst.fields[i];
        obj['fld' + fld.field] = (fld.state == 'V') ? fld.value : '-';
      }
      tmp.push(obj);
      curr = JSON.parse(JSON.stringify(tmp));
    }
  }
  $: pagination.pageSize = Math.round(((height * 0.9) / getComputedStyle(document.documentElement).fontSize.replace('px', '')) / 3) - 4;
  $: if (key != null) {
    let tmp = new Array();
    for (let i in $queue) {
      let dat = $queue[i];
      if (((dat.cnt - 1) % (pagination.pageSize - 1)) == 0) {
        let lst = JSON.parse(JSON.stringify($queue[$queue.length - 1]));
        lst.id = 'first';
        let end = {
          id: lst.id,
          cnt: lst.cnt,
        };
        for (let i in lst.fields) {
          let fld = lst.fields[i];
          end['fld' + fld.field] = (fld.state == 'V') ? fld.value : '-';
        }
        end['overflow'] = '';
        tmp.push(end);
      }
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
</script>

<svelte:window bind:innerHeight={height} />
<Grid>
  <Row>
    <Column>
      {#if headers.length > 0}
        <DataTable {headers} {rows} pageSize={pagination.pageSize} page={pagination.page} class="last">
          <Toolbar>
            <Tile>{title}</Tile>
            <ToolbarContent>
              <Button icon={Restart} on:click={(e) => rest(e)}>Restart</Button>
              <Button icon={SkipBack} on:click={(e) => back(e)}>Back</Button>
            </ToolbarContent>
          </Toolbar>
          <span slot="cell" let:cell let:row>
            {#if (cell.key === 'overflow') && (row.id !== 'first')}
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

<style global>
  .last table tbody tr:first-child td {
    background: #c6c6c6;
    color: #000000;
  }
</style>