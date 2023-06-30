<script>
  import { push } from 'svelte-spa-router'
  import { Grid, Row, Column, ToastNotification, TextInput, PasswordInput, Button } from "carbon-components-svelte";
  import { login } from '../auth/auth.js'
  
  let redirect = "/welcome"

  let username = '';
  let password = '';
  let error = false;
  let errtext = '';

  async function _submit() {
    if ((username == null) | (username.length == 0)) {
      errtext = 'User name can\'t be empty.'
      error = true;
      return;
    }
    if ((password == null) | (password.length == 0)) {
      errtext = 'Password can\'t be empty.'
      error = true;
      return;
    }
    const res = await login(username, password);
    if (res != true) {
      errtext = 'Login failed, please try again.'
      error = true
    } else {
      push(redirect)
    }
  };

  function _cancel() {
    push("/");
  };
</script>

<Grid>
  <Row>
    <Column sm={0} md={2} lg={4} />
    <Column sm={4} md={4} lg={8}>
      <h3>Restricted Access</h3>
      <p>Please enter your login credentials to continue</p><small>(Internet connection required)</small>
      <hr>
      <TextInput bind:value={username} labelText="User name" placeholder="Enter user name..." required />
      <PasswordInput bind:value={password} type="password" labelText="Password" placeholder="Enter password..." required />
      <Button on:click={(e) => _submit(e)} type="submit">Submit</Button>
      <Button kind="secondary" on:click={(e) => _cancel(e)}>Cancel</Button>
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
