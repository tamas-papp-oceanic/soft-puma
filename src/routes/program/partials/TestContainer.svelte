<script>
  import {
    Form,
    Tile,
    Column,
    InlineNotification
  } from "carbon-components-svelte";
  import Runner from '../tests/runner.js'

  export let steps;
  
  let step;

  let runner = new Runner(steps);

  function submit(e) {
    console.log(e)
  }

  $: step = runner.getStep();
</script>

<div class="test-container">
  <Form on:submit={(e) => submit(e)}>
    <Tile>{step ? step.blurb : ''}</Tile>
  </Form>
</div>

<style>
  .test-container {
    border: 1px solid gray;
    width: 100%;
    height: 70vh;
  }
  </style>
  