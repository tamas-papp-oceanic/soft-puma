<script>
  import { onMount } from "svelte";
  import { Form, Tile, ButtonSet, Button, ImageLoader, InlineLoading } from "carbon-components-svelte";
  import { initRun, currStep, runStep, nextStep } from "../tests/runner.js"

  export let steps;
  export let actions;
  export let style;
  
  let step = initRun(steps, actions);

  onMount(async () => {
    await runStep();
    step = currStep();
  });

  async function next(e) {
    step = await nextStep();
    await runStep();
    step = currStep();
  }

  function fail(e) {
    console.log(e)
  }
</script>

<div class="container" style={style}>
  <Form style="height: 100%; display: flex; flex-flow: column nowrap; justify-content: space-between;">
    <Tile style="height: -webkit-fill-available;">
      <div class="descr"><span>{step ? step.blurb : ''}</span></div>
    </Tile>
    {#if step && step.image}
      <ImageLoader src={step.image}>
        <svelte:fragment slot="loading">
          <InlineLoading />
        </svelte:fragment>
        <svelte:fragment slot="error">An error occurred.</svelte:fragment>
      </ImageLoader>
    {/if}
    <ButtonSet style="justify-content: flex-end;">
      <Button kind="secondary" on:click={(e) => fail(e)}>Fail</Button>
      <Button disabled={!step || !step.next} on:click={(e) => next(e)}>Next</Button>
    </ButtonSet>
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
  </style>
  