<script>
  import { ToastNotification } from "carbon-components-svelte";

  export let params;
</script>

<div class="notify">
  <ToastNotification
    kind="error"
    title="Error"
    subtitle="Restricted access."
    hideCloseButton
    timeout="5000"
    lowContrast = false
  />
</div>

<style lang="css">
  .notify {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: center;
  }
</style>
