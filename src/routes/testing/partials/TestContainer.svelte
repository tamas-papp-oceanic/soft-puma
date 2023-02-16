<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, TextInput, ImageLoader,
    InlineLoading, InlineNotification } from "carbon-components-svelte";

  export let step;
  export let style;

  const dispatch = createEventDispatcher();

  function submit(e) {
    dispatch("submit", e);
  };

  function cancel(e) {
    dispatch("cancel", e);
  };
</script>

<div class="container" step={step} style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <div class="title">{step ? step.blurb : ''}</div>
      {#if step && (typeof step.result !== "undefined")}
        <div class="result">
          <Tile style={'color: ' + (step.result ? 'lightgreen' : 'red') + ';'}>{step.result ? 'SUCCESS' : 'FAIL'}</Tile>
        </div>
      {:else}
        {#if step && step.inputs}
          <div class="inputs">
            {#each step.inputs as input}
              {#if input.type == 'TextInput'}
                <TextInput id={input.id} inline labelText={input.label} placeholder={input.placeholder} />
              {/if}
              {#if input.error && input.error.active}
                <InlineNotification
                  hideCloseButton
                  title={input.error.title}
                  subtitle={input.error.subtitle}
                />
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
      {/if}
    </div>
  </Tile>
  {#if step && step.buttons}
    <ButtonSet style="justify-content: flex-end;">
      {#if step.buttons.length > 1}
        <Button kind="secondary" on:click={(e) => cancel(e)}>{step.buttons[1]}</Button>
      {/if}
      <Button kind="primary" disabled={!step || !step.next} on:click={(e) => submit(e)}>{step.buttons[0]}</Button>
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
  .container .tilecont {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    height: 100%;
  }
  .container .tilecont .result {
    width: 100%;
    font-size: 300%;
    text-align: center;
  }
  .container .tilecont .title {
    max-width: 90%;
    white-space: pre-line;
    font-size: 1.25rem;
    text-align: justify;
    margin-bottom: 2rem;
  }
  .container .tilecont .inputs {
    margin-bottom: 2rem;
  }
  .container .tilecont .image {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    justify-items: center;
    align-self: center;
    max-height: -webkit-fill-available;
  }
</style>
