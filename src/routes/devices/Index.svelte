<script>
  import { Grid, Row, Column, Button, DataTable, Toolbar,
    ToolbarContent, ToolbarSearch,  OverflowMenu, 
    OverflowMenuItem, Pagination, Dropdown, Tag } from "carbon-components-svelte";
  import Scan from "carbon-icons-svelte/lib/SearchLocate16";
  import { push } from 'svelte-spa-router'
  import { name } from "../../stores/data.js";

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

  let height;
  let rows = [];
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  function scan(e) {
    window.pumaAPI.send('n2k-addr', 'can');
    window.pumaAPI.send('n2k-addr', 'ser');
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
          <Tag size="default" type="outline">{'Interface'}</Tag>
          <Dropdown
            type="inline"
            size="xl"
            selectedId="0"
            items={[
              { id: '0', text: 'can0' },
              { id: '1', text: '/dev/ttyACM0' },
            ]}
          />
          <ToolbarContent>
            <ToolbarSearch />
            <!-- <ToolbarMenu>
              <ToolbarMenuItem primaryFocus>Restart all</ToolbarMenuItem>
              <ToolbarMenuItem href="https://cloud.ibm.com/docs/loadbalancer-service">
                API documentation
              </ToolbarMenuItem>
              <ToolbarMenuItem danger>Stop all</ToolbarMenuItem>
            </ToolbarMenu> -->
            <Button icon={Scan} on:click={(e) => scan(e)}>Scan</Button>
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
          pageSizes={pagination.pageSizes}
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
