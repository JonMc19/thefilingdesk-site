/* The Filing Desk: company search with suggestions as you type.
   Enhances every <form data-search>; without script the form still submits to /companies/?q=. */
(function () {
  const me = document.currentScript;
  const base = me.src.replace(/assets\/search\.js.*$/, "");
  let index = null, loading = null;
  const load = () => loading || (loading = fetch(base + "assets/search-index.json").then(r => r.json()).then(d => (index = d)));

  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, "");
  function find(q) {
    q = norm(q.trim());
    if (!q) return [];
    const scored = [];
    for (const c of index) {
      const t = c.t.toLowerCase(), n = norm(c.n);
      let s = t === q ? 0 : n.startsWith(q) ? 1 : t.startsWith(q) ? 2 : n.split(" ").some(w => w.startsWith(q)) ? 3 : n.includes(q) ? 4 : -1;
      if (s >= 0) scored.push([s, -c.r, c]);
    }
    return scored.sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, 8).map(x => x[2]);
  }
  const esc = s => s.replace(/[&<>"]/g, ch => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[ch]));

  document.querySelectorAll("form[data-search]").forEach(form => {
    const input = form.querySelector("input"), list = form.querySelector("ul");
    let hits = [], cur = -1;
    const go = c => { window.location.href = base + "companies/" + c.t.toLowerCase() + "/"; };
    const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); cur = -1; };
    const render = () => {
      if (!input.value.trim()) return close();
      list.innerHTML = hits.length
        ? hits.map((c, i) => `<li role="option" id="${list.id}-${i}" aria-selected="${i === cur}"><span class="tk">${c.t}</span><span>${esc(c.n)}</span><span class="sec">${esc(c.s)}</span></li>`).join("")
        : `<li class="none" role="option" aria-disabled="true">No company matches “${esc(input.value.trim())}”</li>`;
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      if (cur >= 0) input.setAttribute("aria-activedescendant", `${list.id}-${cur}`); else input.removeAttribute("aria-activedescendant");
      list.querySelectorAll("li[id]").forEach((li, i) => li.addEventListener("mousedown", e => { e.preventDefault(); go(hits[i]); }));
    };
    const update = () => load().then(() => { hits = find(input.value); cur = hits.length ? 0 : -1; render(); });
    input.addEventListener("focus", load, {once: true});
    input.addEventListener("input", update);
    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!hits.length) return;
        e.preventDefault();
        cur = (cur + (e.key === "ArrowDown" ? 1 : hits.length - 1)) % hits.length;
        render();
      } else if (e.key === "Escape") close();
    });
    input.addEventListener("blur", () => setTimeout(close, 120));
    form.addEventListener("submit", e => {
      e.preventDefault();
      load().then(() => { const h = find(input.value); if (h.length) go(h[Math.max(cur, 0)] || h[0]); else update(); });
    });
    // arriving from a no-script search, e.g. /companies/?q=nvidia
    const q = new URLSearchParams(location.search).get("q");
    if (q && form.classList.contains("search-lg")) { input.value = q; update(); }
  });
})();
