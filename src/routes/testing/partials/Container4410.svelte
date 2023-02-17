<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    Toggle, DataTable} from "carbon-components-svelte";

  export let data;
  export let style;

  const dispatch = createEventDispatcher();
  const greyImage = "/images/circle-grey.png";
  const redImage = "/images/circle-red.png";
  const greenImage = "/images/circle-green.png";
  const yellowImage = "/images/circle-yellow.png";
  
  let insts = new Array();
  let banks = new Array();
  let header1 = new Array();
  let header2 = new Array();
  let rows1 = new Array();
  let rows2 = new Array();

  onMount(() => {
    window.pumaAPI.recv('n2k-digists-data', (e, args) => {
      const [ dev, msg ] = args;
      if (msg.fields[0].value == data.instance) {
        for (let i = 0; i < 16; i++) {
          banks[i].status = msg.fields[i + 1].value;
        }
      }
    });
  });
  
  onDestroy(() => {
    window.pumaAPI.reml('n2k-digists-data');
  });

  function select(e) {
    banks = new Array();
    for (let i = 0; i < 16; i++) {
      banks.push({ status: 3 });
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
          <Column sm={1} md={1} lg={1} padding>
          </Column>
          <Column sm={1} md={1} lg={2} padding>
            <Row padding>
              <Column>
                <Dropdown titleText="Relay instance" size="lg" bind:selectedId={data.instance} items={insts} on:select={(e) => select(e)}/>
              </Column>
            </Row>
          </Column>
          <Column sm={1} md={1} lg={1} padding>
          </Column>
          <Column sm={1} md={4} lg={7} padding>
            <Row>
              <Column><Tile>Channels</Tile></Column>
            </Row>
            <Row padding>
              <DataTable size="tall" headers={header1} rows={rows1} class="relay">
                <svelte:fragment slot="cell" let:row let:cell>
                  <img src={banks[cell.key].status == 0 ? redImage : banks[cell.key].status == 1 ? greenImage : banks[cell.key].status == 2 ? yellowImage : greyImage} alt style="width: 100%;" />
                </svelte:fragment>
              </DataTable>
            </Row>
            <Row padding>
              <DataTable size="tall" headers={header2} rows={rows2} class="relay">
                <svelte:fragment slot="cell" let:row let:cell>
                  <img src={banks[cell.key].status == 0 ? redImage : banks[cell.key].status == 1 ? greenImage : banks[cell.key].status == 2 ? yellowImage : greyImage} alt style="width: 100%;" />
                </svelte:fragment>
              </DataTable>
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