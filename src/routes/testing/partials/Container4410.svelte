<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    Toggle, DataTable} from "carbon-components-svelte";

  export let data;
  export let style;

  const dispatch = createEventDispatcher();
  const greyImage = "/images/circle-grey.webp";
  const redImage = "/images/circle-red.webp";
  const greenImage = "/images/circle-green.webp";
  const yellowImage = "/images/circle-yellow.webp";
  
  let insts = new Array();
  let header1 = new Array();
  let header2 = new Array();
  let rows1 = new Array();
  let rows2 = new Array();

  function select(e) {
    data.banks = new Array();
    for (let i = 0; i < 16; i++) {
      data.banks.push({ status: 3 });
    }
  };

  function cancel(e) {
    dispatch("cancel");
  };

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i.toString(), text: i.toString() });
  }

  for (let i = 0; i < 8; i++) {
    header1.push({ key: i.toString(), value: (i + 1).toString() });
  }

  for (let i = 0; i < 8; i++) {
    header2.push({ key: (i + 8).toString(), value: (i + 9).toString() });
  }

  let row = { id: 'top' };
  for (let i = 0; i < 8; i++) {
    row[i.toString()] = true;
  }
  rows1.push(row);
  
  row = new Array();
  row = { id: 'btm' };
  for (let i = 0; i < 8; i++) {
    row[(i + 8).toString()] = true;
  }
  rows2.push(row);

  select();
</script>

<div class="container" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row>
          <Column></Column>
          <Column sm={2} md={2} lg={2}>
            <Row padding>
              <Column>Device selector</Column>
            </Row>
            <Row>
              <Column>
                <Dropdown titleText="Relay instance" size="lg" bind:selectedId={data.instance} items={insts} on:select={(e) => select(e)}/>
              </Column>
            </Row>
          </Column>
          <Column></Column>
          <Column sm={12} md={12} lg={12}>
            <Tile>Channels</Tile>
            <DataTable useStaticWidth size="tall" headers={header1} rows={rows1} class="relay">
              <svelte:fragment slot="cell" let:row let:cell>
                <img src={data.banks[cell.key].status == 0 ? redImage : data.banks[cell.key].status == 1 ? greenImage : data.banks[cell.key].status == 2 ? yellowImage : greyImage} alt style="width: 2rem;" />
              </svelte:fragment>
            </DataTable>
            <DataTable useStaticWidth size="tall" headers={header2} rows={rows2} class="relay">
              <svelte:fragment slot="cell" let:row let:cell>
                <img src={data.banks[cell.key].status == 0 ? redImage : data.banks[cell.key].status == 1 ? greenImage : data.banks[cell.key].status == 2 ? yellowImage : greyImage} alt style="width: 2rem;" />
              </svelte:fragment>
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