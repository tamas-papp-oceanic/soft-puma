<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    NumberInput } from "carbon-components-svelte";
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
  const enables = new Array(
    { id: '0', text: 'No' },
    { id: '1', text: 'Yes' },
  );
    
  let inst1 = new Array();
  let inst2 = new Array();
  let tx_pgn = '0';
  let temp_ins = '0';
  let temp_src = '0';
  let conf_type = '0';
  let enabled = '0';
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

  function setData(val) {
    if (val != null) {
      conf_type = val.conf_type;
      temp_ins = val.temp_ins;
      temp_src = val.temp_src;
      tx_pgn = val.tx_pgn;
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
          <Column sm={1} md={1} lg={1}>
          </Column>
          <Column sm={1} md={2} lg={2}>
            <Row padding>
              <Column>Device selector</Column>
            </Row>
            <Row>
              <Column>
                <Dropdown titleText="Device instance" size="sm" bind:selectedId={data.instance} items={inst1}
                  disabled={running} on:select={(e) => select(e)} />
              </Column>
            </Row>
          </Column>
          <Column sm={1} md={1} lg={1}>
          </Column>
          <Column>
            <Row padding>
              <Column>Parameters for change</Column>
            </Row>
            <Row>
              <Column sm={1} md={2} lg={3}>
                <Dropdown disabled={running || !isValid} titleText="Configuration type" size="sm" bind:selectedId={conf_type} items={conf_types} />
              </Column>
            </Row>
            <Row>
              {#each [0, 1, 2, 3] as idx}
                <Column sm={1} md={2} lg={3} padding>
                  <Row padding>
                    <Column>Channel {idx + 1}</Column>
                  </Row>
                  <Row>
                    <Column>
                      <Dropdown disabled={running || !isValid} titleText="Enabled" size="sm" bind:selectedId={enabled} items={enables} />
                    </Column>
                  </Row>
                  <Row>
                    <Column>
                      <Dropdown disabled={running || !isValid} titleText="Temperature instance" size="sm" bind:selectedId={temp_ins} items={inst2} />
                    </Column>
                  </Row>
                  <Row>
                    <Column>
                      <Dropdown disabled={running || !isValid} titleText="Temperature source" size="sm" bind:selectedId={temp_src} items={temp_srcs} />
                    </Column>
                  </Row>
                  <Row>
                    <Column>
                      <Dropdown disabled={running || !isValid} titleText="Tx PGN type" size="sm" bind:selectedId={tx_pgn} items={tx_pgns} />
                    </Column>
                  </Row>
                </Column>
                {#if idx < 3}
                  <Column sm={1} md={1} lg={1} padding>
                  </Column>
                {/if}
              {/each}
            </Row>
            <Row padding>
              <Column style="display: flex; flex-flow: row nowrap; justify-content: flex-start;">
                <Button tooltipPosition="top" tooltipAlignment="center" iconDescription="Write to sender" icon={Download}
                  disabled={running || !isValid} on:click={(e) => program(e)}>Write to Sensor</Button>
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
