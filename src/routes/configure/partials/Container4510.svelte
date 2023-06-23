<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    DropdownSkeleton } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download16";

  export let data;
  export let style;
  export let running;

  const dispatch = createEventDispatcher();
  
  const tx_pgns = new Array(
    { id: '0', text: 'PGN130312 (deprecated)' },
    { id: '1', text: 'PGN130316' },
    { id: '2', text: 'Both' },
  );
  const temp_srcs = new Array(
    { id: '0', text: 'Sea Temperature' },
    { id: '1', text: 'Outside Temperature' },
    { id: '2', text: 'Inside Temperature' },
    { id: '3', text: 'Engine Room Temperature' },
    { id: '4', text: 'Main Cabin Temperature' },
    { id: '5', text: 'Live Well Temperature' },
    { id: '6', text: 'Bait Well Temperature' },
    { id: '7', text: 'Refrigeration Temperature' },
    { id: '8', text: 'Heating System Temperature' },
    { id: '9', text: 'Dew Point Temperature' },
    { id: '10', text: 'Wind Chill Temperature, Apparent' },
    { id: '11', text: 'Wind Chill Temperature, Theoretical' },
    { id: '12', text: 'Heat Index Temperature' },
    { id: '13', text: 'Freezer Temperature' },
    { id: '14', text: 'Exhaust Gas Temperature' },
  );
  const conf_types = new Array(
    { id: '0', text: 'Auto' },
    { id: '1', text: 'Manual' },
  );
    
  let inst1 = new Array();
  let inst2 = new Array();
  let conf_type = '0';
  let tx_pgn = '0';
  let temp_ins = '0';
  let temp_src = '0';
  let isValid = false;

  function select(e) {
    dispatch("select");
  };

  function program(e) {
    dispatch("program", {
      conf_type: conf_type,
      temp_ins: temp_ins,
      temp_src: temp_src,
      tx_pgn: tx_pgn,
    });
  };

  function cancel(e) {
    dispatch("cancel");
  };

  function configure(e) {
    if (e.selectedId == '0') {
      temp_ins = '0';      
    }
  };

  function setData(val) {
    if (val != null) {
      conf_type = val.conf_type != null ? val.conf_type.toString() : '0';
      temp_ins = val.temp_ins != null ? val.temp_ins.toString() : '0';
      temp_src = val.temp_src != null ? val.temp_src.toString() : '0';
      tx_pgn = val.tx_pgn != null ? val.tx_pgn.toString() : '2';
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
                      <Dropdown disabled={!isValid || conf_type == '0'} titleText="Temperature instance" size="sm" bind:selectedId={temp_ins} items={inst2} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid} titleText="Temperature source" size="sm" bind:selectedId={temp_src} items={temp_srcs} />
                    {/if}
                  </Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid} titleText="Tx PGN type" size="sm" bind:selectedId={tx_pgn} items={tx_pgns} />
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
