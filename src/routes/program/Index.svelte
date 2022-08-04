<script>
  import { Row, Grid, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { push } from 'svelte-spa-router'
  import { selected } from '../../stores/data.js'

  let tab;
  let dev;

  function change(e){
    $selected.program = e.detail;
  }

  $: tab = $selected.program;
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
        <TabContent>Not available yet</TabContent>
        <TabContent>Not available yet</TabContent>
        <TabContent>
          <Grid padding fullWidth noGutter>
              <Row>
              <Column sm={4} md={3} lg={4} aspectRatio="1x1">
                <div class="product-card" class:selected={dev == '5185'} on:pointerdown={(e) => { $selected.device = '5185'; push('/program/5185'); }}>
                  <div class="product-number">5185</div>
                  <div class="product-title">Poseidon 7</div>
                  <div class="product-image"><img src="images/P7.webp" alt="P7" /></div>
                </div>
              </Column>
              <Column sm={4} md={3} lg={4} aspectRatio="1x1">
                <div class="product-card" class:selected={dev == '5185-H'} on:pointerdown={(e) => { $selected.device = '5185-H'; push('/program/5185/Honda'); }}>
                  <div class="product-number">5185</div>
                  <div class="product-title">Poseidon 7 (Honda)</div>
                  <div class="product-image"><img src="images/P7.webp" alt="P7" /></div>
                </div>
              </Column>
              <Column sm={4} md={3} lg={4}>
                <div class="product-card">
                  <div class="product-number">5189</div>
                  <div class="product-title">Poseidon 10</div>
                  <div class="product-image"><img src="images/P7.webp" alt="P10" /></div>
                </div>
              </Column>
              <Column sm={3} md={3} lg={4}>
              </Column>
              <Column sm={4} md={3} lg={4}>
              </Column>
            </Row>
          </Grid>
        </TabContent>
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
  