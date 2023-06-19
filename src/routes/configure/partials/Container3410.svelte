<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    TextInput } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download16";
  import { isAlive } from '../../../stores/data.js';

  export let data;
  export let style;
  export let running;

  const dispatch = createEventDispatcher();
  
  const dc_types = new Array(
    { id: '0', text: 'Battery' },
    { id: '1', text: 'Alternator' },
    { id: '2', text: 'Convertor' },
    { id: '3', text: 'Solar Cell' },
    { id: '4', text: 'Wind Generator' },
  );
  const batt_types = new Array(
    { id: '0', text: 'Flooded' },
    { id: '1', text: 'GEL' },
    { id: '2', text: 'AGM' },
  );
  const equ_supports = new Array(
    { id: '0', text: 'No' },
    { id: '1', text: 'Yes' },
  );
  const nom_voltages = new Array(
    { id: '0', text: '6 Volts' },
    { id: '1', text: '12 Volts' },
    { id: '2', text: '24 Volts' },
    { id: '3', text: '32 Volts' },
    { id: '4', text: '36 Volts' },
    { id: '5', text: '42 Volts' },
    { id: '6', text: '48 Volts' },
  );
  const chemistries = new Array(
    { id: '0', text: 'Lead Acid' },
    { id: '1', text: 'LiIon' },
    { id: '2', text: 'NiCad' },
    { id: '3', text: 'ZnO' },
    { id: '4', text: 'NiMH' },
  );
    
  let inst = data.instance;
  let insts = new Array();
  let dc_type = '0';
  let batt_type = '0';
  let equ_support = '0';
  let nom_voltage = '0';
  let chemistry = '0';
  let capacity = null;
  let temp_coeff = null;
  let peukert = null;
  let chg_eff = null;
  let alive = false;

  function select(e) {
    if (alive) {
      dispatch("select");
    } else {
      dispatch("error", { title: 'Device not found' });
    }
  };

  function program(e) {
    dispatch("program", {
      dc_type: dc_type,
      batt_type: batt_type,
      equ_support: equ_support,
      nom_voltage: nom_voltage,
      chemistry: chemistry,
      capacity: capacity,
      temp_coeff: temp_coeff,
      peukert: peukert,
      chg_eff: chg_eff,
    });
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

  function setCircuit(val) {
    if (val != null) {
      circ = val;
    }
  };

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i.toString(), text: i.toString() });
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
                <Dropdown titleText="DC instance" size="sm" bind:selectedId={data.instance} items={insts}
                  disabled={running} on:select={(e) => select(e)} />
              </Column>
            </Row>
            <!-- <Row padding>
              <Column>
                <TextInput disabled={running || !alive} readonly={!running && alive} labelText="Circuit type" value={getCircuit(data.circuit)} />
              </Column>
            </Row> -->
          </Column>
          <Column sm={1} md={1} lg={1} padding>
          </Column>
          <Column sm={1} md={2} lg={3} padding>
            <Row padding>
              <Column>Parameters for change</Column>
            </Row>
            <Row padding>
              <Column>
                <Dropdown disabled={running || !alive} titleText="DC type" size="sm" bind:selectedId={dc_type} items={dc_types} />
              </Column>
            </Row>
            <Row padding>
              <Column>
                <Dropdown disabled={running || !alive} titleText="Battery type" size="sm" bind:selectedId={batt_type} items={batt_types} />
              </Column>
            </Row>
            <Row padding>
              <Column>
                <Dropdown disabled={running || !alive} titleText="Supports equalization" size="sm" bind:selectedId={equ_support} items={equ_supports} />
              </Column>
            </Row>
            <Row padding>
              <Column>
                <Dropdown disabled={running || !alive} titleText="Nominal voltage" size="sm" bind:selectedId={nom_voltage} items={nom_voltages} />
              </Column>
            </Row>
            <Row padding>
              <Column>
                <Dropdown disabled={running || !alive} titleText="Battery chemistry" size="sm" bind:selectedId={chemistry} items={chemistries} />
              </Column>
            </Row>
          </Column>
          <Column sm={1} md={1} lg={1} padding>
          </Column>
          <Column sm={1} md={2} lg={3} padding>
            <Row padding>
              <Column>
                <TextInput disabled={running || !alive} labelText="Battery capacity" value={capacity} />
              </Column>
            </Row>
            <Row padding>
              <Column>
                <TextInput disabled={running || !alive} labelText="Battery temperature coefficient" value={temp_coeff} />
              </Column>
            </Row>
            <Row padding>
              <Column>
                <TextInput disabled={running || !alive} labelText="Peukert Exponent" value={peukert} />
              </Column>
            </Row>
            <Row padding>
              <Column style="display: flex; flex-flow: row nowrap; justify-content: center;">
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Write to sender" icon={Download}
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
