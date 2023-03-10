<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown } from "carbon-components-svelte";
  import { checkAccess } from "../../../auth/auth.js";
  import { getUpdate } from "../../../stores/data.js";
  import { loggedIn } from "../../../stores/user.js";
  import Download from "carbon-icons-svelte/lib/Download16";

  export let model;
  export let data;
  export let message;
  export let style;
  export let running;

  const dispatch = createEventDispatcher();
  let access = false;
  let update = { boot: false, main: false };
  let insts = new Array();

  function select(e) {
  };

  function loader(e) {
    dispatch("loader", e);
  };

  function program(e) {
    dispatch("program", e);
  };

  function cancel(e) {
    dispatch("cancel", e);
  };

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i.toString(), text: i.toString() });
  }

  // Data getters
  $: access = checkAccess('boot', 'write') && $loggedIn;
  $: {
    let upd = getUpdate(model);
    update.boot = (typeof upd['boot'] !== "undefined");
    update.main = (typeof upd['main'] !== "undefined");
  }
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
        <Grid fullWidth noGutter>
          <Row padding>
            <Column sm={1} md={1} lg={1}>
            </Column>
            <Column sm={1} md={1} lg={2}>
              <Dropdown titleText="Device Instance" size="lg" bind:selectedId={data.instance} items={insts} on:select={(e) => select(e)}/>
            </Column>
            <Column sm={1} md={1} lg={2}>
            </Column>
            <Column sm={1} md={3} lg={5}>
              {#if access}
                <Button disabled={running || !update.boot} icon={Download} on:click={(e) => loader(e)}>Boot loader</Button>
              {/if}
            </Column>
            <Column sm={1} md={1} lg={1}>
            </Column>
            <Column sm={1} md={3} lg={5}>
              <Button disabled={running ||  !update.main} icon={Download} on:click={(e) => program(e)}>Program Update</Button>
            </Column>
          </Row>
        </Grid>
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
    /* display: flex;
    flex-flow: row nowrap;
    justify-content: space-around;
    margin-bottom: 1rem; */
  }
  .container .tilecont .console {
    width: 100%;
    flex: 1 auto;
    border: 1px solid gray;
    overflow-y: auto;
  }
</style>
