<script>
  import { ToastNotification } from "carbon-components-svelte";

  export let kind;
  export let title;
  export let subtitle;
  export let notify;
  export let caption = new Date().toLocaleString();

</script>

<div class="notify" on:pointerdown={(e) => (notify = false)}>
  <ToastNotification
    kind = {kind}
    title = {title}
    subtitle = {subtitle}
    caption = {caption}
    hideCloseButton
    timeout = "2500"
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