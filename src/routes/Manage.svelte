<script>
  import { onMount } from 'svelte'
  import { Grid, Row, Column, ToastNotification, TextInput, ButtonSet,
    Button, Dropdown, ComposedModal, ModalHeader, ModalBody, ModalFooter,
    DataTable, DataTableSkeleton, Form, Pagination, } from "carbon-components-svelte";
  import UpdateNow from "carbon-icons-svelte/lib/UpdateNow20";
  import { afetch } from '../auth/auth.js'
  import { authURL } from '../stores/user.js'
  
  const headers = new Array(
    { key: 'username', value: 'User name', sort: false },
    { key: 'firstname', value: 'First name', sort: false },
    { key: 'surname', value: 'Surname', sort: false },
    { key: 'permission', value: 'Permission', sort: false },
  );

  const permissions = new Array(
    { id: 'Suspend', text: 'Suspended account' },
    { id: 'Basic', text: 'Basic account' },
    { id: 'Customer', text: 'Verified customer' },
    { id: 'Reseller', text: 'Authorised reseller' },
    { id: 'Oceanic', text: 'Oceanic staff' },
    { id: 'Admin', text: 'Administrator' },
  );

  let rows = new Array();
  let selected = new Array();
  let id = null;
  let username = null;
  let firstname = null;
  let surname = null;
  let email = null;
  let permission = 'Basic';
  let notify = false;
  let nfykind = '';
  let nfytitle = '';
  let nfytext = '';
  let action = null;
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };
  let promise = _getusers();
  
  onMount(() => {
    let elm = document.getElementById("users");
    if (elm !== null) {
      elm.focus();
    }
  });

  function _email(txt) {
    return (txt && !!txt.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) || 'Please enter a valid email'
  };

  async function _getuser(nam) {
    username = nam;
    firstname = null;
    surname = null;
    email = null;
    permission = 'Basic';
    const res = await afetch($authURL + '/user?username=' + nam, {method: 'GET'});
    if (res.ok) {
      let usr = await res.json();
      id = usr.id;
      firstname = usr.firstname;
      surname = usr.surname;
      email = usr.email;
      permission = usr.permission;
    } else {
      console.log("Read users failed");
    }
  };

  async function _getusers() {
    rows = new Array();
    const res = await afetch($authURL + '/users', {method: 'GET'});
    if (res.ok) {
      rows = await res.json();
      pagination.totalItems = rows.length;
      return rows;
    } else {
      pagination.totalItems = 0;
      throw new Error("Read users failed")
    }
  };

  function _reread(e) {
    promise = _getusers();
  };

  function _byname(nam) {
    ret = new Array();
    for (let i in rows) {
      if (rows[i].username == nam) {
        ret.push(rows[i].id);
        return ret;
      }
    }
    return new Array();
  };

  function _byid(id) {
    for (let i in rows) {
      if (rows[i].id == id) {
        return rows[i];
      }
    }
    return null;
  };

  function _select(e) {
    let fnd = false;
    if (selected.length > 0) {
      let det = _byid(selected[0]);
      if (det !== null) {
        fnd = true;
        id = det.id;
        username = det.username;
        firstname = det.firstname;
        surname = det.surname;
        email = det.email;
        permission = det.permission;
      }
    }
    if (!fnd) {
      id = null;
      username = null;
      firstname = null;
      surname = null;
      email = null;
      permission = 'Basic';
    }
  };

  function _create(e) {
    selected = new Array();
    action = 'create';
    _select();
    setTimeout(() => {
      document.getElementById("username").focus();
    }, 500)
  };

  function _reset(e) {
    action = 'reset';
  };

  function _modify(e) {
    action = 'modify';
    setTimeout(() => {
      document.getElementById("firstname").focus();
    }, 500)
  };

  function _delete(e) {
    action = 'delete';
  };
  
  async function _submit(e) {
    notify = false;
    nfytitle = action[0] + action.slice(1) + " user"
    if ((typeof email === 'string') && (email !== '')) {
      let val = _email(email);
      if (typeof val === 'string') {
        nfykind = "error"
        nfytext = val;
        notify = true;
        return;
      }
    }
    let tmp = {
      id,
      username,
      firstname,
      surname,
      email,
      permission,
    };
    if (action == "create") {
      tmp.password = "puma12345";
    }
    const res = await afetch($authURL + '/' + action, {
      method: 'POST',
      body: JSON.stringify(tmp),
    });
    if (res.ok) {
      nfykind = "info"
      nfytext = 'Result: ' + await res.json();
      notify = true;
      if (action == 'create') {
        setTimeout(() => {
          selected = _byname(username);
          _select();
        }, 500);
      }
      _clract();
      _reread();
    } else {
      nfykind = "error"
      nfytext = 'Result: ' + await res.json();
      notify = true;
    }
  };
  
  function _cancel(e) {
    notify = false;
    _clract();
    _select();
  };

  async function _action(e) {
    switch (action) {
      case 'delete':
        notify = false;
        nfytitle = "Delete user"
        const res1 = await afetch($authURL + '/delete?id=' + id, {method: 'POST'});
        if (res1.ok) {
          nfykind = "info"
          nfytext = 'Result: ' + await res1.json();
          notify = true;
          selected = new Array();
          _select();
          _clract();
          _reread();
        } else {
          nfykind = "error"
          nfytext = 'Result: ' + await res1.json();
          notify = true;
        }
        break;
      case 'reset':
        notify = false;
        nfytitle = "Reset password"
        const res2 = await afetch($authURL + '/reset?id=' + id, {method: 'POST'});
        if (res2.ok) {
          nfykind = "info"
          nfytext = 'Result: ' + await res2.json();
          notify = true;
          selected = new Array();
          _select();
          _clract();
          _reread();
        } else {
          nfykind = "error"
          nfytext = 'Result: ' + await res2.json();
          notify = true;
        }
        break;
    }
    _clract();
  };

  function _clract(e) {
    action = null;
  };
</script>

<Grid>
  <Row>
    <Column sm={4} md={4} lg={8}>
      <Row>
        <Column>
          <Row>
            <Column>
              <h4>User profiles</h4>
              <p class="descr">(select from users to manage account)</p>
            </Column>
            <Column style="text-align: end;">
              <Button on:click={(e) => _reread(e)} iconDescription="Refresh" icon={UpdateNow} />
            </Column>
          </Row>
          <hr>
        </Column>
      </Row>
      <Row>
        <Column>
          {#await promise}
            <DataTableSkeleton showHeader={false} showToolbar={false} {headers} rows={pagination.pageSize} />
          {:then rows}
            <DataTable id="users" zebra sortable radio bind:selectedRowIds={selected} {headers} {rows}
              pageSize={pagination.pageSize} page={pagination.page} on:click:row--select={(e) => _select(e)}>
              <span slot="cell" let:cell let:row>{cell.value}</span>
            </DataTable>
            {#if pagination.totalItems > pagination.pageSize}
              <Pagination
                bind:pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                bind:page={pagination.page}
                pageSizeInputDisabled
                pageInputDisabled
              />
            {/if}
          {:catch err}
            <ToastNotification
              lowContrast=false
              fullWidth
              kind="error"
              title="Error"
              subtitle={err.message}
              hideCloseButton
            />
          {/await}
          </Column>
      </Row>
    </Column>
    <Column sm={1} md={1} lg={2}>
      <Row>
        <ButtonSet stacked>
          <Button disabled={action !== null} style="margin: 0 0 0.2rem 0" on:click={(e) => _create(e)}>Create</Button>
          <Button disabled={(action !== null) || (selected.length == 0)} style="margin: 0.2rem 0" on:click={(e) => _modify(e)}>Modify</Button>
          <Button disabled={(action !== null) || (selected.length == 0)} style="margin: 0.2rem 0" on:click={(e) => _delete(e)}>Delete</Button>
          <Button disabled={(action !== null) || (selected.length == 0)} style="margin: 0.2rem 0 0 0" on:click={(e) => _reset(e)}>Reset</Button>
        </ButtonSet>
      </Row>
    </Column>
    <Column sm={3} md={3} lg={6}>
      <Form on:submit={(e) => _submit(e)}>
        <Row>
          <Column>
            <TextInput id="username" disabled={!['create'].includes(action)} bind:value={username} labelText="User name" placeholder="Enter user name..." required />
          </Column>
        </Row>
        <Row padding>
          <Column>
            <TextInput id="firstname" disabled={!['create', 'modify'].includes(action)} bind:value={firstname} labelText="First name" placeholder="Enter first name..." required />
          </Column>
        </Row>
        <Row>
          <Column>
            <TextInput disabled={!['create', 'modify'].includes(action)} bind:value={surname} labelText="Surname" placeholder="Enter surname..." required />
          </Column>
        </Row>
        <Row padding>
          <Column>
            <TextInput disabled={!['create', 'modify'].includes(action)} bind:value={email} labelText="Email" placeholder="Enter email address..." />
          </Column>
        </Row>
        <Row>
          <Column>
            <Dropdown disabled={!['create', 'modify'].includes(action)} bind:selectedId={permission} titleText="Permission" items={permissions} required/>
          </Column>
        </Row>
        <Row padding>
          <Column>
            <Button disabled={!['create', 'modify'].includes(action)} type="submit">Submit</Button>
            <Button disabled={!['create', 'modify'].includes(action)} kind="secondary" on:click={(e) => _cancel(e)}>Cancel</Button>
          </Column>
        </Row>
      </Form>
      {#if notify}
        <Row>
          <ToastNotification
            lowContrast=false
            fullWidth
            kind={nfykind}
            title={nfytitle}
            subtitle={nfytext}
            hideCloseButton
            timeout = "2500"
            on:close = {(e) => (notify = false)}
          />
        </Row>
      {/if}
    </Column>
  </Row>
</Grid>
<ComposedModal open={['reset', 'suspend', 'delete'].includes(action)} on:submit={(e) => _action(e)} on:close={(e) => _clract(e)} size="xs">
  <ModalHeader title={"Are you sure you want to " + action + " this account?"} />
  {#if action == 'delete'}
    <ModalBody>
      <span>This CANNOT be undone!</span>
    </ModalBody>
  {/if}
  <ModalFooter
    primaryButtonText="Proceed"
    secondaryButtons={[{ text: "Cancel" }]}
    on:click:button--secondary={(e) => _clract(e)}
  />
</ComposedModal>

<style class="css">
  .descr {
    font-size: 0.8rem;
    color: #c6c6c6;
  }
</style>