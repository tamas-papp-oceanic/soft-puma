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
  
  const timeout = 2000;
  let timer = null;
  let insts = new Array();
  let banks = new Array();
  let header = new Array();
  let rows = new Array();
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-digists-data', (e, args) => {
      const [ dev, msg ] = args;
      if (msg.fields[0].value == data.instance) {
        for (let i = 0; i < 8; i++) {
          banks[i].status = msg.fields[i + 1].value;
          if (banks[i].status == 0) {
            banks[i].command = false;
          } else if (banks[i].status == 1) {
            banks[i].command = true;
          }
        }
      }
    });
  });
  
  onDestroy(() => {
    window.pumaAPI.reml('n2k-digists-data');
  });

  function stop(lis) {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    // Remove listeners
    window.pumaAPI.reml(lis + '-done');
  };

  function select(e) {
    banks = new Array();
    for (let i = 0; i < 8; i++) {
      banks.push({ status: 3, command: false });
    }
  };

  function toggle(e, idx) {
    running = true;
    timer = setTimeout(() => {
      kind = 'error'
      title = 'Error';
      subttl = 'Error writing channel data with this instance.';
      notify = true;
      stop('c3478');
      running = false;
    }, timeout);
    // Receives program result
    window.pumaAPI.recv('c3478-done', (e, res) => {
      if (res) {
        kind = 'info'
        title = 'Success';
        subttl = 'Channel data has been sent.';
        notify = true;
      } else {
        kind = 'error'
        title = 'Error';
        subttl = 'Error writing channel data with this instance.';
        notify = true;
        stop('c3478');
        running = false;
      }
    });
    window.pumaAPI.send('c3478-write', [parseInt(data.instance), parseInt(idx) + 1, banks[idx].command]);
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
              <DataTable useStaticWidth size="tall" headers={header} rows={rows} class="relay">
                <svelte:fragment slot="cell" let:row let:cell>
                  {#if row.id === "a"}
                    <img src={banks[cell.key].status == 0 ? redImage : banks[cell.key].status == 1 ? greenImage : banks[cell.key].status == 2 ? yellowImage : greyImage} alt style="width: 50%;" />
                  {:else}
                    <Toggle labelText={cell.key} hideLabel bind:toggled={banks[cell.key].command} on:toggle={(e) => toggle(e, cell.key)}/>
                  {/if}
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