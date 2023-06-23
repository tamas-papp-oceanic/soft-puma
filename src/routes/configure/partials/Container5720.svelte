<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown,
    DropdownSkeleton, NumberInput, NumberInputSkeleton } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download16";

  export let data;
  export let style;
  export let running;

  const dispatch = createEventDispatcher();
  
  const op_modes = new Array(
    { id: '0', text: 'Single Sensor Differential' },
    { id: '1', text: 'Dual Sensor Differential' },
    { id: '2', text: 'Two Sensor Separate' },
  );
    
  let insts = new Array();
  let mod_ins = '0';
  let eng_flo_ins = '0';
  let eng_ret_ins = '0';
  let temp_flo_ins = '0';
  let temp_ret_ins = '0';
  let op_mode = '0';
  let kfact_flo = null;
  let kfact_ret = null;
  let total_flo = null;
  let total_ret = null;
  let isValid = false;

  function select(e) {
    dispatch("select");
  };

  function program(e) {
    dispatch("program", {
      mod_ins: mod_ins,
      eng_flo_ins: eng_flo_ins,
      eng_ret_ins: eng_ret_ins,
      temp_flo_ins: temp_flo_ins,
      temp_ret_ins: temp_ret_ins,
      op_mode: op_mode,
      kfact_flo: kfact_flo,
      kfact_ret: kfact_ret,
      total_flo: total_flo,
      total_ret: total_ret,
    });
  };

  function cancel(e) {
    dispatch("cancel");
  };

  function setData(val) {
    if (val != null) {
      mod_ins = val.mod_ins != null ? val.mod_ins.toString() : '0';
      eng_flo_ins = val.eng_flo_ins != null ? val.eng_flo_ins.toString() : '0';
      eng_ret_ins = val.eng_ret_ins != null ? val.eng_ret_ins.toString() : '0';
      temp_flo_ins = val.temp_flo_ins != null ? val.temp_flo_ins.toString() : '0';
      temp_ret_ins = val.temp_ret_ins != null ? val.temp_ret_ins.toString() : '0';
      op_mode = val.op_mode != null ? val.op_mode.toString() : '0';
      kfact_flo = val.kfact_flo != null ? val.kfact_flo : null;
      kfact_ret = val.kfact_ret != null ? val.kfact_ret : null;
      total_flo = val.total_flo != null ? val.total_flo : null;
      total_ret = val.total_ret != null ? val.total_ret : null;
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
                <Dropdown titleText="Device instance" size="sm" bind:selectedId={data.instance} items={insts}
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
                      <Dropdown disabled={!isValid} titleText="Module instance" size="sm" bind:selectedId={mod_ins} items={insts}/>
                    {/if}
                  </Column>
                </Row>
              </Column>
              <Column sm={1} md={2} lg={4}>
                <Row padding><Column>&nbsp;</Column></Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid} titleText="Operating mode" size="sm" bind:selectedId={op_mode} items={op_modes} />
                    {/if}
                  </Column>
                </Row>
              </Column>
            </Row>
            <Row>
              <Column sm={1} md={2} lg={4}>
                <Row padding>
                  <Column>Flow</Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid} titleText="Engine instance" size="sm" bind:selectedId={eng_flo_ins} items={insts} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid} titleText="Temperature instance" size="sm" bind:selectedId={temp_flo_ins} items={insts} />
                    {/if}
                  </Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <NumberInputSkeleton />
                    {:else}
                      <NumberInput
                        disabled={!isValid}
                        min={0.00} step={0.01}
                        label="K-factor (L)"
                        bind:value={kfact_flo} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <NumberInputSkeleton />
                    {:else}
                      <NumberInput
                        disabled={!isValid}
                        min={0.00} step={0.01}
                        label="Total volume (L)"
                        bind:value={total_flo} />
                    {/if}
                  </Column>
                </Row>
              </Column>
              <Column sm={1} md={2} lg={4}>
                <Row padding>
                  <Column>Return</Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid} titleText="Engine instance" size="sm" bind:selectedId={eng_ret_ins} items={insts} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <DropdownSkeleton />
                    {:else}
                      <Dropdown disabled={!isValid} titleText="Temperature instance" size="sm" bind:selectedId={temp_ret_ins} items={insts} />
                    {/if}
                  </Column>
                </Row>
                <Row padding>
                  <Column>
                    {#if running}
                      <NumberInputSkeleton />
                    {:else}
                      <NumberInput
                        disabled={!isValid}
                        min={0.00} step={0.01}
                        label="K-factor (L)"
                        bind:value={kfact_ret} />
                    {/if}
                  </Column>
                </Row>
                <Row>
                  <Column>
                    {#if running}
                      <NumberInputSkeleton />
                    {:else}
                      <NumberInput
                        disabled={!isValid}
                        min={0.00} step={0.01}
                        label="Total volume (L)"
                        bind:value={total_ret} />
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
