<script>
  import { Grid, Row, Column, DataTable, Toolbar, ToolbarContent,
    Button, Pagination, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import { push, pop } from 'svelte-spa-router'
  import { name, data } from "../stores/data.js";

  export let params;

  const headers = [{
    key: "msg",
    value: "Message",
    sort: false,
  },{
    key: "ins",
    value: "Instance",
    sort: false,
  },{
    key: "cnt",
    value: "Count",
    sort: false,
  },{
    key: "raw",
    value: "Raw data",
    sort: false,
  },{
    key: "overflow",
    empty: true,
  }];

  let rows = [];
  let title = '';
  let description = '';
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  function buf2hex(buffer) {
    return [...new Uint8Array(buffer)]
      .map((elm, idx) => idx < 30 ? elm.toString(16).padStart(2, '0').toUpperCase() + ' ' : '')
      .join('') + (buffer.length > 30 ? '...' : '');
  } 

  function back(e) {
    pop();
  };

  // Data getters, setters
  $: {
    let nam = $name[parseInt(params["address"])];
    if (typeof nam !== 'undefined') {
      title = 'Messages of ' + nam.manufacturer;
      description = nam.modelID != null ? nam.modelID : '';
    } else {
      title = 'Messages';
      description = '';
    }
  }
  $: {
    let tmp = new Array();
    for (const [key, val] of Object.entries($data)) {
      let add = parseInt(params["address"]);
      if (val.raw[3] == add) {
        let dat = new Uint8Array(val.raw.slice(4));
        let spl = key.split("/");
        let obj = {
          id: key,
          msg: spl[1] + ' - ' + val.title,
          ins: (typeof val.header.ins !== 'undefined') ? val.header.ins : '-',
          cnt: val.cnt,
          key: (parseInt(spl[1]) * 10) + ((typeof val.header.ins !== 'undefined') ? parseInt(val.header.ins) : 0),
          raw: buf2hex(dat),
        };
        tmp.push(obj);
      }
    }
    tmp.sort((a, b) => {
      if (a.id < b.id) {
        return -1;
      }
      if (a.id > b.id) {
        return 1;
      }
      return 0;
    });
    rows = JSON.parse(JSON.stringify(tmp));
    pagination.totalItems = rows.length;
  };
</script>

<Grid>
  <Row>
    <Column>
      <DataTable
        sortable
        {headers}
        {rows}
        size="short"
        pageSize={pagination.pageSize}
        page={pagination.page}>
        <!-- <strong slot="title">{title}</strong>
        <span slot="description" style="font-size: 1rem;">{description}</span> -->
        <Toolbar>
          <ToolbarContent>
            <div class="title">
              <div>{title}</div>
              <div>{description}</div>
            </div>
            <Button on:click={(e) => back(e)}>&larr;&nbsp;Back</Button>
          </ToolbarContent>
        </Toolbar>
        <span slot="cell" let:cell let:row>
          {#if cell.key === 'overflow'}
            <OverflowMenu flipped>
              <OverflowMenuItem text="Content" on:click={(e) => { push('/messages/'+row.id); }} />
            </OverflowMenu>
          {:else}
            {cell.value}
          {/if}
        </span>
      </DataTable>
      {#if pagination.totalItems > pagination.pageSize}
        <Pagination
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          bind:page={pagination.page}
          pageInputDisabled
          pageSizeInputDisabled
        />
      {/if}
    </Column>
  </Row>
</Grid>

<style lang="scss">
  .title {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: inherit;
  }
  .title div {
    padding: 0 1rem;
    font-size: 1rem;
  }
</style>