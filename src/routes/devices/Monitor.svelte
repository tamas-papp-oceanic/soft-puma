<script>
  import { onMount, onDestroy } from "svelte";
  import { Grid, Row, Column, DataTable, Toolbar, ToolbarContent, Tile,
    Button, Pagination, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import Restart from "carbon-icons-svelte/lib/Restart16";
  import SkipBack from "carbon-icons-svelte/lib/SkipBack16";
  import { push, pop } from 'svelte-spa-router'
  import { device, name, data } from "../../stores/data.js";
  import { isRoute } from "../../helpers/route.js";

  export let params = undefined;

  let headers = new Array({
    key: 'wait',
    value: 'Waiting for first record...',
    sort: false
  });

  let height;
  let rows = new Array();
  let title = '';
  let pagination = {
    pageSize: 10,
    totalItems: 0,
    page: 1,
  };

  onMount(() => {
    window.pumaAPI.recv('set-prot', (e, pro) => {
      // rows = new Array();
    });
  });

  onDestroy(() => {
    window.pumaAPI.reml('set-prot');
  });

  function buf2hex(buffer) {
    return [...new Uint8Array(buffer)]
      .map((elm, idx) => idx < 20 ? elm.toString(16).padStart(2, '0').toUpperCase() + ' ' : '')
      .join('') + (buffer.length > 20 ? '...' : '');
  } 

  function details(e, row) {
    push('/details?data='+ JSON.stringify(row.dat));
  };

  function trace(e, row) {
    // /messages/pgn/address/instance
    push('/messages/' + row.id);
  };

  function rest(e) {
    pagination.page = 1;
    rows = new Array();
    headers = new Array({
      key: 'wait',
      value: 'Waiting for first record...',
      sort: false
    });
    $data[$device] = {};
  };

  function back(e) {
    pop();
  };

  function setTitle(dev) {
    if ((typeof $name[dev] !== "undefined") && (typeof params !== 'undefined') &&
      (typeof params['address'] !== 'undefined')) {
      let nam = $name[dev][parseInt(params['address'])];
      if (typeof nam !== 'undefined') {
        title = 'Messages of ' + nam.manufacturer + (nam.modelID != null ? ' - ' + nam.modelID : '');
      } else {
        title = 'Messages';
      }
    } else {
      title = 'Messages';
    }
  };

  function setData(dat) {
    let tmp = new Array();
    if (typeof dat !== "undefined") {
      for (const [src, rec] of Object.entries(dat)) {
        for (const [key, val] of Object.entries(rec)) {
          let pgn = val.header.pgn;
          let add = val.raw[3];
          let ins = val.header.hasOwnProperty('ins') ? val.header.ins : '-';
          let flt = null;
          if ((typeof params !== 'undefined') && params.hasOwnProperty('address')) {
            flt = parseInt(params['address']);
          }
          if ((flt === null) || (add == flt)) {
            let dat = new Uint8Array(val.raw.slice(4));
            let spl = key.split("/");
            let obj = {
              id: pgn + '/' + add + '/' + ins,
              pgn: pgn,
              add: add,
              ins: ins,
              msg: spl[1] + ' - ' + val.title,
              cnt: val.cnt,
              int: val.int,
              key: (parseInt(spl[1]) * 10) + ((typeof val.header.ins !== 'undefined') ? parseInt(val.header.ins) : 0),
              raw: buf2hex(dat),
              dat: Object.assign({ key: key }, val),
            };
            tmp.push(obj);
          }
        }
      }
      tmp.sort((a, b) => {
        if (a.pgn < b.pgn) {
          return -1;
        }
        if (a.pgn > b.pgn) {
          return 1;
        }
        if (a.add < b.add) {
          return -1;
        }
        if (a.add > b.add) {
          return 1;
        }
        if (a.ins < b.ins) {
          return -1;
        }
        if (a.ins > b.ins) {
          return 1;
        }
        return 0;
      });
    }
    rows = JSON.parse(JSON.stringify(tmp));
    pagination.totalItems = rows.length;
    if (rows.length > 0) {
      headers = new Array({
        key: "overflow",
        empty: true
      },{
        key: "msg",
        value: "Message",
        sort: false,
      },{
        key: "add",
        value: "Address",
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
      });
    }
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
          <ToolbarContent>
            {#if (typeof params !== 'undefined') && (typeof params["address"] !== 'undefined')}
              <Button icon={SkipBack} on:click={(e) => back(e)}>Back</Button>
            {:else}
              <Button icon={Restart} on:click={(e) => rest(e)}>Restart</Button>
            {/if}
          </ToolbarContent>
        </Toolbar>
        <span slot="cell" let:cell let:row let:rowIndex>
          {#if cell.key === 'overflow'}
            <OverflowMenu direction={rowIndex < (pagination.pageSize / 2) ? "bottom" : "top"}>
              <OverflowMenuItem text="Details" disabled={!isRoute('/details')} on:click={(e) => details(e, row)} />
              <OverflowMenuItem text="Trace" disabled={!isRoute('/messages')} on:click={(e) => trace(e, row)} />
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
          pageInputDisabled={(typeof params !== 'undefined') && (typeof params["address"] !== 'undefined')}
        />
      {/if}
    </Column>
  </Row>
</Grid>
