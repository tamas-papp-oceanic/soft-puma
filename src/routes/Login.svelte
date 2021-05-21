<script>
  import { Grid, Row, Column } from "carbon-components-svelte";
import {
  Form,
  TextInput,
  PasswordInput,
  Button,
} from "carbon-components-svelte";
  let isSideNavOpen = false;
</script>

<Grid>
  <Row>
    <Column sm={0} md={2} lg={4} />
    <Column sm={4} md={4} lg={8}>
            <h3>Restricted Access</h3>
            <p>Please enter your login credentials to continue</p><small>(Internet connection required)</small>
            <hr>
            <Form>
              <TextInput labelText="User name" placeholder="Enter user name..." required />
              <PasswordInput
                required
                type="password"
                labelText="Password"
                placeholder="Enter password..."
              />
              <Button type="submit">Submit</Button>
            </Form>
    </Column>
    <Column sm={0} md={2} lg={4} />
  </Row>
</Grid>
