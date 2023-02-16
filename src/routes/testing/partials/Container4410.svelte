<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    TextInput } from "carbon-components-svelte";
  import Program from "carbon-icons-svelte/lib/Download16";
  import { isAlive } from '../../../stores/data.js';

  export let data;
  export let style;
  export let running;

  const dispatch = createEventDispatcher();
  
  const circs = new Array(
    { id: '1', text: 'Single Phase' },
    { id: '2', text: 'Double Phase' },
    { id: '3', text: 'Three Phase' },
    { id: '4', text: 'Split Phase' },
    );
  const paras = new Array(
    { id: '0', text: 'Circuit Type' },
    { id: '1', text: 'Device Instance' },
  );
    
  let inst1 = new Array();
  let inst2 = new Array();
  let inst = data.instance;
  let circ = data.circuit ? data.circuit : '1';
  let para = '0';
  let alive = false;
    
  function select(e) {
    if (alive) {
      dispatch("select");
    } else {
      dispatch("error", { title: 'Device not found' });
    }
  };

  function program(e) {
    dispatch("program", { parameter: para, instance: inst, circuit: circ });
  };

  function cancel(e) {
    dispatch("cancel");
  };

  function getCircuit(id) {
    for (let i in circs) {
      if (circs[i].id == id) {
        return circs[i].text;
      }
    }
    return null;
  };

  for (let i = 0; i < 253; i++) {
    inst1.push({ id: i.toString(), text: i.toString() })
    inst2.push({ id: i.toString(), text: i.toString() })
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
              <Column>Current configuration</Column>
            </Row>
            <Row padding>
              <Column>
                <Dropdown titleText="AC instance" size="sm" bind:selectedId={data.instance} items={inst1}
                  disabled={running} on:select={(e) => select(e)} />
              </Column>
            </Row>
            <Row padding>
              <Column>
                <TextInput disabled={running || !alive} readonly={!running && alive} labelText="Circuit type" value={getCircuit(data.circuit)} />
              </Column>
            </Row>
          </Column>
          <Column sm={1} md={1} lg={1} padding>
          </Column>
          <Column sm={1} md={2} lg={3} padding>
            <Row padding>
              <Column>Parameters for change</Column>
            </Row>
            <Row padding>
              <Column>
                <Dropdown disabled={running || !alive} titleText="AC instance" size="sm" bind:selectedId={inst} items={inst2} />
              </Column>
            </Row>
            <Row padding>
              <Column>
                <Dropdown disabled={running || !alive} titleText="Circuit type" size="sm" bind:selectedId={circ} items={circs} />
              </Column>
            </Row>
            <Row padding>
              <Column>
                <Dropdown disabled={running || !alive} titleText="Parameter to change" size="sm" bind:selectedId={para} items={paras} />
              </Column>
            </Row>
            <Row padding>
              <Column style="display: flex; flex-flow: row nowrap; justify-content: center;">
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Write to sender" icon={Program}
                  disabled={running || !alive} on:click={(e) => program(e)}>Write to Sensor</Button>
              </Column>
            </Row>
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
