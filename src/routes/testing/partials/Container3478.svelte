<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    ImageLoader} from "carbon-components-svelte";
  import ButtonOff from "carbon-icons-svelte/lib/RadioButton20";
  import ButtonOn from "carbon-icons-svelte/lib/RadioButtonChecked20";
  import { isAlive } from '../../../stores/data.js';

  export let data;
  export let style;

  const dispatch = createEventDispatcher();
  
  let insts = new Array();
  let banks = new Array();
  let alive = false;

  function select(e) {
    if (alive) {
      dispatch("select");
    } else {
      dispatch("error", { title: 'Device not found' });
    }
  };

  function button(e, idx) {
    banks[idx] = !banks[idx];
  };

  function cancel(e) {
    dispatch("cancel");
  };

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i.toString(), text: i.toString() });
  }

  for (let i = 0; i < 8; i++) {
    banks.push(false);
  }

  // Data getters / setters
  $: alive = isAlive(parseInt(data.source));
</script>

<div class="container" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row>
          <Column sm={1} md={1} lg={1} padding>
          </Column>
          <Column sm={1} md={2} lg={3} padding>
            <Row padding>
              <Column>
                <Dropdown titleText="Relay instance" size="sm" bind:selectedId={data.instance} items={insts}
                  on:select={(e) => select(e)} />
              </Column>
            </Row>
          </Column>
          <Column sm={1} md={1} lg={1} padding>
          </Column>
          <Column sm={1} md={3} lg={6} padding>
            <Row padding>
              <Column>Statuses</Column>
            </Row>
            <Row padding>
              <Grid noGutter>
                <Row padding>
                  {#each banks as _, idx}
                    <Column>
                      {idx}
                    </Column>
                  {/each}
                </Row>
                <Row padding>
                  {#each banks as bank, idx}
                    <Column>
                      <ImageLoader src="/images/circle-red.png" />
                    </Column>
                  {/each}
                </Row>
                <Row padding>
                  {#each banks as bank, idx}
                    <Column>
                      {#if bank}
                        <Button icon={ButtonOn} iconDescripiton="" on:click={(e) => button(e, idx)} />
                      {:else}
                        <Button icon={ButtonOff} on:click={(e) => button(e, idx)} />
                      {/if}
                    </Column>
                  {/each}
                </Row>
              </Grid>
            </Row>
          </Column>
          <Column sm={1} md={1} lg={1} padding>
          </Column>
        </Row>
      </Grid>
    </div>
  </Tile>
  <ButtonSet style="justify-content: flex-end;">
    <Button kind="secondary" on:click={(e) => cancel(e)}>Close</Button>
  </ButtonSet>
</div>

<style>
  .container {
    display: flex;
    flex-flow: column nowrap;
    justify-content: stretch;
    border: 1px solid gray;
    width: 100%;
  }
  .container .tilecont {
    width: 100%;
    height: 100%;
  }
</style>
