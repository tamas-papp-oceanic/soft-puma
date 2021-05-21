<script>
  import {
    Grid,
    Row,
    Column
  } from "carbon-components-svelte";
  import {
    ButtonSet,
    Button,
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
    ToolbarMenu,
    ToolbarMenuItem,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";
  import {push} from 'svelte-spa-router'
  const headers = [{
      key: "addr",
      value: "Address"
    },
    {
      key: "manufacturer",
      value: "Manufacturer"
    },
    {
      key: "productCode",
      value: "Product Code"
    },
    {
      key: "instance",
      value: "Instance"
    },
    {
      key: "productDesc",
      value: "Description"
    },
    {
      key: "id",
      value: "Unique Number"
    },
    {
      key: "overflow",
      empty: true
    },
  ];

  const rows = [{
      id: "412345",
      addr: "0",
      manufacturer: "Oceanic Systems",
      productCode: "4291",
      productDesc: "4291 4-20mA Fluid Sender",
      instance: "0",
    },
    {
      id: "412346",
      addr: "1",
      manufacturer: "Oceanic Systems",
      productCode: "4291",
      productDesc: "4291 4-20mA Fluid Sender",
      instance: "1",
    }
  ];
</script>

<Grid>
  <Row>
    <Column>
      <DataTable sortable {headers} {rows}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarSearch />
<!--            <ToolbarMenu>
              <ToolbarMenuItem primaryFocus>Restart all</ToolbarMenuItem>
              <ToolbarMenuItem href="https://cloud.ibm.com/docs/loadbalancer-service">
                API documentation
              </ToolbarMenuItem>
              <ToolbarMenuItem danger>Stop all</ToolbarMenuItem>
            </ToolbarMenu> -->
            <Button>Scan</Button>
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
    {:else}{cell.value}{/if}
  </span>
      </DataTable>
    </Column>
  </Row>
</Grid>
