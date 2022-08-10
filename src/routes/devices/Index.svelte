<script>
  import { Grid, Row, Column, Button, DataTable, Toolbar,
    ToolbarContent, ToolbarSearch,  OverflowMenu, 
    OverflowMenuItem, Pagination, Dropdown, Tag } from "carbon-components-svelte";
  import Scan from "carbon-icons-svelte/lib/SearchLocate16";
  import { push } from 'svelte-spa-router'
  import { name, devices, device } from "../../stores/data.js";

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

  let items = new Array();
  let selected;
  let height;
  let rows = new Array();
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  function getSelected() {
    if ($device != null) {
      for (let i in $devices) {
        if ($devices[i] == $device) {
          selected = i.toString();
        }
      }
    } else {
      selected = '0';
    }
  };

  function scan(e) {
    rows = new Array();
    window.pumaAPI.send('bus-scan');
  };

  function select(e) {
    $device = e.detail.selectedItem.text;
  }

  getSelected();

  // Data getters, setters
  $: {
    let tmp = new Array();
    for (let i in $devices) {
      tmp.push(
        { id: i.toString(), text: $devices[i] },
      );
    }
    items = JSON.parse(JSON.stringify(tmp));
  };
  $: {
    let tmp = new Array();
    if (typeof $name[$device] !== "undefined") {
      for (const [key, val] of Object.entries($name[$device])) {
        let nam = {
          id: key,
          uniqueNumber: val.uniqueNumber != null ? val.uniqueNumber : '',
          manufacturer: val.decoded.manufacturer != null ? val.decoded.manufacturer : '',
          productCode: val.productCode != null ? val.productCode : '',
          modelID: val.modelID != null ? val.modelID : '',
          instance: val.deviceInstance != null ? val.deviceInstance : '',
        };
        tmp.push(nam);
      }
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
          <Dropdown
            style="margin-left: 1rem; grid-gap: 0 1rem;"
            titleText="Interface"
            type="inline"
            size="xl"
            bind:selectedId={selected}
            items={items}
            on:select={(e) => select(e)}
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
