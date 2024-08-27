<script>
  import { parse } from 'qs'
  import { pop, querystring } from 'svelte-spa-router'
  import { Grid, Row, Column, DataTable, Toolbar, ToolbarContent, Tile,
    Button } from "carbon-components-svelte";
  import SkipBack from "carbon-icons-svelte/lib/SkipBack16";

  const hds1 = new Array(
    { key: "title", value: "Parameter" },
    { key: "value", value: "Value" },
  );
  const hds2 = new Array(
    { key: "field", value: "Field#" },
    { key: "title", value: "Title", width: "50%" },
    { key: "value", value: "Value", width: "30%" },
    { key: "unit", value: "Unit" },
  );

  let data = parse($querystring, { charset: 'utf-8' });
  let title = 'Content of message';
  let rws1 = new Array();
  let rws2 = new Array();

  function back(e) {
    pop();
  };

  rws1.push({ id: 0, title: 'PGN', value: data.header.pgn });
  rws1.push({ id: 1, title: 'Title', value: data.title });
  rws1.push({ id: 2, title: 'Priority', value: data.header.pri });

  if (data.int != 0) {
    rws1.push({ id: 3, title: 'Interval (ms)', value: data.int });
  }

  for (let i in data.fields) {
    let fld = data.fields[i]; 
    rws2.push({
      id: i,
      field: fld.field,
      title: fld.title,
      value: fld.state == 'V' ? fld.value : '-', 
      unit: fld.unit != null ? fld.unit : '',
    });
  }
</script>

<Grid>
  <Row>
    <Column>
      <Toolbar>
        <Tile>{title}</Tile>
        <ToolbarContent>
          <Button icon={SkipBack} on:click={(e) => back(e)}>Back</Button>
        </ToolbarContent>
      </Toolbar>
    </Column>
  </Row>
  <Row padding>
    <Column sm={6} md={6} lg={6}>
      <div class="wrap">
        <div class="cont">
          <DataTable headers={hds1} rows={rws1} size="compact" />
        </div>
      </div>
    </Column>
    <Column sm={10} md={10} lg={10}>
      <div class="wrap">
        <div class="cont">
          <DataTable headers={hds2} rows={rws2} size="compact" />
        </div>
      </div>
    </Column>
  </Row>
</Grid>

<style global>
  .wrap {
    height: calc(100vh - 12em);
    overflow-x: hidden !important;
    overflow-y: auto !important;
  }
  .cont {
    height: 100%;
  }
</style>
