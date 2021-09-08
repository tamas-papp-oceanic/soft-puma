<script>
  import {
    Grid,
    Row,
    Column
  } from "carbon-components-svelte";
  import {
    Form,
    TextInput,
    PasswordInput,
    Button,
  } from "carbon-components-svelte";
  import {
    userData,
    accessToken,
    refreshToken,
    loggedIn
  } from '../stores/user.js';
  import {location, push, pop, replace, link} from 'svelte-spa-router'
  import jwt_decode from "jwt-decode";
  let isSideNavOpen = false;
  let username = '';
  let password = '';
  let error = false;
  export let redirect = "/welcome"
  async function doLogin() {
    const res = await fetch('http://localhost:8080/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password
      })
    });
    const status = res.status
    const json = await res.json()
    if (res.status != 200) {
      console.log("Login failed")
      error = true
    } else {
      console.log("Login Success")
      error=false
      accessToken.set(json.accessToken)
      refreshToken.set(json.refreshToken)
      loggedIn.set(true)
      var decoded = jwt_decode(json.access_token);
      userData.set(decoded)
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
        <PasswordInput bind:value={password} required type="password" labelText="Password" placeholder="Enter password..." />
        <Button on:click={doLogin} type="submit">Submit</Button>
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
