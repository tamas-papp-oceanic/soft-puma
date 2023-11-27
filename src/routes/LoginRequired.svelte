<script>
  import { ToastNotification } from "carbon-components-svelte";

  export let notify;
</script>

<div class="notify">
  <ToastNotification
    lowContrast=false
    kind="info"
    title="Info"
    subtitle="Login required."
    caption="If you want full functionality log in please."
    hideCloseButton
    timeout="5000"
    on:close = {(e) => (notify = false)}
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
