<script>
  import { Grid, Row, Column, ButtonSet, Button, DataTable,
    Toolbar, ToolbarContent, ToolbarSearch, ToolbarMenu,
    ToolbarMenuItem, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import { push } from 'svelte-spa-router'
  import { name, data } from "../../stores/data.js";

  const headers = [{
    key: "addr",
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
    key: "productDesc",
    value: "Description"
  },{
    key: "id",
    value: "Unique Number"
  },{
    key: "overflow",
    empty: true
  }];

  let rows = [{
    id: "412345",
    addr: "0",
    manufacturer: "Oceanic Systems",
    productCode: "4291",
    productDesc: "4291 4-20mA Fluid Sender",
    instance: "0",
  },{
    id: "412346",
    addr: "1",
    manufacturer: "Oceanic Systems",
    productCode: "4291",
    productDesc: "4291 4-20mA Fluid Sender",
    instance: "1",
  }];

  function scan(e) {
    console.log(e)
  }

  // Data getters, setters
  $: {
    rows = new Array();
    for (const [key, val] of Object.entries($name)) {
      let nam = {
        id: val.uniqueNumber,
        addr: key,
        manufacturer: val.manufacturer,
        productCode: val.productCode,
        productDesc: val.modelID,
        instance: val.instance,
      };
      rows.push(nam);
    }
  }

  window.pumaAPI.send('can-start');
  setTimeout(() => {
    window.pumaAPI.send('can-stop');
  }, 2000);
  window.pumaAPI.recv('ser-running', (e, val) => {
    console.log("SER RUNNING", val);
  });
  window.pumaAPI.send('ser-start');
  setTimeout(() => {
    window.pumaAPI.send('ser-stop');
  }, 2000);
</script>

<Grid>
  <Row>
    <Column>
      <DataTable sortable {headers} {rows}>
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
              <OverflowMenuItem text="Configure" on:click={() => push('/devices/'+row.addr)} />
              <OverflowMenuItem text="Monitor" />
              <OverflowMenuItem disabled text="Test" />
              <OverflowMenuItem text="Check for Updates" />
            </OverflowMenu>
          {:else}
            {cell.value}
          {/if}
        </span>
      </DataTable>
    </Column>
  </Row>
</Grid>
