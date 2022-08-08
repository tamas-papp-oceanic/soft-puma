<script>
  import { Grid, Row, Column, Form, TextInput,
    PasswordInput, Button } from "carbon-components-svelte";
  import { login } from '../auth/auth.js'
  import {push } from 'svelte-spa-router'

  export let redirect = "/welcome"

  let username = '';
  let password = '';
  let error = false;

  async function _login() {
    const res = await login(username,password)
    if (res != true) {
      console.log("Login failed")
      error = true
    } else {
      push(redirect)
    }
  }
</script>

<Grid>
  <Row>
    <Column sm={0} md={2} lg={4} />
    <Column sm={4} md={4} lg={8}>
      <h3>Restricted Access</h3>
      <p>Please enter your login credentials to continue</p><small>(Internet connection required)</small>
      <hr>
      <Form>
        <TextInput bind:value={username} labelText="User name" placeholder="Enter user name..." required />
        <PasswordInput bind:value={password} required type="password" labelText="Password" placeholder="Enter password..." />
        <Button on:click={(e) => _login(e)} type="submit">Submit</Button>
      </Form>
    </Column>
    <Column sm={0} md={2} lg={4} />
  </Row>
  <hr>
  <Row>
  {#if error}
    <Column sm={4} md={4} lg={8}><span class="error">Login failed, please try again.</span></Column>
  {/if}
  </Row>
</Grid>

<style>
  .error {
    color: red;
  }
</style>
