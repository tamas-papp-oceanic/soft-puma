<script>
  import { Row, Grid, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { push } from 'svelte-spa-router'
  import { findModel, selected } from '../../stores/data.js'
  import { checkAccess } from '../../auth/auth'
  import { getname, getfunc } from '../../stores/common.js'

  const devs = getfunc('prog');
  let tab;
  let dev;

  function change(e) {
    $selected.program = e.detail;
  };

  function select(e, grp, dev) {
    $selected.device = dev;
    let ins = '0';
    let pro = findModel(dev);
    if ((pro !== null) && (Array.isArray(pro)) && (pro.length > 0)) {
      ins = pro[0].name.deviceInstance.toString();
    }
    push('/program/' + dev + (grp != 'displays' ? '/' + ins : ''));
  };

  $: tab = $selected.program;
  $: dev = $selected.device;
</script>

<Grid>
  <Row>
    <Column>
    <Tabs type="container" bind:selected={tab} on:change={(e) => change(e)}>
      {#each Object.entries(devs) as [group, val]}
        {#if val.length > 0}
          <Tab label={group.charAt(0).toUpperCase() + group.slice(1).toLowerCase()} />
        {/if}
      {/each}
      <svelte:fragment slot="content">
        {#each Object.entries(devs) as [group, val]}
          {#if val.length > 0}
            <TabContent>
              <div class="prcont">
                <div class="prlist">
                  <Grid padding fullWidth noGutter>
                    <Row>
                      {#each val as device}
                        <Column sm={4} md={3} lg={4}>
                          <div class="product-card" class:selected={dev == device} on:pointerdown={(e) => select(e, group, device)}>
                            <div>
                              <div class="product-number">{device}</div>
                              <div class="product-title">{getname(device)}</div>
                            </div>
                            <div class="product-image"><img src={'images/' + device + '.webp'} alt={device} /></div>
                          </div>
                        </Column>
                      {/each}
                    </Row>
                  </Grid>
                </div>
              </div>
            </TabContent>
          {/if}
        {/each}
      </svelte:fragment>
    </Tabs>
  </Column>
  </Row>
</Grid>

<style>
  .prcont {
    width: 100%;
    height: 77vh;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .prlist {
    height: 100%;
  }
  .product-card {
    display: flex;
    flex-flow: column nowrap;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    border: 1px solid rgb(75, 75, 75);
    background-color: #222222;
    cursor: pointer;
    padding: 1rem;
  }
  .product-card:hover, .product-card.selected:hover {
    border: 1px solid white;
    background-color: #262626;
  }
  .product-card.selected {
    border: 1px solid rgb(168, 168, 168);
  }
  .product-number {
    font-weight: 800;
    font-size: 22px;
  }
  .product-title {
    padding-top: 0.5rem;
    font-weight: 400;
    font-size: 18px;
  }
  .product-image > img {
    width: 100%;
  }
  </style>
  