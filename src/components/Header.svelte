<script>
  import { location, push } from 'svelte-spa-router'
  import { Header, HeaderNav, HeaderNavItem, HeaderUtilities, HeaderGlobalAction,
    ComposedModal, ModalHeader, ModalFooter, TooltipDefinition } from "carbon-components-svelte";
  import { logout } from '../auth/auth.js'
  import { loggedIn } from '../stores/user.js';
	import { update, updmsg, download } from '../stores/update.js';
  import Update20 from "carbon-icons-svelte/lib/UpdateNow20";
  import Login20 from "carbon-icons-svelte/lib/Login20";
  import Logout20 from "carbon-icons-svelte/lib/Logout20";
  import Close20 from "carbon-icons-svelte/lib/Close20";
  
  export let company;
  export let product;
  export let version;
  
  let open = false;
  let platform = product + " v" + version;
  let routeParsed;
  let re = /(\/[A-z]+)/;
  
  function _login(e) {
    push("/login");
  };

  async function _logout(e) {
    let res = await logout();
    if (res == true) {
      push("/logout");
    }
  };

  function _close(e) {
    open = false;
    window.pumaAPI.send('app-quit');
  };  

  function _show(e) {
    open = true;
  };  

  function _cancel(e) {
    open = false;
  };
  
  function _update(e) {
    $download = true;
  };

  $: platform = product + " v" + version
  $: routeParsed = $location.replace(re, '$1')
</script>

<div>
  <Header company={company} platformName={platform}>
    <HeaderNav>
      <HeaderNavItem class="{($location === '/' || routeParsed === '/devices') ? 'active' : ''}" on:click={() => push('/')} text="Devices" />
      <HeaderNavItem class="{routeParsed === '/simulate' ? 'active' : ''}" on:click={() => push('/simulate')} text="Simulate" />
      <HeaderNavItem class="{routeParsed === '/program' ? 'active' : ''}"disabled on:click={() => push('/program')} text="Program" />
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
          <HeaderGlobalAction on:click={(e) => _logout(e)} aria-label="Logout" icon={Logout20} />
        </TooltipDefinition>
      {/if}
      <TooltipDefinition direction="bottom" align="center" tooltipText="Exit">
        <HeaderGlobalAction on:click={(e) => _show(e)} aria-label="Exit" icon={Close20} />
      </TooltipDefinition>
    </HeaderUtilities>
  </Header>
  <ComposedModal open={open} on:submit={(e) => _close(e)} on:close={(e) => _cancel(e)} size="xs">
    <ModalHeader title="Confirm exit" />
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

