<script>
  import { push } from 'svelte-spa-router'
  import { Grid, Row, Column, Form, TextInput, PasswordInput, Button } from "carbon-components-svelte";
  import { login } from '../auth/auth.js'
  
  export let redirect = "/welcome"

  let username = '';
  let password = '';
  let error = false;
  let errtext = '';

  async function submit() {
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
  }
</script>

<style>
  .error {
    color: red;
  }
</style>
<Grid>
  <Row>
    <Column sm={0} md={2} lg={4} />
    <Column sm={4} md={4} lg={8}>
      <h3>Restricted Access</h3>
      <p>Please enter your login credentials to continue</p><small>(Internet connection required)</small>
      <hr>
      <Form>
        <TextInput bind:value={username} labelText="User name" placeholder="Enter user name..." required />
        <PasswordInput bind:value={password} type="password" labelText="Password" placeholder="Enter password..." required />
        <Button on:click={submit} type="submit">Submit</Button>
      </Form>
    </Column>
    <Column sm={0} md={2} lg={4} />
  </Row>
  <hr>
  <Row>
  {#if error}
    <Column sm={4} md={4} lg={8}><span class="error">{errtext}</span></Column>
  {/if}
</Row>
</Grid>
