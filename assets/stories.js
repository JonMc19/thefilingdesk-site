/* The Filing Desk: the filter and search on /stories/. "#results", "#quarterly" or "#week" in the address opens on one kind, which is how
   the old /reports/ and /weekly/ lists forward here; "?q=nvidia" opens on a search. Without scripts the search box stays hidden
   and every story shows. */
(() => {
  const buttons = [...document.querySelectorAll(".chips button[data-kind]")];
  const items = [...document.querySelectorAll(".stories > li")];
  const form = document.querySelector(".story-search");
  const input = form && form.querySelector("input");
  const none = document.querySelector(".story-none");
  // lower case, accents and a leading "$" (cashtags) ignored, so "nebius", "NBIS" and "$nbis" all match
  const fold = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const texts = items.map(li => fold(li.textContent.replace(/\s+/g, " ")));
  let kind = "";
  const apply = () => {
    const words = input ? fold(input.value).split(/\s+/).map(w => w.replace(/^\$/, "")).filter(Boolean) : [];
    let shown = 0;
    items.forEach((li, i) => {
      const ok = (!kind || li.dataset.kind === kind) && words.every(w => texts[i].includes(w));
      li.hidden = !ok;
      shown += ok;
    });
    if (none) none.textContent = !words.length || shown ? ""
      : kind ? "No stories of this kind match your search. Try All." : "No stories match your search.";
  };
  const show = k => {
    kind = k;
    buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.kind === k)));
    apply();
  };
  const remember = () => {
    const q = input ? input.value.trim() : "";
    history.replaceState(null, "", location.pathname + (q ? "?q=" + encodeURIComponent(q) : "") + (kind ? "#" + kind : ""));
  };
  buttons.forEach(b => b.addEventListener("click", () => { show(b.dataset.kind); remember(); }));
  if (form) {
    form.hidden = false;
    form.addEventListener("submit", e => { e.preventDefault(); input.blur(); });
    input.addEventListener("input", () => { apply(); remember(); });
    input.value = new URLSearchParams(location.search).get("q") || "";
  }
  const start = location.hash.slice(1);
  show(buttons.some(b => b.dataset.kind && b.dataset.kind === start) ? start : "");
})();
