<script>
  import { push } from 'svelte-spa-router'
  import { Row, Grid, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { findModel, selected } from '../../stores/data.js'
  import { getname } from '../../stores/common.js'

  let tab;
  let dev;
  let devs = {
    'senders': ['3271', '3281', '3410', '3420', '4510', '4521'],
    'adaptors': ['3125', '4291'],
    'displays': new Array(),
  };

  function change(e) {
    $selected.config = e.detail;
  };

  function select(e, grp, dev) {
    $selected.device = dev;
    let ins = '0';
    let pro = findModel(dev);
    if ((pro !== null) && (Array.isArray(pro)) && (pro.length > 0)) {
      ins = pro[0].name.deviceInstance.toString();
    }
    push('/configure/' + dev + '/' + ins + ((grp != 'displays') && ((dev.includes('3125') || dev.includes('3271') || dev.includes('3281') || dev.includes('4291')) ? '/0' : '')));
  };

  $: tab = $selected.config;
  $: dev = $selected.device;
</script>

<Grid>
  <Row>
    <Column>
      <Tabs type="container" bind:selected={tab} on:change={(e) => change(e)}>
        <Tab label="Sensors" />
        <Tab label="Adaptors" />
        <Tab label="Displays" />
        <div slot="content">
          {#each ['senders', 'adaptors', 'displays'] as group}
            <TabContent>
              <div class="cocont">
                <div class="colist">
                  <Grid padding fullWidth noGutter>
                    <Row>
                      {#each devs[group] as device}
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
          {/each}
        </div>
      </Tabs>
    </Column>
  </Row>
</Grid>

<style>
  .cocont {
    width: 100%;
    height: 77vh;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .colist {
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
  