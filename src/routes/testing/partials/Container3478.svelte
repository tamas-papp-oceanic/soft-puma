<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    ImageLoader, Toggle, DataTable} from "carbon-components-svelte";
  import ButtonOff from "carbon-icons-svelte/lib/RadioButton20";
  import ButtonOn from "carbon-icons-svelte/lib/RadioButtonChecked20";
  import { isAlive } from '../../../stores/data.js';

  export let data;
  export let style;

  const dispatch = createEventDispatcher();
  
  let insts = new Array();
  let banks = new Array();
  let alive = false;
  let header = new Array();
  let rows = new Array();


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
    header.push({ key: i.toString(), value: (i + 1).toString() });
  }

  for (let j of ['a', 'b']) {
    let row = { id: j };
    for (let i = 0; i < 8; i++) {
      row[i.toString()] = i.toString();
    }
    rows.push(row);
  }

  console.log(rows)

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
          <Column sm={1} md={4} lg={6} padding>
            <Row padding>
              <Column>Channels</Column>
            </Row>
            <Row padding>
              <DataTable useStaticWidth size="tall" headers={header} rows={rows}>
                <svelte:fragment slot="cell" let:row let:cell>
                  {#if row.id === "a"}
                    <ImageLoader src="/images/circle-red.png" style="width: 50%;" />
                  {:else}
                    <Toggle labelText={cell.key} hideLabel />
                    <!-- <Button icon={banks[cell.key] ? ButtonOn : ButtonOff} on:click={(e) => button(e, cell.key)}></Button> -->
                  {/if}
                </svelte:fragment>
              </DataTable>
              <!-- <Grid noGutter>
                <Row padding>
                  {#each banks as bank, idx}
                    <Column>
                      {idx}
                      <ImageLoader src="/images/circle-red.png" style="width: 60%; padding: 10%;"/>
                      <Button icon={bank ? ButtonOn : ButtonOff} on:click={(e) => button(e, idx)}>{bank ? 'OFF' : 'ON'}</Button>
                    </Column>
                    {/each} -->
                  <!-- {#each banks as _, idx}
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
                      <Button icon={bank ? ButtonOn : ButtonOff} on:click={(e) => button(e, idx)}>{bank ? 'OFF' : 'ON'}</Button>
                    </Column>
                  {/each} -->
                <!-- </Row>
              </Grid> -->
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

<style global>
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
  /* .bx--col {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
  }
  .bx--col img {
    width: 80%;
  } */
  .bx--data-table--static th {
    text-align: center;
    vertical-align: middle;
  }
  .bx--data-table--static tr, .bx--data-table--static th {
    border: none;
  }
  .bx--data-table--static td {
    text-align: center;
    vertical-align: middle;
    padding: 0 1.2rem;
    border: none;
  }
</style>