<script>
  import { Row, Grid, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { push } from 'svelte-spa-router'
  import { selected } from '../../stores/data.js'
  import { checkAccess } from '../../auth/auth'
  import { devnames } from '../../stores/common.js'

  let tab;
  let dev;
  let ptw;
  let devs = {};

  function change(e){
    $selected.program = e.detail;
  }

  $: tab = $selected.program;
  $: dev = $selected.device;
  $: ptw = checkAccess('test', 'write');
  $: {
    for (const grp of Object.keys(devnames)) {
      if (typeof devs[grp] === 'undefined') {
        devs[grp] = new Array();
      }
      for (const [key, val] of Object.entries(devnames[grp])) {
        if ((grp == 'monitors') || ((grp == 'displays') && ptw)) {
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
      {#if ptw}
        <Tab label="Displays" />
      {/if}
      <div slot="content">
        {#each ['monitors', 'adaptors', 'displays'] as group}
        <TabContent>
          <Grid padding fullWidth noGutter>
            <Row>
              {#each devs[group] as device}
                <Column sm={4} md={3} lg={4}>
                  <div class="product-card" class:selected={dev == device.code}
                    on:pointerdown={(e) => { $selected.device = device.code; push('/program/' + device.code + '/0'); }}>
                    <div class="product-number">{device.code}</div>
                    <div class="product-title">{device.name}</div>
                    <div class="product-image"><img src={'images/' + device.code + '.webp'} alt={device.code} /></div>
                  </div>
                </Column>
              {/each}
            </Row>
<!--        <Row>
              <Column sm={4} md={3} lg={4}>
                <div class="product-card" class:selected={dev == '3420'} on:pointerdown={(e) => { $selected.device = '3420'; push('/program/3420'); }}>
                  <div class="product-number">3420</div>
                  <div class="product-title">{devnames['3420']}</div>
                  <div class="product-image"><img src="images/3420.webp" alt="3420" /></div>
                </div>
              </Column>
            </Row> -->
          </Grid>
        </TabContent>
        <!-- <TabContent>
          <Grid padding fullWidth noGutter>
            <Row>
              <Column sm={4} md={3} lg={4}>
              </Column>
          </Row>
          </Grid>
        </TabContent>
        {#if ptw}
          <TabContent>
            <Grid padding fullWidth noGutter>
              <Row>
                <Column sm={4} md={3} lg={4}>
                  <div class="product-card" class:selected={dev == '5185'} on:pointerdown={(e) => { $selected.device = '5185'; push('/program/5185'); }}>
                    <div class="product-number">5185</div>
                    <div class="product-title">{devnames['5185']}</div>
                    <div class="product-image"><img src="images/P7.webp" alt="P7" /></div>
                  </div>
                </Column>
                <Column sm={4} md={3} lg={4}>
                  <div class="product-card" class:selected={dev == '5185-H'} on:pointerdown={(e) => { $selected.device = '5185-H'; push('/program/5185/Honda'); }}>
                    <div class="product-number">5185</div>
                    <div class="product-title">{devnames['5185'] + ' (Honda)'}</div>
                    <div class="product-image"><img src="images/P7-Honda.webp" alt="P7-H" /></div>
                  </div>
                </Column>
              </Row>
            </Grid>
          </TabContent>
        {/if} -->
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
  