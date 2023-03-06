<script>
  import { push } from 'svelte-spa-router'
  import { Grid, Row, Column, Button, DataTable, Toolbar,
    ToolbarContent, ToolbarSearch,  OverflowMenu, 
    OverflowMenuItem, Pagination, Dropdown, Tag } from "carbon-components-svelte";
  import Scan from "carbon-icons-svelte/lib/SearchLocate16";
  import { name, devices, device, data, allRoutes, versions } from "../../stores/data.js";
  import { compareVersions } from 'compare-versions';

  const headers = [{
    key: "id",
    value: "Address"
  },{
    key: "instance",
    value: "Instance"
  },{
    key: "manufacturer",
    value: "Manufacturer"
  },{
    key: "modelID",
    value: "Description"
  },{
    key: "productCode",
    value: "Product Code"
  },{
    key: "modelVersion",
    value: "Part Number"
  },{
    key: "softwareVersion",
    value: "Version"
  },{
    key: "uniqueNumber",
    value: "Unique Number"
  },{
    key: "overflow",
    empty: true
  }];
  const paths = {
    '3271': '/:instance/:fluid',
    '3420': '/:instance',
    '3478': '/:instance',
    '4291': '/:instance/:fluid',
    '4410': '/:instance',
  };

  let items = new Array();
  let selected;
  let height;
  let rows = new Array();
  let pagination = {
    pageSize: 10,
    totalItems: 0,
    page: 1,
  };

  function conf(e, row) {
    if ((typeof $devices[selected] !== 'undefined') &&
    (typeof $name[$devices[selected]] !== 'undefined') &&
    (typeof $name[$devices[selected]][row.id] !== 'undefined')) {
      let nam = $name[$devices[selected]][row.id];
      let pat = '/configure';
      if (typeof paths[nam.modelVersion] !== 'undefined') {
        pat += '/' + nam.modelVersion + paths[nam.modelVersion];
      }
      if (typeof $data[$devices[selected]] !== 'undefined') {
        let dat = $data[$devices[selected]];
        for (let i in dat) {
          if (dat[i].header.src == parseInt(row.id)) {
            if ((dat[i].header.src == parseInt(row.id)) && (dat[i].header.ins == parseInt(row.instance))) {
              pat = pat.replace(':instance', row.instance);
            }
            if (typeof dat[i].header.typ !== 'undefined') {
              if (dat[i].header.pgn == 127505) {
                pat = pat.replace(':fluid', dat[i].header.typ.toString());
              }
            }
            break;
          }
        }
      }
      pat = pat.replace(':instance', '0').replace(':fluid', '0');
      push(pat);
    }
  }
  
  function test(e, row) {
    if ((typeof $devices[selected] !== 'undefined') &&
    (typeof $name[$devices[selected]] !== 'undefined') &&
    (typeof $name[$devices[selected]][row.id] !== 'undefined')) {
      let nam = $name[$devices[selected]][row.id];
      let pat = '/testing';
      if (typeof paths[nam.modelVersion] !== 'undefined') {
        pat += '/' + nam.modelVersion + paths[nam.modelVersion];
      }
      if (typeof $data[$devices[selected]] !== 'undefined') {
        let dat = $data[$devices[selected]];
        for (let i in dat) {
          if ((dat[i].header.src == parseInt(row.id)) && (dat[i].header.ins == parseInt(row.instance))) {
            pat = pat.replace(':instance', row.instance);
            break;
          }
        }
      }
      pat = pat.replace(':instance', '0');
      push(pat);
    }
  }
  
  function update(e, row) {
    if ((typeof $devices[selected] !== 'undefined') &&
    (typeof $name[$devices[selected]] !== 'undefined') &&
    (typeof $name[$devices[selected]][row.id] !== 'undefined')) {
      let nam = $name[$devices[selected]][row.id];
      let pat = '/program';
      if (typeof paths[nam.modelVersion] !== 'undefined') {
        pat += '/' + nam.modelVersion + paths[nam.modelVersion];
      }
      if (typeof $data[$devices[selected]] !== 'undefined') {
        let dat = $data[$devices[selected]];
        for (let i in dat) {
          if ((dat[i].header.src == parseInt(row.id)) && (dat[i].header.ins == parseInt(row.instance))) {
            pat = pat.replace(':instance', row.instance);
            break;
          }
        }
      }
      pat = pat.replace(':instance', '0');
      push(pat);
    }
  }
  
  function scan(e) {
    rows = new Array();
    window.pumaAPI.send('bus-scan');
  };
  
  function select(e) {
    $device = e.detail.selectedItem.text;
  };
  
  function isRoute(prf, add) {
    if ((typeof $devices[selected] !== 'undefined') &&
    (typeof $name[$devices[selected]] !== 'undefined') &&
    (typeof $name[$devices[selected]][add] !== 'undefined')) {
      let nam = $name[$devices[selected]][add];
      if (typeof paths[nam.modelVersion] !== 'undefined') {
        prf += '/' + nam.modelVersion;
        for (let r of $allRoutes) {
          if (r.startsWith('/' + prf)) {
            return true;
          }
        }
      }
    }
    return false;
  };
  
  function isUpdate(add) {
    if ((typeof $devices[selected] !== 'undefined') &&
      (typeof $name[$devices[selected]] !== 'undefined') &&
      (typeof $name[$devices[selected]][add] !== 'undefined')) {
      let nam = $name[$devices[selected]][add];
      let mod = nam.modelVersion;
      let dve = nam.softwareVersion;
      let cve = $versions[mod];
      if (compareVersions(dve, cve) > 0) {
        return true;
      }
    }
    return false;
  };
    
  function getSelected() {
    if (typeof selected === "undefined") {
      if ($device != null) {
        for (let i in $devices) {
          if ($devices[i] == $device) {
            selected = i.toString();
          }
        }
      } else {
        if (Object.keys($devices).length > 0) {
          $device = Object.values($devices)[0];          
          selected = '0';
        }
      }
    }
  };

  function getItems() {
    let tmp = new Array();
    for (let i in $devices) {
      tmp.push(
        { id: i.toString(), text: $devices[i] },
      );
    }
    items = JSON.parse(JSON.stringify(tmp));
  };
  
  function getRows() {
    let tmp = new Array();
    if (typeof $name[$device] !== "undefined") {
      for (const [key, val] of Object.entries($name[$device])) {
        let nam = {
          id: key,
          instance: val.deviceInstance != null ? val.deviceInstance : '',
          manufacturer: val.decoded.manufacturer != null ? val.decoded.manufacturer : '',
          modelID: val.modelID != null ? val.modelID : '',
          productCode: val.productCode != null ? val.productCode : '',
          modelVersion: val.modelVersion != null ? val.modelVersion : '',
          softwareVersion: val.softwareVersion != null ? val.softwareVersion : '',
          uniqueNumber: val.uniqueNumber != null ? val.uniqueNumber : '',
        };
        tmp.push(nam);
      }
    }
    rows = JSON.parse(JSON.stringify(tmp));
    pagination.totalItems = rows.length;
  };

  // Data getters, setters
  $: $devices, getSelected();
  $: $devices, getItems();
  $: $name[$device], getRows();
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
          <OverflowMenuItem text="Configure" disabled={!isRoute('configure', row.id)} on:click={(e) => conf(e, row)} />
            <OverflowMenuItem text="Monitor" on:click={(e) => push('/monitor/'+row.id)} />
              <OverflowMenuItem text="Test" disabled={!isRoute('testing', row.id)} on:click={(e) => test(e, row)} />
                <OverflowMenuItem text="Update" disabled={!isRoute('program', row.id) || !isUpdate(row.id)} on:click={(e) => update(e, row)} />
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
