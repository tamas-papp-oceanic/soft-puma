<script>
  import { onMount } from "svelte";
  import { Grid, Row, Column, DataTable, Toolbar, ToolbarContent,
    Button, Pagination, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import Restart32 from "carbon-icons-svelte/lib/Restart32";
  import { push, pop } from 'svelte-spa-router'
  import { manu, dque, restart } from "../stores/data.js";

  export let params;

  let key = null;
  let first = true;
  let rows = [];
  let title = null;
  let description = null;
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
    if (params.manufacturer != '-') {
      let man = $manu[parseInt(params.manufacturer)];
      if (typeof man !== 'undefined') {
        if (description != null) {
          description += ', ';
        } else {
        description = ''
        }
        description += 'Manufacturer - ' + man;
      }
    }
    if (params.instance != '-') {
      if (description != null) {
        description += ', ';  
      } else {
        description = ''
      }
      description += 'Instance - ' + params.instance;
    }
    if (params.type != '-') {
      if (description != null) {
        description += ', ';  
      } else {
        description = ''
      }
      description += 'Type - ' + params.type;
    }
  }); 

  function rest(e) {
    restart(key);
  };

  function back(e) {
    pop();
  };

  // Data getters, setters
  $: if (first && (key != null) && (typeof $dque[key] !== 'undefined') && ($dque[key].length > 0)) {
    let dat = $dque[key].at(0);
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
        tmp.push({
          key: 'fld' + fld.field,
          value: fld.title,
          sort: false,
        });
      }
      tmp.push({
        key: "overflow",
        empty: true,
      });
      headers = JSON.parse(JSON.stringify(tmp));
      first = false;
    }
  }
  $: if ((key != null) && (typeof $dque[key] !== 'undefined')) {
    let tmp = new Array();
    for (let i in $dque[key]) {
      let dat = $dque[key][i];
      let obj = {
        id: dat.id,
        cnt: dat.cnt,
      };
      for (let i in dat.fields) {
        let fld = dat.fields[i];
        obj['fld' + fld.field] = fld.value;
      }
      tmp.push(obj);
    }
    rows = JSON.parse(JSON.stringify(tmp));
    pagination.totalItems = rows.length;
  }
</script>

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
          <strong slot="title">{title}</strong>
          <span slot="description" style="font-size: 1rem;">{description}</span>
          <Toolbar size="normal">
            <ToolbarContent>
              <Button icon={Restart32} on:click={(e) => rest(e)}></Button>
              <Button on:click={(e) => back(e)}>&larr;&nbsp;Back</Button>
            </ToolbarContent>
          </Toolbar>
          <span slot="cell" let:cell let:row>
            {#if cell.key === 'overflow'}
              <OverflowMenu flipped>
                <OverflowMenuItem text="Details" on:click={() => push('/details/'+ row.key)} />
              </OverflowMenu>
            {:else}
              {cell.value}
            {/if}
          </span>
        </DataTable>
      {/if}
      {#if pagination.totalItems > pagination.pageSize}
        <Pagination
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          bind:page={pagination.page}
          pageSizeInputDisabled
        />
      {/if}
    </Column>
  </Row>
</Grid>
