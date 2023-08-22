<script>
  import { Grid, Row, Column, DataTable, Toolbar, ToolbarContent, Tile,
    Button, Pagination, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import SkipBack from "carbon-icons-svelte/lib/SkipBack16";
  import { push, pop } from 'svelte-spa-router'
  import { device, name, data } from "../../stores/data.js";
  import { isRoute } from "../../helpers/route.js";

  export let params;

  const headers = [{
    key: "overflow",
    empty: true
  },{
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

  function content(e, row) {
    push('/messages/' + row.id);
  };

  function back(e) {
    pop();
  };

  function setTitle(dev) {
    if (typeof $name[dev] !== "undefined") {
      let nam = $name[dev][parseInt(params["address"])];
      if (typeof nam !== 'undefined') {
        title = 'Messages of ' + nam.manufacturer + (nam.modelID != null ? ' - ' + nam.modelID : '');
      } else {
        title = 'J1939 messages';
      }
    } else {
      title = 'Messages';
    }
  };

  function setData(dat) {
    let tmp = new Array();
    if (typeof dat !== "undefined") {
      for (const [key, val] of Object.entries(dat)) {
        let add = parseInt(params["address"]);
        if ((add === -1) || (val.raw[3] === add)) {
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

  // Data getters, setters
  $: $device, setTitle($device);
  $: $data[$device], setData($data[$device]);
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
          {#if params["address"] !== "-1"}
            <ToolbarContent>
              <Button icon={SkipBack} on:click={(e) => back(e)}>Back</Button>
            </ToolbarContent>
          {/if}
        </Toolbar>
        <span slot="cell" let:cell let:row let:rowIndex>
          {#if cell.key === 'overflow'}
            <OverflowMenu direction={rowIndex < (pagination.pageSize / 2) ? "bottom" : "top"}>
              <OverflowMenuItem text="Content" disabled={!isRoute('/messages')} on:click={(e) => content(e, row)} />
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
