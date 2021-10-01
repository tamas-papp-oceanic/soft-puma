<script>
  import {
    Row,
    Grid,
    Column,
    Tabs,
    Tab,
    TabContent
  } from "carbon-components-svelte";
  import {push, pop} from 'svelte-spa-router'
</script>
<style>
.product-card {
  padding: 1rem;
  width: 100%;
  height: 100%;
  border: 1px solid gray;
  background-color: #222222;
  cursor: pointer;
}
.product-card:hover {
  border: 1px solid white;
  background-color: #262626;
  cursor: pointer;
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
<Grid>
  <Row>
    <Column>
    <Tabs type="container">
      <Tab label="Sensors" />
      <Tab label="Adaptors" />
      <Tab label="Displays" />
      <div slot="content">
        <TabContent>Not available yet</TabContent>
        <TabContent>Not available yet</TabContent>
        <TabContent>
          <Grid>
            <Row>
              <Column sm={4} md={3} lg={4} aspectRatio="1x1">
                <div class="product-card" on:click={() => push('/program/5185')}>
                  <div class="product-number">5185</div>
                  <div class="product-title">Poseidon 7</div>
                  <div class="product-image"><img src="images/P7.webp" /></div>
                </div>
              </Column>
              <Column sm={4} md={3} lg={4}>
                <div class="product-card">
                  <div class="product-number">5189</div>
                  <div class="product-title">Poseidon 10</div>
                  <div class="product-image"><img src="images/P7.webp" /></div>
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
