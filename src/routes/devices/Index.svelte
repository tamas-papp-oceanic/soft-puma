<script>
  import { Grid, Row, Column, ButtonSet, Button, DataTable,
    Toolbar, ToolbarContent, ToolbarSearch, ToolbarMenu,
    ToolbarMenuItem, OverflowMenu, OverflowMenuItem, Pagination } from "carbon-components-svelte";
  import { push } from 'svelte-spa-router'
  import { name, data } from "../../stores/data.js";

  const headers = [{
    key: "id",
    value: "Address"
  },{
    key: "manufacturer",
    value: "Manufacturer"
  },{
    key: "productCode",
    value: "Product Code"
  },{
    key: "instance",
    value: "Instance"
  },{
    key: "modelID",
    value: "Description"
  },{
    key: "uniqueNumber",
    value: "Unique Number"
  },{
    key: "overflow",
    empty: true
  }];

  let rows = [];
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  function scan(e) {
    console.log(e)
  };

  // Data getters, setters
  $: {
    let tmp = new Array();
    for (const [key, val] of Object.entries($name)) {
      let nam = {
        id: key,
        uniqueNumber: val.uniqueNumber != null ? val.uniqueNumber : '',
        manufacturer: val.manufacturer != null ? val.manufacturer : '',
        productCode: val.productCode != null ? val.productCode : '',
        modelID: val.modelID != null ? val.modelID : '',
        instance: val.deviceInstance != null ? val.deviceInstance : '',
      };
      tmp.push(nam);
    }
    rows = JSON.parse(JSON.stringify(tmp));
    pagination.totalItems = rows.length;
  };

  window.pumaAPI.send('can-start');
  // setTimeout(() => {
  //   window.pumaAPI.send('can-stop');
  // }, 20000);

  window.pumaAPI.send('ser-start');
  // setTimeout(() => {
  //   window.pumaAPI.send('ser-stop');
  // }, 20000);
</script>

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
          <ToolbarContent>
            <ToolbarSearch />
            <!-- <ToolbarMenu>
              <ToolbarMenuItem primaryFocus>Restart all</ToolbarMenuItem>
              <ToolbarMenuItem href="https://cloud.ibm.com/docs/loadbalancer-service">
                API documentation
              </ToolbarMenuItem>
              <ToolbarMenuItem danger>Stop all</ToolbarMenuItem>
            </ToolbarMenu> -->
            <Button on:click={(e) => scan(e)}>Scan</Button>
          </ToolbarContent>
        </Toolbar>
        <span slot="cell" let:cell let:row>
          {#if cell.key === 'overflow'}
            <OverflowMenu flipped>
              <OverflowMenuItem text="Configure" on:click={() => push('/devices/'+row.id)} />
              <OverflowMenuItem text="Monitor" on:click={() => push('/monitor/'+row.id)} />
              <OverflowMenuItem disabled text="Test" />
              <OverflowMenuItem text="Check for Updates" />
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
        pageSizeInputDisabled
        pageInputDisabled
      />
      {/if}
    </Column>
  </Row>
</Grid>
