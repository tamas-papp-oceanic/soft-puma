<script>
  import { push } from 'svelte-spa-router'
  import { Grid, Row, Column, Button, DataTable, Toolbar,
    ToolbarContent, ToolbarSearch,  OverflowMenu, TooltipIcon,
    OverflowMenuItem, Pagination, Dropdown } from "carbon-components-svelte";
  import Scan from "carbon-icons-svelte/lib/SearchLocate16";
  import Warning from "carbon-icons-svelte/lib/WarningAltFilled16";
  import { name, devices, device, data, updates } from "../../stores/data.js";
  import { compareVersions } from 'compare-versions';
  import { getdev } from '../../config/devices.js';
  import { isRoute } from '../../helpers/route.js'

  const headers = [{
    key: "overflow",
    empty: true
  },{
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
  }];
  let height;
  let rows = new Array();
  let pagination = {
    pageSize: 10,
    totalItems: 0,
    page: 1,
  };

  function conf(e, row) {
    try {
      let nam = $name[$device][row.id];
      let dev = getdev(nam.modelVersion);
      let prf = '/configure/' + nam.modelVersion + '/' + row.instance;
      if ((dev != null) && dev.fluid) {
        prf += '/:fluid';
      }
      let dat = $data[$device];
      for (let i in dat) {
        if (dat[i].header.src == parseInt(row.id)) {
          if (typeof dat[i].header.typ !== 'undefined') {
            if (dat[i].header.pgn == 127505) {
              prf = prf.replace(':fluid', dat[i].header.typ.toString());
            }
          }
          break;
        }
      }
      prf = prf.replace(':instance', '0').replace(':fluid', '0');
      push(prf);
    } catch (err) {
      // console.log(err);
    }
  }
  
  function monitor(e, row) {
    push('/monitor/' + row.id);
  }

  function test(e, row) {
    try {
      let nam = $name[$device][row.id];
      let prf = '/testing/' + nam.modelVersion + '/:instance';
      let dat = $data[$device];
      for (let i in dat) {
        if (dat[i].header.src == parseInt(row.id)) {
          if (dat[i].header.din == parseInt(row.instance)) {
            prf = prf.replace(':instance', row.instance);
          }
          if (typeof dat[i].header.typ !== 'undefined') {
            if (dat[i].header.pgn == 127505) {
              prf = prf.replace(':fluid', dat[i].header.typ.toString());
            }
          }
          break;
        }
      }
      prf = prf.replace(':instance', '0');
      push(prf);
    } catch (err) {
      // console.log(err);
    }
  }
  
  function update(e, row) {
    try {
      let nam = $name[$device][row.id];
      let prf = '/program/' + nam.modelVersion + '/:instance';
      let dat = $data[$device];
      for (let i in dat) {
        if (dat[i].header.src == parseInt(row.id)) {
          if (dat[i].header.din == parseInt(row.instance)) {
            prf = prf.replace(':instance', row.instance);
          }
          break;
        }
      }
      prf = prf.replace(':instance', '0');
      push(prf);
    } catch (err) {
      // console.log(err);
    }
  }
  
  function scan(e) {
    rows = new Array();
    window.pumaAPI.send('bus-scan');
  };
  
  function isUpdate(src) {
    try {
      let nam = $name[$device][src];
      let mod = nam.modelVersion;
      let dve = nam.softwareVersion;
      let cve = $updates[mod];
      if (compareVersions(dve, cve.main[0].version) < 0) {
        return true;
      }
    } catch (err) {
      // console.log(err);
      return false;
    }
    return false;
  };
    
  function isNewDevice(old, cur) {
    let res = false;
    for (let i in cur) {
      let fnd = false;
      for (let j in old) {
        if (old[j].productCode == cur[i].productCode) {
          fnd = true;
          break;
        }
      }
      if (!fnd) {
        res = true;
        break;
      }
    }
    return res;
  }

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
    if (isNewDevice(rows, tmp)) {
      window.pumaAPI.send('updates');
    }
    rows = JSON.parse(JSON.stringify(tmp));
    pagination.items = rows.length;
  };

  // Data getters, setters
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
          <ToolbarContent>
            <ToolbarSearch />
            <Button icon={Scan} on:click={(e) => scan(e)}>Scan</Button>
          </ToolbarContent>
        </Toolbar>
        <span slot="cell" let:cell let:row let:rowIndex>
          {#if cell.key === 'overflow'}
            <OverflowMenu direction={rowIndex < (pagination.pageSize / 2) ? "bottom" : "top"}>
              <OverflowMenuItem text="Configure" disabled={!isRoute('/configure', row.id)} on:click={(e) => conf(e, row)} />
              <OverflowMenuItem text="Monitor" disabled={!isRoute('/monitor')} on:click={(e) => monitor(e, row)} />
              <OverflowMenuItem text="Testing" disabled={!isRoute('/testing', row.id)} on:click={(e) => test(e, row)} />
              <OverflowMenuItem text="Update" disabled={!isRoute('/program') || !isUpdate(row.id)} on:click={(e) => update(e, row)} />
            </OverflowMenu>
          {:else}
            {cell.value}
            {#if (cell.key === 'softwareVersion') && isUpdate(row.id)}
              <TooltipIcon tooltipText="Software update is available" icon={Warning} class="icon" />
            {/if}
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

<style global>
  .icon.bx--tooltip__trigger svg {
    fill: #ffc000;
  }
</style>