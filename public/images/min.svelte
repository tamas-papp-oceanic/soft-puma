<script>
  let className = undefined;
  export { className as class };
  export let id = undefined;
  export let tabindex = undefined;
  export let focusable = false;
  export let title = undefined;
  export let style = undefined;

  $: ariaLabel = $$props['aria-label'];
  $: ariaLabelledBy = $$props['aria-labelledby'];
  $: labelled = ariaLabel || ariaLabelledBy || title;
  $: attributes = {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-hidden': labelled ? undefined : true,
    role: labelled ? 'img' : undefined,
    focusable: tabindex === '0' ? true : focusable,
    tabindex
  };
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<svg 
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keyup
  on:keydown
  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="16" width="16"
  class={className}
  preserveAspectRatio="xMidYMid meet"
  {style}
  {id}
  {...attributes}>
  <line class="line" x1="1.5625" y1="18.4375" x2="18.4375" y2="18.4375" />
  <slot>
    {#if title}
      <title>{title}</title>
    {/if}
  </slot>
</svg>

<style>
  .line {
    fill: none;
    stroke: white;
    stroke-width: 1.25;
    stroke-linecap: round;
    stroke-miterlimit: 10;
  }
</style>
