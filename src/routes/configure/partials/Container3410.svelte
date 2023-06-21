<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    DropdownSkeleton, NumberInput, NumberInputSkeleton} from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download16";

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
    
  let insts = new Array();
  let dc_type = '0';
  let batt_type = '0';
  let equ_support = '0';
  let nom_voltage = '0';
  let chemistry = '0';
  let capacity = null;
  let temp_eff = null;
  let peukert = null;
  let chrg_eff = null;
  let isValid = false;

  function select(e) {
    dispatch("select");
  };

  function program(e) {
    dispatch("program", {
      dc_type: dc_type,
      batt_type: batt_type,
      equ_support: equ_support,
      nom_voltage: nom_voltage,
      chemistry: chemistry,
      capacity: capacity,
      temp_eff: temp_eff,
      peukert: peukert,
      chrg_eff: chrg_eff,
    });
  };

  function cancel(e) {
    dispatch("cancel");
  };

  function setData(val) {
    if (val != null) {
      dc_type = val.dc_type != null ? val.dc_type.toString() : '0';
      batt_type = val.batt_type != null ? val.batt_type.toString() : '0';
      equ_support = val.equ_support != null ? val.equ_support.toString() : '0';
      nom_voltage = val.nom_voltage != null ? val.nom_voltage.toString() : '0';
      chemistry = val.chemistry != null ? val.chemistry.toString() : '0';
      capacity = val.capacity != null ? val.capacity : 0;
      temp_eff = val.temp_eff;
      peukert = val.peukert != null ? val.peukert : 1.00;
      chrg_eff = val.chrg_eff != null ? val.chrg_eff : 1;
      isValid = val.isValid;
    }
  };

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i.toString(), text: i.toString() });
  }

  // Data getters / setters
  $: data, setData(data);
</script>

<div class="container" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row>
          <Column></Column>
          <Column>
            <Row padding>
              <Column>Device selector</Column>
            </Row>
            <Row>
              <Column>
                <Dropdown titleText="DC instance" size="sm" bind:selectedId={data.instance} items={insts}
                  disabled={running} on:select={(e) => select(e)} />
              </Column>
            </Row>
            <Row padding><Column>&nbsp;</Column></Row>
            <Row padding>
              <Column style="display: flex; flex-flow: row nowrap; justify-content: flex-start;">
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Write to sender" icon={Download}
                  disabled={running || !isValid} on:click={(e) => program(e)}>Write to Sensor</Button>
              </Column>
            </Row>
          </Column>
          <Column></Column>
          <Column sm={12} md={12} lg={12}>
            <Row padding>
              <Column sm={1} md={2} lg={4}>Parameters for change</Column>
            </Row>
            <Row>
              <Column sm={1} md={2} lg={4}>
                <Row>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={running || !isValid} titleText="DC type" size="sm" bind:selectedId={dc_type} items={dc_types} />
                    {/if}
                  </Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={running || !isValid} titleText="Battery type" size="sm" bind:selectedId={batt_type} items={batt_types} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={running || !isValid} titleText="Supports equalization" size="sm" bind:selectedId={equ_support} items={equ_supports} />
                    {/if}
                  </Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={running || !isValid} titleText="Nominal voltage" size="sm" bind:selectedId={nom_voltage} items={nom_voltages} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={running || !isValid} titleText="Battery chemistry" size="sm" bind:selectedId={chemistry} items={chemistries} />
                    {/if}
                  </Column>
                </Row>
              </Column>
              <Column sm={1} md={3} lg={5}>
                <Row>
                  <Column>
                    {#if running}
                      <NumberInputSkeleton />
                    {:else}
                      <NumberInput
                        disabled={running || !isValid}
                        min={0} step={1}
                        label="Battery capacity (Ah)"
                        bind:value={capacity} />
                    {/if}
                  </Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <NumberInputSkeleton />
                    {:else}
                      <NumberInput
                        disabled={running || !isValid}
                        allowEmpty
                        min={0} max={100} step={1}
                        label="Temperature coefficient (%)"
                        bind:value={temp_eff} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <NumberInputSkeleton />
                    {:else}
                      <NumberInput
                        disabled={running || !isValid}
                        min={1.00} max={1.50} step={0.01}
                        label="Peukert Exponent"
                        invalidText="Number must be between 1.00 and 1.50."
                        bind:value={peukert} />
                    {/if}
                  </Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <NumberInputSkeleton />
                    {:else}
                      <NumberInput
                        disabled={running || !isValid}
                        min={1} max={100} step={1}
                        label="Charging efficiency (%)"
                        bind:value={chrg_eff} />
                    {/if}
                  </Column>
                </Row>
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
