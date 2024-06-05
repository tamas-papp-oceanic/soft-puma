<script>
  import { createEventDispatcher } from "svelte";
  import { ButtonSet, Button, Tile, Grid, Row, Column, Dropdown } from "carbon-components-svelte";
  import { checkAccess } from "../../../auth/auth.js";
  import { getUpdate } from "../../../stores/data.js";
  import { loggedIn } from "../../../stores/user.js";
  import { getvars } from "../../../config/devices.js";
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
  let vars = new Array();

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
    vars = getvars(mod);
    if (vars.length > 0) {
      if (data.variant == null) {
        data.variant = vars[0].id;
      }
    } else {
      data.variant = null;
    }
    let upd = getUpdate(mod, data.variant);
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

  model = model;

  // Data getters
  $: access = checkAccess('boot', 'write') && $loggedIn;
  $: model, data, setUpdate(model);
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
              <Column sm={5} md={5} lg={5}>
                <Row padding>
                  <Column>Device selector</Column>
                </Row>
                <Row>
                  <Column sm={6} md={6} lg={6}>
                    <Dropdown titleText="Device Instance" size="sm" bind:selectedId={data.instance} items={insts} on:select={(e) => select(e)}/>
                  </Column>
                </Row>
                {#if vars.length != 0}
                  <Row padding>
                    <Column>
                      <Dropdown disabled={running || (vars.length == 0)} titleText="Variants" size="sm" bind:selectedId={data.variant} items={vars} on:select={(e) => select(e)}/>
                    </Column>
                  </Row>
                {/if}
                <Row padding={vars.length == 0}>
                  <Column sm={10} md={10} lg={10}>
                    <Button disabled={running || !access || !update.boot} icon={Upload} on:click={(e) => loader(e)} style="width: inherit;">Boot loader</Button>
                  </Column>
                </Row>
                <Row padding={vars.length != 0}>
                  <Column sm={10} md={10} lg={10}>
                    <Button disabled={running ||  !update.main} icon={Upload} on:click={(e) => program(e)} style="width: inherit;">Program Update</Button>
                  </Column>
                </Row>
              </Column>
              <Column></Column>
              <Column sm={9} md={9} lg={9} style="height: 100%;">
                <Row padding>
                  <Column>Console</Column>
                </Row>
                <Row style="height: 80%; overflow-y: auto; border: 1px solid gray; display: block;">
                  <Column style="height: 100%;">
                    <Tile style="white-space: pre !important;">{message}</Tile>
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
