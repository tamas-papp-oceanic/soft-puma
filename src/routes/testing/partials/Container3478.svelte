<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    Toggle, DataTable} from "carbon-components-svelte";
  import Auto from "carbon-icons-svelte/lib/Automatic16";

  export let data;
  export let style;

  const dispatch = createEventDispatcher();
  const greyImage = "/images/circle-grey.png";
  const redImage = "/images/circle-red.png";
  const greenImage = "/images/circle-green.png";
  const yellowImage = "/images/circle-yellow.png";
  
  let insts = new Array();
  let header = new Array();
  let rows = new Array();

  function select(e) {
    data.banks = new Array();
    for (let i = 0; i < 8; i++) {
      data.banks.push({ status: 3, command: false });
    }
  };

  function auto(e) {
    dispatch("auto");
  };

  function toggle(e, idx) {
    dispatch("toggle", { cell: idx });
  };

  function cancel(e) {
    dispatch("cancel");
  };

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i.toString(), text: i.toString() });
  }

  for (let i = 0; i < 8; i++) {
    header.push({ key: i.toString(), value: (i + 1).toString() });
  }

  for (let j of ['a', 'b']) {
    let row = { id: j };
    for (let i = 0; i < 8; i++) {
      row[i.toString()] = i.toString();
    }
    rows.push(row);
  }

  select();
</script>

<div class="container" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row padding>
          <Column sm={1} md={1} lg={1}>
          </Column>
          <Column sm={1} md={1} lg={2}>
            <Row padding>
              <Column>
                <Dropdown disabled={data.autorun} titleText="Relay instance" size="lg" bind:selectedId={data.instance} items={insts} on:select={(e) => select(e)}/>
              </Column>
            </Row>
            <Row padding>
              <Column>
                <Button disabled={data.autorun} icon={Auto} on:click={(e) => auto(e)}>Auto test</Button>
              </Column>
            </Row>
          </Column>
          <Column sm={1} md={1} lg={1}>
          </Column>
          <Column sm={1} md={4} lg={8}>
            <Tile>Channels</Tile>
            <DataTable useStaticWidth size="tall" headers={header} rows={rows} class="relay">
              <svelte:fragment slot="cell" let:row let:cell>
                {#if row.id === "a"}
                  <img src={data.banks[cell.key].status == 0 ? redImage : data.banks[cell.key].status == 1 ? greenImage : data.banks[cell.key].status == 2 ? yellowImage : greyImage} alt style="width: 2rem;" />
                {:else if row.id === "b"}
                  <Toggle disabled={data.autorun} labelText={cell.key} hideLabel bind:toggled={data.banks[cell.key].command} on:toggle={(e) => toggle(e, cell.key)}/>
                {/if}
              </svelte:fragment>
              <Row>
                <Column>
                </Column>
              </Row>
            </DataTable>
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
  .relay th {
    text-align: center;
    vertical-align: middle;
    background: #262626;
  }
  .relay tr, .relay th {
    border: none;
  }
  .relay thead, .relay tbody {
    background: none;
  }
  .relay tbody tr:hover td {
    background: #262626;
    border: none;
  }
  .relay td {
    text-align: center;
    vertical-align: middle;
    padding: 0 1.2rem;
    border: none;
  }
</style>