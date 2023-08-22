<script>
  import { location, push } from 'svelte-spa-router'
  import { Header, HeaderNav, HeaderNavItem, HeaderUtilities, HeaderGlobalAction,
    ComposedModal, ModalHeader, ModalFooter, TooltipDefinition, Dropdown } from "carbon-components-svelte";
  import { logout } from '../auth/auth.js'
  import { loggedIn } from '../stores/user.js';
  import { devices, device } from '../stores/data.js';
	import { update, updmsg, download } from '../stores/update.js';
  import Update20 from "carbon-icons-svelte/lib/UpdateNow20";
  import Login20 from "carbon-icons-svelte/lib/Login20";
  import Logout20 from "carbon-icons-svelte/lib/Logout20";
  import Close20 from "carbon-icons-svelte/lib/Close20";
  
  export let company;
  export let product;
  export let version;
  
  const menu = [
    { text: 'Devices', path: '/', selected: false },
    { text: 'Configure', path: '/configure', selected: false },
    { text: 'Testing', path: '/testing', selected: false },
    { text: 'Update', path: '/program', selected: false },
    { text: 'Simulate', path: '/simulate', selected: false },
    { text: 'Advanced', path: '/advanced', selected: false },
  ];
  const proItems = [
    { id: '0', text: 'nmea2000' },
    { id: '1', text: 'j1939' },
  ];

  let devItems = new Array();
  let open = false;
  let platform = product + " v" + version;
  let re = /(\/[A-z]+)/;
  let selected = {
    menu: null,
    device: '0',
    protocol: '0',
  }

  function mark(rou) {
    for (let i in menu) {
      menu[i].selected = (menu[i].path == rou);
    }
  };

  function select(e, itm) {
    selected.menu = itm;
    mark(itm.path);
    if ((itm.text === 'Devices') && (selected.protocol === '1')) {
      push('/monitor/-1');
    } else {
      push(itm.path);
    }
  };

  function login(e) {
    push("/login");
  };

  async function _logout(e) {
    const res = await logout();
    if (res == true) {
      push("/login");
    }
  };

  function close(e) {
    open = false;
    window.pumaAPI.send('app-quit');
  };  

  function show(e) {
    open = true;
  };  

  function cancel(e) {
    open = false;
  };
  
  function _update(e) {
    $download = true;
  };

  function devSelect(e) {
    if ($device !== e.detail.selectedItem.text) {
      $device = e.detail.selectedItem.text;
      select(null, selected.menu);
    }
    for (let i in proItems) {
      if (proItems[i].text === $devices[$device].protocol) {
        selected.protocol = proItems[i].id;
        break;
      }
    }
  };

  function proSelect(e) {
    if ($devices[$device].protocol !== e.detail.selectedItem.text) {
      window.pumaAPI.send('set-prot', [$device, proItems[selected.protocol].text]);
    }
  };

  function getDevices() {
    let tmp = new Array();
    for (const [key, val] of Object.entries($devices)) {
      tmp.push(
        { id: val.id, text: val.text, protocol: val.protocol },
      );
    }
    devItems = JSON.parse(JSON.stringify(tmp));
    if (typeof $devices[$device] !== 'undefined') {
      selected.device = $devices[$device].id;
    } else {
      if (devItems.length > 0) {
        $device = devItems[0].text;
        selected.device = devItems[0].id;
      }
    }
    if (devItems.length > 0) {
      for (let i in proItems) {
        if (proItems[i].text === $devices[$device].protocol) {
          if (selected.protocol !== proItems[i].id) {
            selected.protocol = proItems[i].id;
            select(null, selected.menu);
          }
          break;
        }
      }
    }
  };

  $: platform = product + " v" + version
  $: $location, mark($location.replace(re, '$1'));
  $: $devices, getDevices();
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
        <HeaderNavItem bind:isSelected={item.selected} on:click={(e) => { select(e, item) }} text={item.text} />
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
          <HeaderGlobalAction on:click={(e) => login(e)} aria-label="Login" icon={Login20} />
        </TooltipDefinition>
      {:else}
        <TooltipDefinition direction="bottom" align="center" tooltipText="Logout">
          <HeaderGlobalAction on:click={(e) => logout(e)} aria-label="Logout" icon={Logout20} />
        </TooltipDefinition>
      {/if}
      <TooltipDefinition direction="bottom" align="center" tooltipText="Exit">
        <HeaderGlobalAction on:click={(e) => show(e)} aria-label="Exit" icon={Close20} />
      </TooltipDefinition>
    </HeaderUtilities>
  </Header>
  <ComposedModal open={open} on:submit={(e) => close(e)} on:close={(e) => cancel(e)} size="xs">
    <ModalHeader title="Confirm exit" />
    <ModalFooter
      primaryButtonText="Proceed"
      secondaryButtons={[{ text: "Cancel" }]}
      on:click:button--secondary={(e) => cancel(e)}
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

