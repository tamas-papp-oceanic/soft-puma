<script>
  import {location, push, pop, replace, link} from 'svelte-spa-router'
  import {
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    SkipToContent,
    SideNav,
    SideNavItems,
    SideNavMenu,
    SideNavMenuItem,
    SideNavLink,
    HeaderUtilities,
    HeaderAction,
    HeaderGlobalAction,
    HeaderPanelLinks,
    HeaderPanelDivider,
    HeaderPanelLink,
    Tabs, Tab, TabContent,
    Content,
    Grid,
    Row,
    Column,
    ComposedModal,
    ModalHeader,
    ModalFooter,
  } from "carbon-components-svelte";
  import User20 from "carbon-icons-svelte/lib/User20";
  import Login20 from "carbon-icons-svelte/lib/Login20";
  import Close20 from "carbon-icons-svelte/lib/Close20";
  
  export let company;
  export let product;
  export let version;
  
  let isSideNavOpen = false;
  let isOpen = false;
  let platform = product + " v" + version;
  let routeParsed;
  let re = /(\/[A-z]+)/;
  
  function login(e) {
    push("/login");
  };

  function close(e) {
    isOpen = false;
    window.close();
  };  

  function cancel(e) {
    isOpen = false;
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
      <HeaderGlobalAction on:click={(e) => login(e)} aria-label="Login" icon={Login20} text="Login" />
      <HeaderGlobalAction on:click={(e) => { isOpen = true }} id="close-btn" aria-label="Exit" icon={Close20} />
    </HeaderUtilities>
  </Header>
  <ComposedModal bind:isOpen on:submit={(e) => close(e)}>
    <ModalHeader label="Changes" title="Confirm changes" />
    <ModalFooter
      primaryButtonText="Proceed"
      secondaryButtons={[{ text: "Cancel" }]}
      on:click:button--secondary={(e) => cancel(e)}
    />
  </ComposedModal></div>

<style global>
  .bx--header {
    -webkit-user-select: none;
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
