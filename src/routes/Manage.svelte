<script>
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import { Grid, Row, Column, ToastNotification, TextInput, PasswordInput, ButtonSet, Button,
    ComposedModal, ModalHeader, ModalBody, ModalFooter, DataTable } from "carbon-components-svelte";
  import { update } from '../auth/auth.js'
  import { userData } from '../stores/user.js'
  
  const headers = new Array(
    { key: 'user_id', value: 'User ID', sort: false },
    { key: 'user_name', value: 'User name', sort: false },
    { key: 'permission', value: 'Permission', sort: false },
  );

  let rows = new Array();
  let selected = new Array();
  let firstname = null;
  let lastname = null;
  let password = null;
  let newpass = null;
  let rptpass = null;
  let email = null;
  let error = false;
  let errtext = '';
  let remove = false;
  let pagination = {
    pageSize: 10,
    page: 1,
    totalItems: 0,
  };

  onMount(() => {
    document.getElementById("password").focus();
  });

  function _email(txt) {
    return (txt && !!txt.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) || 'Please enter a valid email'
  };

  async function _submit() {
    errtext = ''
    error = false;
    if ((password == null) || (password.length == 0)) {
      errtext = 'Password cannot be empty.'
      error = true;
      return;
    }
    if ((newpass != null) && (newpass != rptpass)) {
      errtext = 'New password and Repeat password fields are different.'
      error = true;
      return;
    }
    if (email != null) {
      let val = _email(email);
      if (typeof val === 'string') {
        errtext = val;
        error = true;
        return;
      }
    }
    // const res = await update(username, password, newpass, email);
    // if (res != true) {
    //   errtext = 'Update failed, please try again.'
    //   error = true;
    // } else {
    //   push("/");
    // }
  };
  
  function _quit() {
    error = false;
    push("/");
  };

  function _delete() {
    error = false;
    if ((password == null) || (password.length == 0)) {
      errtext = 'Password cannot be empty.'
      error = true;
      return;
    }
    remove = true;
  };

  function _remove() {
    // push("/");
  };
  
  function _suspend() {
    // push("/");
  };

  function _cancel() {
    error = false;
    remove = false;
  };

  // if ($userData.hasOwnProperty('user_name')) {
  //   username = $userData.user_name;
  // }
</script>

<Grid>
  <Row>
    <!-- <Column sm={0} md={2} lg={4} /> -->
    <Column sm={3} md={3} lg={6}>
      <Row>
        <Column>
          <h3>User profiles</h3>
          <hr>
        </Column>
      </Row>
      <Row padding>
        <Column>
          <DataTable
            size="compact"
            selectable
            bind:selectedRowIds={selected}
            {headers}
            {rows}
            pageSize={pagination.pageSize}
            page={pagination.page}>
            <span slot="cell" let:cell let:row>{cell.value}</span>
          </DataTable>
        </Column>
      </Row>
    </Column>
    <Column sm={1} md={1} lg={2}>
      <ButtonSet stacked style="padding: 0.2rem;">
        <Button style="margin: 0.2rem 0" on:click={(e) => _suspend(e)} type="submit">Suspend</Button>
        <Button style="margin: 0.2rem 0" on:click={(e) => _delete(e)}>Delete</Button>
      </ButtonSet>
    </Column>
    <Column sm={4} md={4} lg={8}>
      <Row>
        <Column>
          <TextInput bind:value={firstname} labelText="First name" placeholder="Enter first name..." required />
        </Column>
        <Column>
          <TextInput bind:value={lastname} labelText="Last name" placeholder="Enter last name..." required />
        </Column>
      </Row>
      <Row padding>
        <Column>
          <PasswordInput bind:value={newpass} type="password" labelText="New password" placeholder="Enter new password..." required />
        </Column>
        <Column>
          <PasswordInput warn={(newpass !== null) && (rptpass != newpass)} bind:value={rptpass} type="password" labelText="Repeat password" warnText="Differs from new password!" placeholder="Repeat new password..." required />
        </Column>
      </Row>
      <Row>
        <Column>
          <TextInput bind:value={email} labelText="Email" placeholder="Enter email address..." required />
        </Column>
      </Row>
      <Row padding>
        <Column>
          <Button on:click={(e) => _submit(e)} type="submit">Submit</Button>
          <Button kind="secondary" on:click={(e) => _quit(e)}>Cancel</Button>
        </Column>
      </Row>
    </Column>
    <Column sm={0} md={2} lg={4} />
  </Row>
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
</Grid>
<ComposedModal open={remove} on:submit={(e) => _remove(e)} on:close={(e) => _cancel(e)} size="xs">
  <ModalHeader title="Are you sure you want to delete your account?" />
  <ModalBody>
    <span>This CANNOT be undone!</span>
  </ModalBody>
  <ModalFooter
    primaryButtonText="Proceed"
    secondaryButtons={[{ text: "Cancel" }]}
    on:click:button--secondary={(e) => _cancel(e)}
  />
</ComposedModal>
