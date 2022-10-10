<script>
  import { push } from 'svelte-spa-router'
  import { Row, Grid, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { selected } from '../../stores/data.js'
  import { devnames } from '../../stores/common.js'

  let tab;
  let dev;
  let devs = {};

  function change(e){
    $selected.config = e.detail;
  }

  $: tab = $selected.config;
  $: dev = $selected.device;
  $: {
    for (const grp of Object.keys(devnames)) {
      if (typeof devs[grp] === 'undefined') {
        devs[grp] = new Array();
      }
      for (const [key, val] of Object.entries(devnames[grp])) {
        if ((grp == 'senders') || (grp == 'adaptors')) {
          devs[grp].push({ code: key, name: val });
        }
      }
    }
  };
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
            <Grid padding fullWidth noGutter>
              <Row>
                {#each devs[group] as device}
                  <Column sm={4} md={3} lg={4}>
                    <div class="product-card" class:selected={dev == device.code} on:pointerdown={(e) => { $selected.device = device.code; push('/configure/' + device.code + '/0/0'); }}>
                      <div class="product-number">{device.code}</div>
                      <div class="product-title">{device.name}</div>
                      <div class="product-image"><img src={'images/' + device.code + '.webp'} alt={device.code} /></div>
                    </div>
                  </Column>
                {/each}
              </Row>
            </Grid>
          </TabContent>
        {/each}
      </div>
    </Tabs>
  </Column>
  </Row>
</Grid>

<style>
  .product-card {
    padding: 1rem;
    width: 100%;
    height: 100%;
    border: 1px solid rgb(75, 75, 75);
    background-color: #222222;
    cursor: pointer;
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
  