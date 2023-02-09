<script>
  import { Row, Grid, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { push } from 'svelte-spa-router'
  import { findModel, getInstances, selected } from '../../stores/data.js'
  import { checkAccess } from '../../auth/auth'
  import { getname } from '../../stores/common.js'

  let tab;
  let dev;
  let devs = {
    'senders': ['3420'],
    'adaptors': new Array(),
    'displays': new Array(),
  };

  function change(e) {
    $selected.program = e.detail;
  };

  function select(e, grp, dev) {

console.log(grp, dev);

  $selected.device = dev;
    let ins = '0';
    let pro = findModel(dev);
    if ((pro !== null) && (typeof pro === 'object') && (Object.keys(pro).length > 0)) {
      ins = pro[0].deviceInstance.toString();
    }
    push('/program/' + dev + (grp != 'displays' ? '/' + ins : ''));
  };

  $: tab = $selected.program;
  $: dev = $selected.device;
  $: if (checkAccess('test', 'write')) {
    devs['displays'] = ['5185',  '5185-H'];
  } else {
    devs['displays'] = new Array();
  }
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
                    <div class="product-card" class:selected={dev == device} on:pointerdown={(e) => select(e, group, device)}>
                      <div class="product-number">{device}</div>
                      <div class="product-title">{getname(device)}</div>
                      <div class="product-image"><img src={'images/' + device + '.webp'} alt={device} /></div>
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
  