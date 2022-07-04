<script>
  import { Grid, Row, Column, DataTable, Toolbar, ToolbarContent,
    Button, Pagination } from "carbon-components-svelte";
  import { name, data } from "../stores/data.js";

  export let params;

  const headers = [{
    key: "msg",
    value: "Message",
    sort: (a, b) => a.key - b.key,
  },{
    key: "ins",
    value: "Instance",
    sort: false
  },{
    key: "raw",
    value: "Raw data",
    sort: false
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

  };

  // Data getters, setters
  $: {
    let nam = $name[parseInt(params["address"])];
    if (typeof nam !== "undefined") {
      title = 'Messages of ' + nam.manufacturer;
      description = nam.modelID != null ? nam.modelID : '';
    } else {
      title = 'Messages';
      description = '';
    }
  
  console.log(title, description)
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
          key: (parseInt(spl[1]) * 10) + ((typeof val.header.ins !== 'undefined') ? parseInt(val.header.ins) : 0),
          raw: buf2hex(dat),
        };
        tmp.push(obj);
      }
    }
    tmp.sort((a, b) => {
      return a.id < b.id;
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
        size="medium"
        pageSize={pagination.pageSize}
        page={pagination.page}>
        <strong slot="title">{title}</strong>
        <span slot="description" style="font-size: 1rem;">{description}</span>
        <Toolbar size="sm">
          <ToolbarContent>
            <Button on:click={(e) => back(e)}>&larr;&nbsp;Back</Button>
          </ToolbarContent>
        </Toolbar>
        <span slot="cell" let:cell let:row>{cell.value.toString(16)}</span>
      </DataTable>
      {#if pagination.totalItems > pagination.pageSize}
      <Pagination
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        bind:page={pagination.page}
        pageSizeInputDisabled
        pageInputDisabled
      />
      {/if}
    </Column>
  </Row>
</Grid>
