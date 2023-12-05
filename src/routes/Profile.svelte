<script>
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import { Form, Grid, Row, Column, ToastNotification, TextInput, PasswordInput, Button,
    ComposedModal, ModalHeader, ModalBody, ModalFooter } from "carbon-components-svelte";
  import { afetch } from '../auth/auth.js'
  import { authURL, userData } from '../stores/user.js'
  
  let username = $userData.hasOwnProperty('user_name') ? $userData.user_name : '???';
  let password = null;
  let newpass = null;
  let rptpass = null;
  let email = null;
  let error = false;
  let errtext = '';
  let remove = false;

  onMount(() => {
    document.getElementById("password").focus();
  });

  function _email(txt) {
    return (txt && !!txt.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) || 'Please enter a valid email'
  };

  async function _submit() {
    error = false;
    if ((newpass != null) && (newpass != rptpass)) {
      errtext = 'New password and Repeat password fields are different.'
      error = true;
      return;
    }
    if ((typeof email === 'string') && (email !== '')) {
      let val = _email(email);
      if (typeof val === 'string') {
        errtext = val;
        error = true;
        return;
      }
    }
    const res = await afetch($authURL + '/update', {
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
      push("/");
    } else {
      errtext = 'Update failed, please try again.'
      error = true;
    }
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
  
  function _cancel() {
    error = false;
    remove = false;
  };

  if ($userData.hasOwnProperty('user_name')) {
    username = $userData.user_name;
  }
</script>

<Form>
  <Grid>
    <Row>
      <Column sm={0} md={2} lg={4} />
      <Column sm={4} md={4} lg={8}>
        <Row>
          <Column>
            <h4>User profile information</h4>
            <p class="descr">(to change current password fill up new password and repeat fields)</p>
            <hr>
          </Column>
        </Row>
        <Row>
          <Column>
            <TextInput readonly bind:value={username} labelText="User name" placeholder="Enter user name..." required />
          </Column>
        </Row>
        <Row padding>
          <Column>
            <PasswordInput id="password" bind:value={password} type="password" labelText="Current password" placeholder="Enter current password..." required />
          </Column>
        </Row>
        <Row>
          <Column>
            <PasswordInput bind:value={newpass} type="password" labelText="New password" placeholder="Enter new password..." />
          </Column>
        </Row>
        <Row padding>
          <Column>
            <PasswordInput warn={(newpass !== null) && (rptpass != newpass)} bind:value={rptpass} type="password" labelText="Repeat password" warnText="Differs from new password!" placeholder="Repeat new password..." />
          </Column>
        </Row>
        <Row>
          <Column>
            <TextInput bind:value={email} labelText="Email" placeholder="Enter email address..." />
          </Column>
        </Row>
        <Row padding>
          <Column>
            <Button on:click={(e) => _submit(e)} type="submit">Submit</Button>
            <Button kind="secondary" on:click={(e) => _quit(e)}>Cancel</Button>
          </Column>
          <Column style="text-align: end;">
            <Button kind="tertiary" on:click={(e) => _delete(e)}>Delete</Button>
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
</Form>
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

<style class="css">
  .descr {
    font-size: 0.8rem;
    color: #c6c6c6;
  }
</style>