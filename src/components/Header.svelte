<script>
  import {
    Grid,
    Row,
    Column
  } from "carbon-components-svelte";
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
    Content
  } from "carbon-components-svelte";
  import User20 from "carbon-icons-svelte/lib/User20";
  import Login20 from "carbon-icons-svelte/lib/Login20";
  import Close20 from "carbon-icons-svelte/lib/Close20";
  let isSideNavOpen = false;
  let isOpen = false;
  export let company;
  export let product;
  export let version;
  let platform = product + " v" + version;
  $: platform = product + " v" + version
  let closeWindow = function(){
    window.close()
  }
  import {location, push, pop, replace, link} from 'svelte-spa-router'
  let login = function(){
    push("/login")
  }
  let routeParsed;
  let re = /(\/[A-z]+)/;
  $: routeParsed = $location.replace(re, '$1')
</script>

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

<div>
  <Header company={company} platformName={platform}>
    <HeaderNav>
      <HeaderNavItem class="{($location === '/' || routeParsed === '/devices') ? 'active' : ''}" on:click={() => push('/')} text="Devices" />
      <HeaderNavItem class="{routeParsed === '/simulate' ? 'active' : ''}" on:click={() => push('/simulate')} text="Simulate" />
      <HeaderNavItem class="{routeParsed === '/program' ? 'active' : ''}"disabled on:click={() => push('/program')} text="Program" />
    </HeaderNav>
    {$location}
    <HeaderUtilities>
      <HeaderGlobalAction on:click={login} aria-label="Login" icon={Login20} text="Login" />
      <HeaderGlobalAction on:click={closeWindow} id="close-btn" aria-label="Exit" icon={Close20} />
    </HeaderUtilities>
  </Header>
</div>
