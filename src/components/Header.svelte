<script>
  import { location, push } from 'svelte-spa-router'
  import { Header, HeaderNav, HeaderNavItem, HeaderUtilities, HeaderGlobalAction,
    ComposedModal, ModalHeader, ModalFooter } from "carbon-components-svelte";
  import { logout } from '../auth/auth.js'
  import { loggedIn } from '../stores/user.js';
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
      {#if !$loggedIn}
        <HeaderGlobalAction on:click={(e) => _login(e)} aria-label="Login" icon={Login20} text="Login" />
      {:else}
        <HeaderGlobalAction on:click={(e) => _logout(e)} aria-label="Logout" icon={Logout20} text="Logout" />
      {/if}
      <HeaderGlobalAction on:click={(e) => _show(e)} id="close-btn" aria-label="Exit" icon={Close20} />
    </HeaderUtilities>
  </Header>
  <ComposedModal bind:open on:submit={(e) => _close(e)} size="xs">
    <ModalHeader title="Confirm exit" />
    <ModalFooter
      primaryButtonText="Proceed"
      secondaryButtons={[{ text: "Cancel" }]}
      on:click:button--secondary={(e) => _cancel(e)}
    />
  </ComposedModal></div>

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
</style>
