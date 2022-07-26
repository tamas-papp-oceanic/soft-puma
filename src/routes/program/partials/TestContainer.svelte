<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, TextInput, ImageLoader, InlineLoading } from "carbon-components-svelte";

  export let step;
  export let style;

  const dispatch = createEventDispatcher();

  function pass(e) {
    dispatch("pass", e);
  };

  function fail(e) {
    dispatch("fail", e);
  };
</script>

<div class="container" step={step} style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="descr">
      <div class="title">{step ? step.blurb : ''}</div>
      {#if step && step.inputs}
        <div class="inputs">
          {#each step.inputs as input}
            {#if input.type == 'TextInput'}
              <TextInput inline labelText={input.label} placeholder={input.placeholder} on:input={input.handler} />
            {/if}
          {/each}
        </div>                
      {/if}
      {#if step && step.image}
        <div class="image">
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
  .descr {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    height: 100%;
  }
  .descr .title {
    max-width: 90%;
    white-space: normal;
    font-size: 1.25rem;
    text-align: justify;
    margin-bottom: 2rem;
  }
  .descr .inputs {
    margin-bottom: 2rem;
  }
  .descr .image {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    justify-items: center;
    align-self: center;
    max-height: -webkit-fill-available;
  }
</style>
  