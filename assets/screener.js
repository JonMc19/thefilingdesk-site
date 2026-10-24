/* The Filing Desk: the screener (sitebuild/screener.py). Loads /screener/data.json (one row of numbers per company),
   filters it by the boxes as you type, sorts by any column, and keeps the settings in the address (?g_min=20&sector=…)
   so a screen can be bookmarked or shared. Up to four ticked companies open in the comparison tool. */
(() => {
  const el = id => document.getElementById(id);
  const form = el("scr-form");
  if (!form) return;
  if (matchMedia("(max-width: 900px)").matches) el("scr-panel").open = false;   // on a phone the results come first
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  const PAGE = 100, MAX_CMP = 4;
  const BASE_COLS = ["rev", "g", "om", "fcfm", "roic", "pe", "fs"];
  let D, shown = PAGE, sort = {k: "rev", dir: -1};
  const picked = new Set();

  // the boxes' units: revenue and cash in US$ billions, insider trades in US$ millions; the data is in US$ millions
  const scale = u => (u === "B" ? 1000 : 1);
  const fmt = (v, u) => {
    if (v == null) return "—";
    const minus = v < 0 ? "−" : "", a = Math.abs(v);
    if (u === "B") return minus + "$" + (a >= 1000 ? (a / 1000).toFixed(1) + "B" : a.toFixed(0) + "M");
    if (u === "M") return a === 0 ? "—" : minus + "$" + (a >= 1000 ? (a / 1000).toFixed(1) + "B" : a.toFixed(1) + "M");
    if (u === "%") return minus + a.toFixed(1) + "%";
    if (u === "x") return minus + a.toFixed(1) + "×";
    return minus + a.toFixed(0);
  };
  const num = s => { const v = parseFloat(String(s).replace(/[,$%×x\s]/g, "").replace("−", "-")); return isNaN(v) ? null : v; };

  function state() {
    const s = {};
    form.querySelectorAll("[data-k]").forEach(i => { if (i.value !== "") s[i.dataset.k] = i.value; });
    return s;
  }
  function apply(s) {
    form.querySelectorAll("[data-k]").forEach(i => { i.value = s[i.dataset.k] ?? ""; });
    fillIndustries();
    if (s.ind) el("f-ind").value = s.ind;
  }
  function fillIndustries() {
    const sec = el("f-sector").value, keep = el("f-ind").value;
    const inds = [...new Set(D.rows.filter(r => !sec || r.s === sec).map(r => r.i).filter(Boolean))].sort();
    el("f-ind").innerHTML = `<option value="">All industries</option>` + inds.map(i => `<option>${esc(i)}</option>`).join("");
    if (inds.includes(keep)) el("f-ind").value = keep;
  }

  function matches(r, s) {
    if (s.sector && r.s !== s.sector) return false;
    if (s.ind && r.i !== s.ind) return false;
    for (const [k, , u] of D.fields) {
      const lo = num(s[k + "_min"]), hi = num(s[k + "_max"]);
      if (lo == null && hi == null) continue;
      const v = r[k];
      if (v == null) return false;
      if (lo != null && v < lo * scale(u)) return false;
      if (hi != null && v > hi * scale(u)) return false;
    }
    return true;
  }

  function render() {
    const s = state();
    const q = new URLSearchParams(s);
    if (sort.k !== "rev" || sort.dir !== -1) q.set("sort", (sort.dir < 0 ? "-" : "") + sort.k);
    history.replaceState(null, "", q.toString() ? "?" + q : location.pathname);
    document.querySelectorAll("[data-preset]").forEach(b => {
      const p = D.presets[b.dataset.preset][1];
      b.setAttribute("aria-pressed", String(Object.keys(p).length === Object.keys(s).length && Object.entries(p).every(([k, v]) => String(s[k]) === String(v))));
    });
    const active = D.fields.filter(([k]) => s[k + "_min"] || s[k + "_max"]).map(([k]) => k);
    const n = active.length + (s.sector ? 1 : 0) + (s.ind ? 1 : 0);
    el("scr-active").textContent = n ? `· ${n} active` : "";
    const cols = [...BASE_COLS, ...active.filter(k => !BASE_COLS.includes(k))];
    const field = Object.fromEntries(D.fields.map(f => [f[0], f]));
    const rows = D.rows.filter(r => matches(r, s)).sort((a, b) => {
      const x = a[sort.k], y = b[sort.k];
      if (sort.k === "n") return sort.dir * a.n.localeCompare(b.n);
      if (x == null) return 1; if (y == null) return -1;
      return sort.dir * (x - y);
    });
    el("scr-count").textContent = `${rows.length} of ${D.rows.length} companies`;
    const th = (k, label, full) => `<th scope="col"${k === "n" ? ' class="name"' : ""}><button type="button" data-sort="${k}"${full ? ` title="${esc(full)}"` : ""} aria-sort="${sort.k === k ? (sort.dir < 0 ? "descending" : "ascending") : "none"}">${esc(label)}${sort.k === k ? (sort.dir < 0 ? " ▾" : " ▴") : ""}</button></th>`;
    el("scr-table").tHead.innerHTML = `<tr><th scope="col"><span class="vh">Compare</span></th>${th("n", "Company")}${cols.map(k => th(k, field[k][3], field[k][1])).join("")}</tr>`;
    el("scr-table").tBodies[0].innerHTML = rows.slice(0, shown).map(r =>
      `<tr><td><input type="checkbox" data-t="${r.t}" aria-label="Select ${esc(r.n)} to compare"${picked.has(r.t) ? " checked" : ""}></td>` +
      `<td><a href="/companies/${r.t.toLowerCase()}/">${esc(r.n)}</a><span class="tk">${r.t}</span><span class="role">${esc(r.i || r.s)}</span></td>` +
      cols.map(k => `<td>${fmt(r[k], field[k][2])}</td>`).join("") + "</tr>").join("")
      || `<tr><td colspan="${cols.length + 2}">No company matches all these filters.</td></tr>`;
    el("scr-more").hidden = rows.length <= shown;
    el("scr-cmp").disabled = picked.size < 2;
    el("scr-cmp").textContent = picked.size >= 2 ? `Compare ${picked.size} selected` : "Select 2 to 4 companies to compare";
  }

  fetch("/screener/data.json").then(r => r.json()).then(data => {
    D = data;
    const sectors = [...new Set(D.rows.map(r => r.s))].sort();
    el("f-sector").innerHTML += sectors.map(s => `<option>${esc(s)}</option>`).join("");
    const q = Object.fromEntries(new URLSearchParams(location.search));
    if (q.sort) sort = {k: q.sort.replace(/^-/, ""), dir: q.sort.startsWith("-") ? -1 : 1};
    delete q.sort;
    apply(q);
    render();
  });

  form.addEventListener("submit", e => e.preventDefault());
  form.addEventListener("input", e => { if (e.target.id === "f-sector") fillIndustries(); shown = PAGE; render(); });
  el("scr-reset").addEventListener("click", () => { apply({}); shown = PAGE; render(); });
  document.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => {
    const on = b.getAttribute("aria-pressed") === "true";
    apply(on ? {} : D.presets[b.dataset.preset][1]);
    shown = PAGE; render();
  }));
  el("scr-more").addEventListener("click", () => { shown += PAGE; render(); });
  el("scr-table").addEventListener("click", e => {
    const s = e.target.closest("[data-sort]");
    if (!s) return;
    const k = s.dataset.sort;
    sort = sort.k === k ? {k, dir: -sort.dir} : {k, dir: k === "n" ? 1 : -1};
    render();
  });
  el("scr-table").addEventListener("change", e => {
    const t = e.target.dataset.t;
    if (!t) return;
    if (e.target.checked && picked.size >= MAX_CMP) { e.target.checked = false; return; }
    e.target.checked ? picked.add(t) : picked.delete(t);
    render();
  });
  el("scr-cmp").addEventListener("click", () => {
    if (picked.size >= 2) location.href = "/compare/?t=" + [...picked].join(",");
  });
})();
