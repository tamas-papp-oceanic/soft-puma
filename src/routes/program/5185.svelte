<script>
  import { onMount } from "svelte";
  import { Row, Grid, Column, InlineNotification, Form, Tile,
    TextInput, ImageLoader, InlineLoading } from "carbon-components-svelte";
  import TestContainer from './partials/TestContainer.svelte';
  import test from './tests/5185.json';
  import { start, scanDevice, waitDevice, selectSerial,
    startTests, startTest, waitTest, stopTests, startUpdate,
    waitUpdate, logResult } from './tests/5185.js';
  import { initRun, runStep, nextStep, enableNext, setStoreValue } from "./tests/runner.js"
  import { _steps, _current } from '../../stores/tests.js';

  let actions = {
    "start": start,
    "scan-device": scanDevice,
    "wait-device": waitDevice,
    "select-serial": selectSerial,
    "start-tests": startTests,
    "start-test": startTest,
    "wait-test": waitTest,
    "stop-tests": stopTests,
    "start-update": startUpdate,
    "wait-update": waitUpdate,
    "log-result": logResult,
  };

  let events = {
    "ser-input": serInput,
  };

  let step;
  // On mount event  
  onMount(async () => {
    initRun(test.steps, actions, events);
    await runStep();
  });
  // Pass button event
  async function pass(e) {
    await nextStep();
    await runStep();
  };
  // Fail button event
  function fail(e) {
    console.log(e)
  };
  // Serial number input event
  async function serInput(e) {
    await setStoreValue({ variable: 'serial', value: e.detail });
    enableNext(e.detail.length > 5);
  };
  // Data getters
  $: step = $_steps[$_current];
</script>

<Grid>
  <Row>
    <Column>
      <h2>5185 Poseidon 7 - Test Suite</h2>
      <InlineNotification
        hideCloseButton
        kind="info"
        title="Programming of this device is performed outside of Puma."
        subtitle="Please refer to the SOP."
      />
      <TestContainer step={step} pass={pass} fail={fail} style="height: 65vh;">
        <Tile style="height: -webkit-fill-available;">
          <div class="descr">
            <span>{step ? step.blurb : ''}</span>
            {#if step && step.inputs}
              {#each step.inputs as input}
                {#if input.type == 'TextInput'}
                  <TextInput inline labelText={input.label} placeholder={input.placeholder} on:input={input.onInput} />
                {/if}
              {/each}
            {/if}
            {#if step && step.image}
              <div class="imgHolder">
                <ImageLoader src={step.image}>
                  <svelte:fragment slot="loading">
                    <InlineLoading />
                  </svelte:fragment>
                  <svelte:fragment slot="error">An error occurred.</svelte:fragment>
                </ImageLoader>
              </div>
            {/if}
          </div>
        </Tile>
      </TestContainer>
    </Column>
  </Row>
</Grid>

<style lang="css">
  .descr {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    height: 100%;
  }
  .descr span {
    max-width: 90%;
    white-space: normal;
    font-size: 1.25rem;
    text-align: justify;
    margin-bottom: 2rem;
  }
  .imgHolder {
    max-height: 100%;
  }
</style>