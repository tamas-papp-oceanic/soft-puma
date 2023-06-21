<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    DropdownSkeleton, TextInput } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download16";
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
    
  let inst1 = new Array();
  let inst2 = new Array();
  let inst = data.instance;
  let circ = '1';
  let isValid = false;
    
  function select(e) {
    dispatch("select");
  };

  function program(e) {
    dispatch("program", { instance: inst, circuit: circ });
  };

  function cancel(e) {
    dispatch("cancel");
  };

  function setData(val) {
    if (val != null) {
      circ = val.circuit != null ? val.circuit.toString() : '1';
      isValid = val.isValid;
    }
  };

  for (let i = 0; i < 253; i++) {
    inst1.push({ id: i.toString(), text: i.toString() })
    inst2.push({ id: i.toString(), text: i.toString() })
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
              <Column>Current configuration</Column>
            </Row>
            <Row>
              <Column>
                <Dropdown titleText="AC instance" size="sm" bind:selectedId={data.instance} items={inst1}
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
                      <Dropdown disabled={!isValid} titleText="AC instance" size="sm" bind:selectedId={inst} items={inst2} />
                    {/if}
                  </Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid} titleText="Circuit type" size="sm" bind:selectedId={circ} items={circs} />
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
