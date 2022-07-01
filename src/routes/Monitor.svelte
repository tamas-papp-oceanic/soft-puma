<script>
  import { Grid, Row, Column, DataTable } from "carbon-components-svelte";
  import { data } from "../stores/data.js";

  export let params;

  const headers = [{
    key: "id",
    value: "PGN"
  },{
    key: "raw",
    value: "Raw data"
  }];

  let rows = [];

  function buf2hex(buffer) {
    return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  } 

  // Data getters, setters
  $: {
    rows = new Array();
    for (const [key, val] of Object.entries($data)) {
      let add = parseInt(params["address"]);
      if (val.raw[3] == add) {
        let dat = new Uint8Array(val.raw.slice(4));
        let obj = {
          id: key,
          raw: buf2hex(dat),
        };
        rows.push(obj);
      }
    }
  };
</script>

<Grid>
  <Row>
    <Column>
      <DataTable 
        sortable
        {headers}
        {rows}>
        <span slot="cell" let:cell let:row>{cell.value.toString(16)}</span>
      </DataTable>
    </Column>
  </Row>
</Grid>
