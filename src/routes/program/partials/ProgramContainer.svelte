<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown } from "carbon-components-svelte";
  import { checkAccess } from "../../../auth/auth.js";
  import { getUpdate } from "../../../stores/data.js";
  import { loggedIn } from "../../../stores/user.js";
  import Upload from "carbon-icons-svelte/lib/Upload16";

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

  function setUpdate(mod) {
    let upd = getUpdate(mod);
    update.boot = (typeof upd['boot'] !== "undefined");
    update.main = (typeof upd['main'] !== "undefined");
  };
  
  function scroll() {
    let con = document.getElementsByClassName('console');
    if ((con != null) && (con.length > 0)) {
      setTimeout(() => {
        con[0].scrollTop = con[0].scrollHeight;
      }, 100);
    }
  };

  for (let i = 0; i < 253; i++) {
    insts.push({ id: i.toString(), text: i.toString() });
  }

  // Data getters
  $: access = checkAccess('boot', 'write') && $loggedIn;
  $: model, setUpdate(model);
  $: message, scroll();
</script>

<div class="container" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <Grid fullWidth noGutter>
        <Row>
          <Column><div class="title">Connect the device to CAN network and press a button below.</div></Column>
        </Row>
        <Row style="height: inherit;">
          <Grid fullWidth noGutter>
            <Row style="height: inherit;">
              <Column></Column>
              <Column>
                <Row padding>
                  <Column>Device selector</Column>
                </Row>
                <Row>
                  <Column>
                    <Dropdown titleText="Device Instance" size="sm" bind:selectedId={data.instance} items={insts} on:select={(e) => select(e)}/>
                  </Column>
                </Row>
                {#if access}
                  <Row padding>
                    <Column>
                      <Button disabled={running || !update.boot} icon={Upload} on:click={(e) => loader(e)} style="width: inherit;">Boot loader</Button>
                    </Column>
                  </Row>
                {/if}
                <Row>
                  <Column>
                    <Button disabled={running ||  !update.main} icon={Upload} on:click={(e) => program(e)}>Program Update</Button>
                  </Column>
                </Row>
              </Column>
              <Column></Column>
              <Column sm={11} md={11} lg={11}>
                  <Row padding>
                  <Column>Console</Column>
                </Row>
                <Row style="height: 80%;">
                  <Column>
                    <Tile style="height: 100%; white-space: pre !important; border: 1px solid gray; overflow-y: auto">{message}</Tile>
                  </Column>
                </Row>
              </Column>
              <Column></Column>
            </Row>
          </Grid>
        </Row>
      </Grid>
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
    margin-bottom: 1rem;
  }
</style>
