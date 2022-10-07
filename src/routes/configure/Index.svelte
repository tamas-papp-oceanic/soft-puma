<script>
  import { Row, Grid, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { push } from 'svelte-spa-router'
  import { selected } from '../../stores/data.js'
  import { checkAccess } from '../../auth/auth'
  import { devnames } from '../../stores/common.js'

  let tab;
  let dev;
  let ptw;

  function change(e){
    $selected.config = e.detail;
  }

  $: tab = $selected.config;
  $: dev = $selected.device;
  $: ptw = checkAccess('test', 'write');
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
        <TabContent>
          <Grid padding fullWidth noGutter>
            <Row>
              <Column sm={4} md={3} lg={4}>
                <div class="product-card" class:selected={dev == '3271'} on:pointerdown={(e) => { $selected.device = '3271'; push('/configure/fluid/0/3271'); }}>
                  <div class="product-number">3271</div>
                  <div class="product-title">{devnames['3271']}</div>
                  <div class="product-image"><img src="images/3271.webp" alt="3271" /></div>
                </div>
              </Column>
            </Row>
          </Grid>
        </TabContent>
        <TabContent>
          <Grid padding fullWidth noGutter>
            <Row>
              <Column sm={4} md={3} lg={4}>
                <div class="product-card" class:selected={dev == '4291'} on:pointerdown={(e) => { $selected.device = '4291'; push('/configure/fluid/0/4291'); }}>
                  <div class="product-number">4291</div>
                  <div class="product-title">{devnames['4291']}</div>
                  <div class="product-image"><img src="images/4291.webp" alt="4291" /></div>
                </div>
              </Column>
          </Row>
          </Grid>
        </TabContent>
        {#if ptw}
          <TabContent>
            <Grid padding fullWidth noGutter>
              <Row>
                <Column sm={4} md={3} lg={4}>
                </Column>
              </Row>
            </Grid>
          </TabContent>
        {/if}
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
  