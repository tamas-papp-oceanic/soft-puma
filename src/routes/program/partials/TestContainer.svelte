<script>
  import { ButtonSet, Button } from "carbon-components-svelte";

  export let step;
  export let pass;
  export let fail;
  export let style;
</script>

<div class="container" step={step} pass={pass} fail={fail} style={style}>
  <slot></slot>
  {#if step && step.buttons}
    <ButtonSet style="justify-content: flex-end;">
      {#if step.buttons.length > 1}
      <Button kind="secondary" on:click={(e) => fail(e)}>{step.buttons[1]}</Button>
      {/if}
      <Button kind="primary" disabled={!step || !step.next} on:click={(e) => pass(e)}>{step.buttons[0]}</Button>
    </ButtonSet>
  {/if}
</div>

<style>
  .container {
    display: flex;
    flex-flow: column nowrap;
    justify-content: stretch;
    border: 1px solid gray;
    width: 100%;
  }
  </style>
  