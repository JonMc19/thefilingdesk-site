/* The Filing Desk: comparing companies (sitebuild/compare.py).
   - Every comparison box (form[data-compare]) suggests companies as you type and opens the comparison: the pair's own
     page when it has one (/compare/pairs.json), otherwise /compare/?a=…&b=….
   - On /compare/?a=…&b=… it draws that comparison from the two companies' cards (/companies/<t>/card.json), in the
     same markup as the pairs' own pages: compare.py writes the cards, the row labels and the note, so the figures and
     wording come from one place. The opening sentences follow compare.py's lead().
   - On a pair's own page it draws the charts from window.CMP. */
(() => {
  const el = id => document.getElementById(id);
  const get = url => fetch(url).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  let index, pairs;
  const companies = () => index || (index = get("/assets/search-index.json").then(x => x || []));
  const pairInfo = () => pairs || (pairs = get("/compare/pairs.json").then(x => x || {labels: [], note: "", pairs: {}}));

  async function resolve(text) {
    const s = (text || "").trim();
    if (!s) return null;
    const list = await companies();
    const m = s.match(/\(([A-Za-z0-9.-]+)\)\s*$/);
    const t = (m ? m[1] : s).toUpperCase().replace(".", "-");
    const hit = list.find(c => c.t === t) || list.find(c => c.n.toLowerCase() === s.toLowerCase())
      || list.find(c => c.n.toLowerCase().startsWith(s.toLowerCase()));
    return hit ? hit.t : null;
  }
  async function target(a, b) {
    const own = (await pairInfo()).pairs[[a, b].sort().join("|")];
    return own || `/compare/?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`;
  }

  /* the comparison boxes */
  function wire(form) {
    const list = form.querySelector("datalist"), msg = form.querySelector(".cmp-msg");
    form.addEventListener("focusin", async () => {
      if (list.options.length) return;
      list.innerHTML = (await companies()).map(c => `<option value="${esc(c.n)} (${c.t})">`).join("");
    });
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const a = await resolve(form.elements.a.value), b = await resolve(form.elements.b.value);
      msg.textContent = !a || !b ? "Pick two companies from the list." : a === b ? "Pick two different companies." : "";
      if (a && b && a !== b) location.href = await target(a, b);
    });
  }
  document.querySelectorAll("form[data-compare]").forEach(wire);

  /* charts, from the two cards */
  function charts(ka, kb) {
    const Y = [...new Set([...ka.years, ...kb.years])].sort((x, y) => x - y).slice(-10);
    const at = (k, key) => Y.map(y => { const i = k.years.indexOf(y); return i < 0 ? null : k[key][i]; });
    const bank = ka.bank || kb.bank;
    const niceStep = (lo, hi) => {
      const raw = Math.max(hi - Math.min(0, lo), 1e-9) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
      return [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
    };
    const axis = step => v => FD.minus(+v.toFixed(step < 1 ? 2 : 0) + "");
    const xlab = (i, short) => (short ? "’" : "FY") + String(Y[i]).slice(2);
    const chart = (id, key, scale, pct, label) => {
      const a = at(ka, key).map(v => (v == null ? null : v / scale)), b = at(kb, key).map(v => (v == null ? null : v / scale));
      const vals = a.concat(b).filter(v => v != null);
      if (!vals.length) { el(id).closest("figure").hidden = true; return; }
      const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals), step = niceStep(lo, hi);
      const fmt = v => (v == null ? "—" : pct ? v.toFixed(1) + "%" : "$" + v.toFixed(1) + "B");
      FD.lines(el(id), {
        years: Y, xlab, min: Math.floor(lo / step) * step, max: hi, step, fmt: v => axis(step)(v) + (pct ? "%" : ""),
        series: [{values: a, color: "var(--s1)", end: ka.name}, {values: b, color: "var(--s2)", end: kb.name}],
        aria: `Line chart of ${label} for ${ka.name} and ${kb.name}, fiscal ${Y[0]} to ${Y[Y.length - 1]}`,
        rows: i => [["var(--s1)", ka.name, fmt(a[i])], ["var(--s2)", kb.name, fmt(b[i])]],
      });
    };
    FD.draw(() => {
      chart("cmp-rev", "rev", 1000, false, "revenue");
      chart("cmp-m", bank ? "roe" : "om", 1, true, bank ? "return on equity" : "operating margin");
      chart("cmp-cash", bank ? "ni" : "fcf", 1000, false, bank ? "net income" : "free cash flow");
    });
  }
  if (Array.isArray(window.CMP) && window.FD) charts(window.CMP[0], window.CMP[1]);

  /* /compare/?a=…&b=…: any pair */
  const result = el("cmp-result");
  const q = new URLSearchParams(location.search);
  if (!result || !q.get("a") || !q.get("b")) return;
  const poss = n => (n.endsWith("'s") ? n : n + (n.endsWith("s") ? "'" : "'s"));
  const monthDay = iso => { const d = new Date(iso + "T00:00:00Z"); return d.toLocaleString("en-US", {month: "long", timeZone: "UTC"}) + " " + d.getUTCDate(); };
  function lead(a, b) {
    const la = a.lead, lb = b.lead, s = [];
    if (la.rev > 0 && lb.rev > 0) {
      const [big, small] = la.rev >= lb.rev ? [a, b] : [b, a], ratio = big.lead.rev / small.lead.rev;
      s.push(`${big.name} reported revenue of ${big.lead.rev_w} in fiscal ${big.fy}, ${ratio >= 1.15 ? ratio.toFixed(1) + " times" : "about the same as"} ${poss(small.name)} ${small.lead.rev_w} in fiscal ${small.fy}.`);
    }
    const verb = g => (g >= 0 ? "grew" : "fell");
    if (la.g != null && lb.g != null)
      s.push(`${poss(a.name)} revenue ${verb(la.g)} ${Math.abs(la.g).toFixed(1)}% in its latest year, and ${poss(b.name)} ${verb(lb.g)} ${Math.abs(lb.g).toFixed(1)}%.`);
    const [key, what] = a.bank || b.bank ? ["roe", "a return on equity"] : ["om", "an operating margin"];
    if (la[key] != null && lb[key] != null) s.push(`${a.name} had ${what} of ${la[key].toFixed(1)}%, against ${lb[key].toFixed(1)}% at ${b.name}.`);
    if (la.fcf_w && lb.fcf_w) s.push(`Free cash flow was ${la.fcf_w} at ${a.name} and ${lb.fcf_w} at ${b.name}.`);
    if (a.end.slice(5) !== b.end.slice(5))
      s.push(`Their fiscal years end in different months (${monthDay(a.end)} and ${monthDay(b.end)}), so the periods don't line up exactly.`);
    return s.join(" ");
  }
  function figure(id, title, note) {
    return `<figure><figcaption><div class="t">${title}</div><div class="n">${note}</div></figcaption><div id="${id}"></div></figure>`;
  }
  (async () => {
    const a = await resolve(q.get("a")), b = await resolve(q.get("b"));
    if (!a || !b || a === b) { result.innerHTML = `<p class="cmp-msg">Pick two different companies from the list above.</p>`; return; }
    const own = (await pairInfo()).pairs[[a, b].sort().join("|")];
    if (own) { location.replace(own); return; }
    const [ka, kb] = await Promise.all([a, b].map(t => get(`/companies/${t.toLowerCase()}/card.json`)));
    const info = await pairInfo();
    if (!ka || !kb) { result.innerHTML = `<p class="cmp-msg">That comparison couldn't be loaded. Try again.</p>`; return; }
    document.title = `${ka.name} vs ${kb.name}: revenue, margins, growth and cash flow compared | The Filing Desk`;
    const robots = document.createElement("meta");   // one page per pair for search engines is the pair's own page
    robots.name = "robots"; robots.content = "noindex";
    document.head.append(robots);
    const bank = ka.bank || kb.bank, A = esc(ka.name), B = esc(kb.name);
    const sub = ka.sub === kb.sub ? ka.sub : ka.sector === kb.sector ? ka.sector : "";
    const rows = info.labels.filter(l => l in ka.cells || l in kb.cells)
      .map(l => `<tr><td>${esc(l)}</td><td>${esc(ka.cells[l] || "—")}</td><td>${esc(kb.cells[l] || "—")}</td></tr>`).join("");
    const legend = `<div class="legend"><span><i class="line c1"></i>${A}</span><span><i class="line c2"></i>${B}</span></div>`;
    const fig = (id, t, n) => figure(id, t, n).replace("</figure>", legend + "</figure>");
    document.querySelector(".cmp-start")?.remove();
    result.innerHTML = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/companies/">Companies</a><span aria-hidden="true">/</span><a href="/compare/">Compare</a></nav>
<article class="sheet">
  <header class="card co-hero"><h1>${A} vs ${B}</h1>
    <p class="co-meta"><a href="/companies/${ka.t.toLowerCase()}/">${A}</a> <span class="tk">${ka.t}</span> · <a href="/companies/${kb.t.toLowerCase()}/">${B}</a> <span class="tk">${kb.t}</span>${sub ? " · " + esc(sub) : ""}</p>
    <p class="lead">${esc(lead(ka, kb))}</p></header>
  <section class="card"><h2 id="figures">Side by side</h2>
    <div class="tbl cmp-tbl"><table><thead><tr><th scope="col"></th><th scope="col">${A}</th><th scope="col">${B}</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="src">${esc(info.note)}</div></section>
  <section class="card"><h2 id="charts">Ten years</h2>${fig("cmp-rev", "Revenue", "US$ billions, fiscal years")}${fig("cmp-m", bank ? "Return on equity" : "Operating margin", bank ? "Percent. Net income over average equity." : "Percent of revenue")}${fig("cmp-cash", bank ? "Net income" : "Free cash flow", bank ? "US$ billions" : "US$ billions. Cash from operations minus capital expenditure.")}</section>
  <section class="card"><h2 id="another">Compare with another company</h2>
    <form class="cmp-pick" action="/compare/" method="get" data-compare><label for="cmp-a">Compare</label><input id="cmp-a" name="a" list="cmp-list" placeholder="Company or ticker" autocomplete="off" required><label for="cmp-b">with</label><input id="cmp-b" name="b" list="cmp-list" placeholder="Any company or ticker" autocomplete="off" required><button type="submit">Compare</button><datalist id="cmp-list"></datalist><p class="cmp-msg" aria-live="polite"></p></form></section>
  <div class="src">Source: the companies' Form 10-K filings, from SEC EDGAR, and the last close. For information only, not investment advice: the figures describe results, not which company is the better investment. The Filing Desk is not affiliated with either company. Full figures on the <a href="/companies/${ka.t.toLowerCase()}/">${A}</a> and <a href="/companies/${kb.t.toLowerCase()}/">${B}</a> pages.</div>
</article>`;
    result.querySelectorAll("form[data-compare]").forEach(wire);
    charts(ka, kb);
  })();
})();
