<script>
  import { Grid, Row, Column } from "carbon-components-svelte";
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
  Content
} from "carbon-components-svelte";
import User20 from "carbon-icons-svelte/lib/User20";
import Close20 from "carbon-icons-svelte/lib/Close20";
  let isSideNavOpen = false;
  let isOpen = false;
  export let company;
  export let product;
  export let version;
  let platform = product + " v" + version;
  $: platform = product + " v" + version
</script>

<style global>
.bx--header {
  -webkit-user-select: none;
  -webkit-app-region: drag;
}
button, a {
  -webkit-app-region: no-drag;
}
</style>

<div>
<Header company={company} platformName={platform}>
  <HeaderNav>
    <HeaderNavItem href="/" text="Devices" />
    <HeaderNavItem href="/" text="Simulate" />
    <HeaderNavItem href="/" text="Configure" />
    <HeaderNavItem href="/" text="Test" />
    <HeaderNavItem href="/" text="Program" />
  </HeaderNav>
  <HeaderUtilities>
  <HeaderAction aria-label="Login" icon={User20} text="Login"/>
  <HeaderAction aria-label="Exit" icon={Close20} />
</HeaderUtilities>
</Header>
</div>
