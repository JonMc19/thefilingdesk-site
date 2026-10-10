/* The Filing Desk: the filter on /stories/. "#results" or "#week" in the address opens on one kind, which is how
   the old /reports/ and /weekly/ lists forward here. Without scripts every story shows. */
(() => {
  const buttons = [...document.querySelectorAll(".chips button[data-kind]")];
  const items = [...document.querySelectorAll(".stories > li")];
  const show = kind => {
    buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.kind === kind)));
    items.forEach(li => { li.hidden = Boolean(kind) && li.dataset.kind !== kind; });
  };
  buttons.forEach(b => b.addEventListener("click", () => {
    show(b.dataset.kind);
    history.replaceState(null, "", b.dataset.kind ? "#" + b.dataset.kind : location.pathname);
  }));
  const start = location.hash.slice(1);
  if (buttons.some(b => b.dataset.kind && b.dataset.kind === start)) show(start);
})();
