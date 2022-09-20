<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile } from "carbon-components-svelte";
  import { checkAccess } from "../../../auth/auth.js";

  export let message;
  export let style;
  export let running;

  const dispatch = createEventDispatcher();
  let access = false;

  function loader(e) {
    dispatch("loader", e);
  };

  function program(e) {
    dispatch("program", e);
  };

  function cancel(e) {
    dispatch("cancel", e);
  };

  // Data getters
  $: access = checkAccess('boot', 'write');
  $: {
    let msg = message;
    let con = document.getElementsByClassName('console');
    if ((con != null) && (con.length > 0)) {
      setTimeout(() => {
        con[0].scrollTop = con[0].scrollHeight;
      }, 100);
    }
  }
</script>

<div class="container" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <div class="title">Connect the device to CAN network and press a button below.</div>
      <div class="buttons">
        {#if access}
          <Button kind="primary" disabled={running} on:click={(e) => loader(e)}>Boot loader</Button>
        {/if}
        <Button kind="primary" disabled={running} on:click={(e) => program(e)}>Program</Button>
      </div>
      <h5>Console</h5>
      <div class="console">
        <Tile style="height: -webkit-fill-available; white-space: pre !important;">{message}</Tile>
      </div>
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
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    height: 100%;
  }
  .container .tilecont .title {
    max-width: 90%;
    white-space: pre-line;
    font-size: 1.25rem;
    text-align: justify;
    margin-bottom: 2rem;
  }
  .container .tilecont .buttons {
    width: 100%;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-around;
    margin-bottom: 1rem;
  }
  .container .tilecont .console {
    width: 100%;
    flex: 1 auto;
    border: 1px solid gray;
    overflow-y: auto;
  }
</style>
