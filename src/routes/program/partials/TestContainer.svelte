<script>
  import { Form, Tile, ButtonSet, Button } from "carbon-components-svelte";
  import Runner from '../tests/runner.js'

  export let steps;
  export let actions;
  export let style;
  
  let step;

  let runner = new Runner(steps, actions);

  async function next(e) {
    await runner.runStep(step);
  }

  function fail(e) {
    console.log(e)
  }

$: step = runner.currStep();
</script>

<div class="container" style={style}>
  <Form style="height: 100%; display: flex; flex-flow: column nowrap; justify-content: space-between;">
    <Tile style="height: -webkit-fill-available;">
      <div class="descr"><span>{step ? step.blurb : ''}</span></div>
    </Tile>
    <ButtonSet style="justify-content: flex-end;">
      <Button kind="secondary" on:click={(e) => fail(e)}>Fail</Button>
      <Button on:click={(e) => next(e)}>Next</Button>
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
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
  .descr span {
    max-width: 80%;
    white-space: normal;
    font-size: 1.25rem;
    text-align: justify;
  }
  </style>
  