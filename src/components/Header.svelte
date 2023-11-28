<script>
  import { push } from 'svelte-spa-router'
  import { Header, HeaderNav, HeaderNavItem, HeaderUtilities, HeaderGlobalAction,
    ComposedModal, ModalHeader, ModalBody, ModalFooter, TooltipDefinition,
    Dropdown } from "carbon-components-svelte";
  import Update20 from "carbon-icons-svelte/lib/UpdateNow20";
  import Login20 from "carbon-icons-svelte/lib/Login20";
  import Logout20 from "carbon-icons-svelte/lib/Logout20";
  import Close20 from "carbon-icons-svelte/lib/Close20";
  import { logout } from '../auth/auth.js'
  import { loggedIn } from '../stores/user.js';
  import { devices, device, protocol, data, name } from '../stores/data.js';
	import { update, updmsg, download } from '../stores/update.js';
  import { routeGuard } from '../helpers/guard.js';
  
  export let company;
  export let product;
  export let version;
  
  const menu = [
    { id: '0', text: 'Devices', location: '/', selected: false, enabled: true, protocols: ['0'] },
    { id: '1', text: 'Monitor', location: '/monitor', selected: false, enabled: true, protocols: ['0', '1'] },
    { id: '2', text: 'Configure', location: '/configure', selected: false, enabled: true, protocols: ['0'] },
    { id: '3', text: 'Testing', location: '/testing', selected: false, enabled: true, protocols: ['0'] },
    { id: '4', text: 'Update', location: '/program', selected: false, enabled: true, protocols: ['0'] },
    { id: '5', text: 'Simulate', location: '/simulate', selected: false, enabled: true, protocols: ['0', '1'] },
    { id: '6', text: 'Profile', location: '/profile', selected: false, enabled: true },
    { id: '7', text: 'Manage', location: '/manage', selected: false, enabled: true },
  ];
  const proItems = [
    { id: '0', text: 'nmea2000' },
    { id: '1', text: 'j1939' },
  ];

  let devItems = new Array();
  let extry = false;
  let lotry = false;
  let platform = product + " v" + version;
  let re = /(\/[A-z]+)/;
  let selected = {
    menu: menu[0],
    device: '0',
    protocol: '0',
  }

  // Initially select "Devices" menu
  _select(null, selected.menu);

  function mark(loc) {
    for (let i in menu) {
      menu[i].selected = (menu[i].location == loc);
    }
  };

  function first() {
    for (let i in menu) {
      if (menu[i].enabled) {
        return menu[i];
      }
    }
  };

  function enable(pro) {
    for (let i in menu) {
      menu[i].enabled = routeGuard({location: menu[i].location});
      if (menu[i].enabled && menu[i].hasOwnProperty("protocols")) {
        menu[i].enabled = (menu[i].protocols.indexOf(pro) !== -1);
      }
      if (menu[i].id === selected.menu.id) {
        if (!menu[i].enabled) {
          _select(null, first());
        } else {
          selected.menu = menu[i];
        }
      }
    }
  };

  function _select(e, itm) {
    selected.menu = itm;
    mark(itm.location);
    push(itm.location);
  };

  function __exit(e) {
    extry = true;
  };  

  function __logout(e) {
    lotry = true;
  };

  function _login(e) {
    push("/login");
  };

  async function _logout(e) {
    lotry = false;
    const res = await logout();
    if (res == true) {
      push("/login");
    }
  };

  function _exit(e) {
    extry = false;
    window.pumaAPI.send('app-quit');
  };  

  function _cancel(e) {
    extry = false;
    lotry = false;
  };
  
  function _update(e) {
    $download = true;
  };

  function devSelect(e) {
    if ($device !== e.detail.selectedItem.text) {
      $device = e.detail.selectedItem.text;
    }
    for (let i in proItems) {
      if (proItems[i].text === $devices[$device].protocol) {
        if (selected.protocol !== proItems[i].id) {
          selected.protocol = proItems[i].id;
          $protocol = proItems[i].protocol;
          break;
        }
      }
    }
    enable(selected.protocol);
  };

  function proSelect(e) {
    let pro = e.detail.selectedItem.text;
    if ($devices[$device].protocol !== pro) {
      $protocol = pro;
      $data[$device] = {};
      $name[$device] = {};
      window.pumaAPI.send('set-prot', [$device, pro]);
    }
    enable(selected.protocol);
  };

  function getDevices(des) {
    let tmp = new Array();
    for (const [key, val] of Object.entries(des)) {
      tmp.push(
        { id: val.id, text: val.text, protocol: val.protocol },
      );
    }
    devItems = JSON.parse(JSON.stringify(tmp));
    if (typeof des[$device] !== 'undefined') {
      selected.device = des[$device].id;
    } else {
      if (devItems.length > 0) {
        $device = devItems[0].text;
        selected.device = devItems[0].id;
      }
    }
  };

  $: $devices, getDevices($devices);
  $: platform = product + " v" + version
</script>

<div>
  <Header company={company} platformName={platform}>
    <HeaderNav>
      <Dropdown
        style=" grid-gap: 0 0.25rem;"
        titleText="Interface:"
        type="inline"
        size="xl"
        bind:selectedId={selected.device}
        items={devItems}
        on:select={(e) => devSelect(e)} />
      <Dropdown
        style="grid-gap: 0 0.25rem;"
        hideLabel
        type="inline"
        size="xl"
        bind:selectedId={selected.protocol}
        items={proItems}
        on:select={(e) => proSelect(e)} />
    </HeaderNav>
    <HeaderNav>
      {#each menu as item}
        {#if item.enabled}
          <HeaderNavItem bind:isSelected={item.selected} on:click={(e) => _select(e, item)} text={item.text} />
        {/if}
      {/each}
    </HeaderNav>
    <HeaderUtilities>
      {#if $update}
        <TooltipDefinition direction="bottom" align="center" tooltipText={"Update available: v" + $updmsg + "\nClick to install."}>
          <HeaderGlobalAction on:click={(e) => _update(e)} aria-label="Update available" icon={Update20} />
        </TooltipDefinition>
      {/if}
      {#if !$loggedIn}
        <TooltipDefinition direction="bottom" align="center" tooltipText="Login">
          <HeaderGlobalAction on:click={(e) => _login(e)} aria-label="Login" icon={Login20} />
        </TooltipDefinition>
      {:else}
        <TooltipDefinition direction="bottom" align="center" tooltipText="Logout">
          <HeaderGlobalAction on:click={(e) => __logout(e)} aria-label="Logout" icon={Logout20} />
        </TooltipDefinition>
      {/if}
      <TooltipDefinition direction="bottom" align="center" tooltipText="Exit">
        <HeaderGlobalAction on:click={(e) => __exit(e)} aria-label="Exit" icon={Close20} />
      </TooltipDefinition>
    </HeaderUtilities>
  </Header>
  <ComposedModal open={extry} on:submit={(e) => _exit(e)} on:close={(e) => _cancel(e)} size="xs">
    <ModalHeader title="Confirm exit" />
    <ModalFooter
      primaryButtonText="Proceed"
      secondaryButtons={[{ text: "Cancel" }]}
      on:click:button--secondary={(e) => _cancel(e)}
    />
  </ComposedModal>
  <ComposedModal open={lotry} on:submit={(e) => _logout(e)} on:close={(e) => _cancel(e)} size="xs">
    <ModalHeader title="Are you sure you want to log out?" />
    <ModalBody>
      <span>You will require an internet connection to log back in.</span>
    </ModalBody>
    <ModalFooter
      primaryButtonText="Proceed"
      secondaryButtons={[{ text: "Cancel" }]}
      on:click:button--secondary={(e) => _cancel(e)}
    />
  </ComposedModal>
</div>

<style global>
  .bx--header {
    -webkit-user-select: none;
    user-select: none;
    -webkit-app-region: drag;
  }
  button,
  a {
    -webkit-app-region: no-drag;
  }
  .active {
    background-color: #262626;
  }
  .bx--table-sort.bx--table-sort--active, .bx--table-sort:hover {
    background: #4e4e4e;
  }
  .bx--tooltip__trigger.bx--tooltip__trigger--definition {
    border-bottom: none;
  }
  .bx--tooltip__trigger.bx--tooltip__trigger--definition.bx--tooltip--bottom.bx--tooltip--align-center.bx--tooltip--a11y+.bx--assistive-text {
    white-space: pre-line;
  }
</style>

