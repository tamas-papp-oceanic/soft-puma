<script>
  import { Grid, Row, Column, DataTable, Toolbar, ToolbarContent, Tile,
    Button, Pagination, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import SkipBack from "carbon-icons-svelte/lib/SkipBack16";
  import { push, pop } from 'svelte-spa-router'
  import { device, name, data } from "../../stores/data.js";

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
    key: "int",
    value: "Interval",
    sort: false,
  },{
    key: "raw",
    value: "Raw data",
    sort: false,
  },{
    key: "overflow",
    empty: true,
  }];

  let height;
  let rows = [];
  let title = '';
  let pagination = {
    pageSize: 10,
    totalItems: 0,
    page: 1,
  };

  function buf2hex(buffer) {
    return [...new Uint8Array(buffer)]
      .map((elm, idx) => idx < 20 ? elm.toString(16).padStart(2, '0').toUpperCase() + ' ' : '')
      .join('') + (buffer.length > 20 ? '...' : '');
  } 

  function back(e) {
    pop();
  };

  // Data getters, setters
  $: {
    if (typeof $name[$device] !== "undefined") {
      let nam = $name[$device][parseInt(params["address"])];
      if (typeof nam !== 'undefined') {
        title = 'Messages of ' + nam.manufacturer + (nam.modelID != null ? ' - ' + nam.modelID : '');
      } else {
        title = 'Messages';
      }
    } else {
      title = 'Messages';
    }
  }
  $: {
    let tmp = new Array();
    if (typeof $data[$device] !== "undefined") {
      for (const [key, val] of Object.entries($data[$device])) {
        let add = parseInt(params["address"]);
        if (val.raw[3] == add) {
          let dat = new Uint8Array(val.raw.slice(4));
          let spl = key.split("/");
          let obj = {
            id: key,
            msg: spl[1] + ' - ' + val.title,
            ins: (typeof val.header.ins !== 'undefined') ? val.header.ins : '-',
            cnt: val.cnt,
            int: val.int,
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
    }
    rows = JSON.parse(JSON.stringify(tmp));
    pagination.totalItems = rows.length;
  };
  $: pagination.pageSize = Math.round(((height * 0.9) / getComputedStyle(document.documentElement).fontSize.replace('px', '')) / 3) - 4;
</script>

<svelte:window bind:innerHeight={height} />
<Grid>
  <Row>
    <Column>
      <DataTable
        sortable
        {headers}
        {rows}
        pageSize={pagination.pageSize}
        page={pagination.page}>
        <Toolbar>
          <Tile>{title}</Tile>
          <ToolbarContent>
            <Button icon={SkipBack} on:click={(e) => back(e)}>Back</Button>
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
          bind:pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          bind:page={pagination.page}
          pageSizeInputDisabled
          pageInputDisabled
        />
      {/if}
    </Column>
  </Row>
</Grid>
