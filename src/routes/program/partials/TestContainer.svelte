<script>
  import { onMount } from "svelte";
  import { Form, Tile, ButtonSet, Button, ImageLoader, InlineLoading } from "carbon-components-svelte";
  import { initRun, runStep, nextStep } from "../tests/runner.js"
  import { _steps, _current } from '../../../stores/tests.js';

  export let steps;
  export let actions;
  export let style;
  
  let step;
  // let result;

  onMount(async () => {
    initRun(steps, actions);
    await runStep();
  });

  async function pass(e) {
    await nextStep();
    await runStep();
  }

  function fail(e) {
    console.log(e)
  }

  $: step = $_steps[$_current];
  $: console.log(step)

</script>

<div class="container" style={style}>
  <Form style="height: 100%; display: flex; flex-flow: column nowrap; justify-content: space-between;">
    <Tile style="height: -webkit-fill-available;">
      <div class="descr"><span>{step ? step.blurb : ''}</span></div>
    </Tile>
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
    {#if step && step.scanner}
      <div class="imgHolder">
        <!-- <Scanner bind:result></Scanner> -->
      </div>
    {/if}
    {#if step && step.buttons}
      <ButtonSet style="justify-content: flex-end;">
        {#if step.buttons.length > 1}
          <Button kind="secondary" on:click={(e) => fail(e)}>{step.buttons[0]}</Button>
        {/if}
        <Button disabled={!step || !step.next} on:click={(e) => pass(e)}>{step.buttons.length > 1 ? step.buttons[1] : step.buttons[0]}</Button>
      </ButtonSet>
    {/if}
  </Form>
</div>

<style>
  .container {
    border: 1px solid gray;
    width: 100%;
  }
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
  }
  .imgHolder {
    max-height: 100%;
  }
  </style>
  