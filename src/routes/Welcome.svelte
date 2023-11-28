<script>
  import { Grid, Row, Column } from "carbon-components-svelte";
  import { userData } from '../stores/user.js';
</script>

<Grid>
  <Row>
    <Column sm={4} md={4} lg={8}>
      <h3>Welcome {$userData.first_name} {$userData.last_name}</h3>
      <h4>Access Level: {$userData.permission}</h4>
    </Column>
  </Row>
</Grid>
