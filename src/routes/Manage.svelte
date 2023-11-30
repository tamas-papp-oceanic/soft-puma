<script>
  import { onMount } from 'svelte'
  import { Grid, Row, Column, ToastNotification, TextInput, ButtonSet,
    Button, Dropdown, ComposedModal, ModalHeader, ModalBody, ModalFooter,
    DataTable, DataTableSkeleton, Form, Pagination } from "carbon-components-svelte";
  import UpdateNow from "carbon-icons-svelte/lib/UpdateNow20";
  import { afetch } from '../auth/auth.js'
  import { authURL } from '../stores/user.js'
  
  const headers = new Array(
    { key: 'username', value: 'User name', sort: false },
    { key: 'firstname', value: 'First name', sort: false },
    { key: 'surname', value: 'Last name', sort: false },
    { key: 'permission', value: 'Permission', sort: false },
  );

  const permissions = new Array(
    { id: 'Basic', text: 'Basic account' },
    { id: 'Customer', text: 'Verified customer' },
    { id: 'Reseller', text: 'Authorised reseller' },
    { id: 'Oceanic', text: 'Oceanic staff' },
    { id: 'Admin', text: 'Administrator' },
  );

  let rows = new Array();
  let selected = new Array();
  let username = null;
  let firstname = null;
  let surname = null;
  let email = null;
  let permission = 'Basic';
  let error = false;
  let errtext = '';
  let action = null;
  let pagination = {
    pageSize: 20,
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
    if (e !== null) {
      e.preventDefault();
    }
    promise = _getusers();
  };

  function _select(nam) {
    for (let i in rows) {
      if (rows[i].username == nam) {
        return new Array(rows[i].id);
      }
    }
    return new Array();
  };

  function _create(e) {
    if (e !== null) {
      e.preventDefault();
    }
    action = 'create';
    permission = 'Basic';
    setTimeout(() => {
      document.getElementById("username").focus();
    }, 500)
  };

  function _reset(e) {
    if (e !== null) {
      e.preventDefault();
    }
    action = 'reset';
  };

  function _modify(e) {
    if (e !== null) {
      e.preventDefault();
    }
    action = 'modify';
    setTimeout(() => {
      document.getElementById("firstname").focus();
    }, 500)
  };

  function _suspend(e) {
    if (e !== null) {
      e.preventDefault();
    }
    action = 'suspend';
  };

  function _delete(e) {
    if (e !== null) {
      e.preventDefault();
    }
    action = 'delete';
  };
  
  async function _submit(e) {
    if (e !== null) {
      e.preventDefault();
    }
    let val = _email(email);
    if (typeof val === 'string') {
      errtext = val;
      error = true;
      return;
    } else {
      error = false;
    }
    const res = await afetch($authURL + '/' + action, {
      method: 'POST',
      body: JSON.stringify({
        username,
        firstname,
        surname,
        email,
        permission,
      }),
    });
    if (res.ok) {
      if (action == 'create') {
        setTimeout(() => {
          selected = _select(username);
        }, 500);
      }
      _clract();
      _reread();
    } else {
      errtext = 'Update failed, please try again.'
      error = true;
    }
  };
  
  function _cancel(e) {
    if (e !== null) {
      e.preventDefault();
    }
    error = false;
    switch (action) {
      case 'create':
        username = null;
        firstname = null;
        surname = null;
        email = null;
        permission = 'Basic';
        break;
      case 'modify':
        username = selected.Username;
        firstname = selected.Firstname;
        surname = selected.Lastname;
        email = selected.Email;
        permission = selected.Permission;
        break;
    }
    _clract();
  };

  function _action(e) {
    if (e !== null) {
      e.preventDefault();
    }
    switch (action) {
      case 'suspend':
        break;
      case 'delete':
        break;
    }
    _clract();
  };

  function _clract(e) {
    if (e !== null) {
      e.preventDefault();
    }
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
              <h3>User profiles</h3>
            </Column>
            <Column style="text-align: end;">
              <Button on:click={(e) => _reread(e)} on="Refresh" icon={UpdateNow} />
            </Column>
          </Row>
          <hr>
        </Column>
      </Row>
      <Row padding>
        <Column>
          {#await promise}
            <DataTableSkeleton showHeader={false} showToolbar={false} {headers} size="compact" rows={pagination.pageSize} />
          {:then rows}
            <DataTable id="users" zebra size="compact" sortable radio bind:selectedRowIds={selected} {headers} {rows}
              pageSize={pagination.pageSize} page={pagination.page}>
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
      <ButtonSet stacked style="padding: 0.2rem;">
        <Button disabled={action !== null} style="margin: 0.2rem 0" on:click={(e) => _create(e)}>Create</Button>
        <Button disabled={(action !== null) || (selected.length == 0)} style="margin: 0.2rem 0" on:click={(e) => _modify(e)}>Modify</Button>
        <Button disabled={(action !== null) || (selected.length == 0)} style="margin: 0.2rem 0" on:click={(e) => _reset(e)}>Reset password</Button>
        <Button disabled={(action !== null) || (selected.length == 0)} style="margin: 0.2rem 0" on:click={(e) => _suspend(e)}>Suspend</Button>
        <Button disabled={(action !== null) || (selected.length == 0)} style="margin: 0.2rem 0" on:click={(e) => _delete(e)}>Delete</Button>
      </ButtonSet>
    </Column>
    <Column sm={3} md={3} lg={6}>
      <Form on:submit={(e) => _submit(e)}>
        <Row padding>
          <Column>
            <TextInput id="username" disabled={!['create'].includes(action)} bind:value={username} labelText="User name" placeholder="Enter user name..." required />
          </Column>
        </Row>
        <Row>
          <Column>
            <TextInput id="firstname" disabled={!['create', 'modify'].includes(action)} bind:value={firstname} labelText="First name" placeholder="Enter first name..." required />
          </Column>
        </Row>
        <Row padding>
          <Column>
            <TextInput disabled={!['create', 'modify'].includes(action)} bind:value={surname} labelText="Last name" placeholder="Enter last name..." required />
          </Column>
        </Row>
        <Row>
          <Column>
            <TextInput disabled={!['create', 'modify'].includes(action)} bind:value={email} labelText="Email" placeholder="Enter email address..." required />
          </Column>
        </Row>
        <Row padding>
          <Column>
            <Dropdown disabled={!['create', 'modify'].includes(action)} bind:selectedId={permission} titleText="Permission" items={permissions} required/>
          </Column>
        </Row>
        <Row>
          <Column>
            <Button disabled={!['create', 'modify'].includes(action)} type="submit">Submit</Button>
            <Button disabled={!['create', 'modify'].includes(action)} kind="secondary" on:click={(e) => _cancel(e)}>Cancel</Button>
          </Column>
        </Row>
      </Form>
      {#if error}
        <Row>
          <ToastNotification
            lowContrast=false
            fullWidth
            kind="error"
            title="Error"
            subtitle={errtext}
            hideCloseButton
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
