<script>
  import { createEventDispatcher } from "svelte";
  import { Row, Grid, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { getname } from '../config/devices.js'

  export let devices;
  export let tab;
  export let dev;

  const dispatch = createEventDispatcher();

  function change(e) {
    tab = e.detail;
  };

  function select(e, grp, dev) {
    dispatch("select", { group: grp, device: dev });
  };
</script>

<Grid>
  <Row>
    <Column>
    <Tabs type="container" bind:selected={tab} on:change={(e) => change(e)}>
      {#each Object.entries(devices) as [group, val]}
        {#if val.length > 0}
          <Tab label={group.charAt(0).toUpperCase() + group.slice(1).toLowerCase()} />
        {/if}
      {/each}
      <svelte:fragment slot="content">
        {#each Object.entries(devices) as [group, val]}
          {#if val.length > 0}
            <TabContent>
              <div class="secont">
                <div class="selist">
                  <Grid padding fullWidth noGutter>
                    <Row>
                      {#each val as device}
                        <Column sm={2} md={3} lg={4}>
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
  .secont {
    width: 100%;
    height: 77vh;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .selist {
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
  