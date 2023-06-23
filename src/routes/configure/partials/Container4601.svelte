<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    DropdownSkeleton } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download16";

  export let data;
  export let style;
  export let running;

  const dispatch = createEventDispatcher();
  
  const conf_types = new Array(
    { id: '0', text: 'Auto' },
    { id: '1', text: 'Manual' },
  );
  const press_srcs = new Array(
    { id: '0', text: 'Atmospheric Pressure' },
    { id: '1', text: 'Water Pressure' },
    { id: '2', text: 'Steam Pressure' },
    { id: '3', text: 'Compressed Air Pressure' },
    { id: '4', text: 'Hydraulic Pressure' },
    { id: '5', text: 'Filter Pressure' },
    { id: '6', text: 'Altimiter Setting' },
    { id: '7', text: 'Oil Pressure' },
    { id: '8', text: 'Fuel Pressure' },
  );
  const press_rngs = new Array(
    { id: '0', text: '3 PSI' },
    { id: '1', text: '5 PSI' },
    { id: '2', text: '10 PSI' },
    { id: '3', text: '50 PSI' },
    { id: '4', text: '100 PSI' },
    { id: '5', text: '300 PSI' },
    { id: '6', text: '500 PSI' },
    { id: '7', text: '1000 PSI' },
    { id: '8', text: '3000 PSI' },
    { id: '9', text: '5000 PSI' },
    { id: '15', text: '1 BAR' },
  );
  const press_dmps = new Array(
    { id: '0', text: 'Off' },
    { id: '1', text: '0' },
    { id: '2', text: '1' },
    { id: '3', text: '2' },
    { id: '4', text: '3' },
    { id: '5', text: '4' },
    { id: '6', text: '5' },
    { id: '7', text: '6' },
    { id: '8', text: '7' },
    { id: '9', text: '8' },
    { id: '10', text: '9' },
    { id: '11', text: '10' },
    { id: '12', text: '15' },
    { id: '13', text: '20' },
    { id: '14', text: '25' },
  );
    
  let inst1 = new Array();
  let inst2 = new Array();
  let conf_type = '0';
  let press_ins = '0';
  let press_src = '0';
  let press_rng = '0';
  let press_dmp = '0';
  let isValid = false;

  function select(e) {
    dispatch("select");
  };

  function program(e) {
    dispatch("program", {
      conf_type: conf_type,
      press_ins: press_ins,
      press_src: press_src,
      press_rng: press_rng,
      press_dmp: press_dmp,
    });
  };

  function cancel(e) {
    dispatch("cancel");
  };

  function configure(e) {
    if (e.selectedId == '0') {
      press_ins = '0';      
    }
  };

  function setData(val) {
    if (val != null) {
      conf_type = val.conf_type != null ? val.conf_type.toString() : '0';
      press_ins = val.press_ins != null ? val.press_ins.toString() : '0';
      press_src = val.press_src != null ? val.press_src.toString() : '0';
      press_rng = val.press_rng != null ? val.press_rng.toString() : '0';
      press_dmp = val.press_dmp != null ? val.press_dmp.toString() : '0';
      isValid = val.isValid;
    }
  };

  for (let i = 0; i < 253; i++) {
    inst1.push({ id: i.toString(), text: i.toString() });
    inst2.push({ id: i.toString(), text: i.toString() });
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
                <Dropdown titleText="Device instance" size="sm" bind:selectedId={data.instance} items={inst1}
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
            <Row>
              <Column sm={1} md={2} lg={4}>
                <Row padding>
                  <Column>Parameters for change</Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid} titleText="Instance configuration" size="sm" bind:selectedId={conf_type} items={conf_types} on:select={(e) => configure(e)}/>
                    {/if}
                  </Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid || conf_type == '0'} titleText="Pressure instance" size="sm" bind:selectedId={press_ins} items={inst2} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid} titleText="Pressure source" size="sm" bind:selectedId={press_src} items={press_srcs} />
                    {/if}
                  </Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled titleText="Pressure range" size="sm" bind:selectedId={press_rng} items={press_rngs} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid} titleText="Pressure Damping" size="sm" bind:selectedId={press_dmp} items={press_dmps} />
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
