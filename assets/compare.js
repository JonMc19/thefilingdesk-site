/* The Filing Desk: comparison pages. On /compare/<a>-vs-<b>/ it draws the three charts from window.CMP (with
   report.js); on /compare/ it turns the two boxes into a link to the pair's page, from window.CMP_INDEX. */
(() => {
  const el = id => document.getElementById(id);

  if (window.CMP && window.FD) {
    const C = window.CMP, Y = C.years;
    const niceStep = (lo, hi) => {
      const raw = Math.max(hi - Math.min(0, lo), 1e-9) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
      return [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
    };
    const axis = step => v => FD.minus(+v.toFixed(step < 1 ? 2 : 0) + "");
    const xlab = (i, short) => (short ? "’" : "FY") + String(Y[i]).slice(2);
    const chart = (id, key, scale, suffix, label) => {
      const a = C.a[key].map(v => v == null ? null : v / scale), b = C.b[key].map(v => v == null ? null : v / scale);
      const vals = a.concat(b).filter(v => v != null);
      if (!vals.length) { el(id).closest("figure").hidden = true; return; }
      const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals), step = niceStep(lo, hi);
      const fmt = v => v == null ? "—" : (suffix === "%" ? v.toFixed(1) + "%" : "$" + v.toFixed(1) + "B");
      FD.lines(el(id), {
        years: Y, xlab, min: Math.floor(lo / step) * step, max: hi, step, fmt: v => axis(step)(v) + suffix,
        series: [{values: a, color: "var(--s1)", end: C.a.name}, {values: b, color: "var(--s2)", end: C.b.name}],
        aria: `Line chart of ${label} for ${C.a.name} and ${C.b.name}, fiscal ${Y[0]} to ${Y[Y.length - 1]}`,
        rows: i => [["var(--s1)", C.a.name, fmt(a[i])], ["var(--s2)", C.b.name, fmt(b[i])]],
      });
    };
    FD.draw(() => {
      chart("cmp-rev", "rev", 1000, "", "revenue");
      chart("cmp-m", "m", 1, "%", C.bank ? "return on equity" : "operating margin");
      chart("cmp-cash", "cash", 1000, "", C.bank ? "net income" : "free cash flow");
    });
  }

  const form = document.querySelector("form[data-compare]");
  if (form && window.CMP_INDEX) {
    const names = window.CMP_NAMES, msg = form.querySelector(".cmp-msg");
    const byName = Object.fromEntries(Object.entries(names).map(([t, n]) => [n.toLowerCase(), t]));
    const ticker = s => {
      s = s.trim();
      const m = s.match(/\(([A-Za-z0-9.-]+)\)\s*$/);
      const t = (m ? m[1] : s).toUpperCase().replace(".", "-");
      return names[t] ? t : byName[s.toLowerCase()] || null;
    };
    const link = (a, b) => window.CMP_INDEX[[a, b].sort().join("|")];
    form.addEventListener("submit", e => {
      e.preventDefault();
      const a = ticker(el("cmp-a").value), b = ticker(el("cmp-b").value);
      msg.textContent = "";
      if (!a || !b) { msg.textContent = "Pick two companies from the list."; return; }
      if (a === b) { msg.textContent = "Pick two different companies."; return; }
      const url = link(a, b);
      if (url) { location.href = url; return; }
      const others = (window.CMP_PEERS[a] || []).slice(0, 6);
      msg.textContent = `There's no comparison of ${names[a]} and ${names[b]}: we compare companies in the same line of business.`;
      others.forEach((o, k) => {
        const x = document.createElement("a");
        x.href = link(a, o);
        x.textContent = `${names[a]} vs ${names[o]}`;
        msg.append(k ? " · " : " Try: ", x);
      });
    });
  }
})();
