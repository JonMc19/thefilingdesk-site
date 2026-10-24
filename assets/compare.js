/* The Filing Desk: comparing companies (sitebuild/compare.py).
   - Every comparison box (form[data-compare]) suggests companies as you type and opens the comparison: a pair's own
     page when it has one (/compare/pairs.json), otherwise /compare/?t=AMD,NVDA.
   - Every "Add a company" box (form[data-add]) adds one more, up to four.
   - On /compare/?t=… (or ?a=…&b=…) it draws the comparison of two to four companies from their cards
     (/companies/<t>/card.json), in the same markup as the pairs' own pages: compare.py writes the cards, the row labels
     and the note, so the figures and wording come from one place. For two companies the opening sentences follow
     compare.py's lead(); for three or four they give each measure's range.
   - On a pair's own page it draws the charts from window.CMP. */
(() => {
  const MAX = 4;
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
  async function target(tickers) {
    if (tickers.length === 2) {
      const own = (await pairInfo()).pairs[[...tickers].sort().join("|")];
      if (own) return own;
    }
    return "/compare/?t=" + tickers.map(encodeURIComponent).join(",");
  }

  /* the boxes: two companies (or one more on a company page), and "Add a company" */
  function wire(form) {
    const list = form.querySelector("datalist"), msg = form.querySelector(".cmp-msg");
    form.addEventListener("focusin", async () => {
      if (list.options.length) return;
      list.innerHTML = (await companies()).map(c => `<option value="${esc(c.n)} (${c.t})">`).join("");
    });
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (form.dataset.add !== undefined) {
        const have = form.dataset.add.split(",").filter(Boolean), t = await resolve(form.elements.add.value);
        msg.textContent = !t ? "Pick a company from the list." : have.includes(t) ? "That company is already here." : "";
        if (t && !have.includes(t)) location.href = await target([...have, t].slice(0, MAX));
        return;
      }
      const a = await resolve(form.elements.a.value), b = await resolve(form.elements.b.value);
      msg.textContent = !a || !b ? "Pick two companies from the list." : a === b ? "Pick two different companies." : "";
      if (a && b && a !== b) location.href = await target([a, b]);
    });
  }
  document.querySelectorAll("form[data-compare], form[data-add]").forEach(wire);

  /* charts, from the cards */
  function charts(cards) {
    const Y = [...new Set(cards.flatMap(k => k.years))].sort((x, y) => x - y).slice(-10);
    const at = (k, key) => Y.map(y => { const i = k.years.indexOf(y); return i < 0 ? null : k[key][i]; });
    const bank = cards.some(k => k.bank);
    const niceStep = (lo, hi) => {
      const raw = Math.max(hi - Math.min(0, lo), 1e-9) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
      return [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
    };
    const axis = step => v => FD.minus(+v.toFixed(step < 1 ? 2 : 0) + "");
    const xlab = (i, short) => (short ? "’" : "FY") + String(Y[i]).slice(2);
    const names = cards.map(k => k.name).join(", ").replace(/, ([^,]*)$/, " and $1");
    const chart = (id, key, scale, pct, label) => {
      const vs = cards.map(k => at(k, key).map(v => (v == null ? null : v / scale)));
      const vals = vs.flat().filter(v => v != null);
      if (!vals.length) { el(id).closest("figure").hidden = true; return; }
      const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals), step = niceStep(lo, hi);
      const fmt = v => (v == null ? "—" : pct ? v.toFixed(1) + "%" : "$" + v.toFixed(1) + "B");
      FD.lines(el(id), {
        years: Y, xlab, min: Math.floor(lo / step) * step, max: hi, step, fmt: v => axis(step)(v) + (pct ? "%" : ""),
        series: cards.map((k, j) => ({values: vs[j], color: `var(--s${j + 1})`, end: k.name})),
        aria: `Line chart of ${label} for ${names}, fiscal ${Y[0]} to ${Y[Y.length - 1]}`,
        rows: i => cards.map((k, j) => [`var(--s${j + 1})`, k.name, fmt(vs[j][i])]),
      });
    };
    FD.draw(() => {
      chart("cmp-rev", "rev", 1000, false, "revenue");
      chart("cmp-m", bank ? "roe" : "om", 1, true, bank ? "return on equity" : "operating margin");
      chart("cmp-cash", bank ? "ni" : "fcf", 1000, false, bank ? "net income" : "free cash flow");
    });
  }
  if (Array.isArray(window.CMP) && window.FD) charts(window.CMP);

  /* /compare/?t=…: two to four companies */
  const result = el("cmp-result");
  const q = new URLSearchParams(location.search);
  const asked = (q.get("t") ? q.get("t").split(",") : [q.get("a"), q.get("b")]).filter(Boolean);
  if (!result || asked.length < 2) return;
  const poss = n => (n.endsWith("'s") ? n : n + (n.endsWith("s") ? "'" : "'s"));
  const monthDay = iso => { const d = new Date(iso + "T00:00:00Z"); return d.toLocaleString("en-US", {month: "long", timeZone: "UTC"}) + " " + d.getUTCDate(); };
  const signed = v => (v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "%";
  function leadTwo(a, b) {
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
  function leadMany(cards) {
    const s = [], list = xs => xs.join(", ").replace(/, ([^,]*)$/, " and $1");
    const byRev = cards.filter(k => k.lead.rev > 0).sort((x, y) => y.lead.rev - x.lead.rev);
    if (byRev.length) s.push(`By revenue in their latest fiscal years: ${list(byRev.map(k => `${k.name} ${k.lead.rev_w} (fiscal ${k.fy})`))}.`);
    const range = (key, what) => {
      const ks = cards.filter(k => k.lead[key] != null).sort((x, y) => y.lead[key] - x.lead[key]);
      if (ks.length >= 2) s.push(`${what} ranged from ${signed(ks[0].lead[key])} at ${ks[0].name} to ${signed(ks[ks.length - 1].lead[key])} at ${ks[ks.length - 1].name}.`);
    };
    range("g", "Revenue growth in the latest year");
    if (cards.some(k => k.bank)) range("roe", "Return on equity"); else range("om", "Operating margin");
    if (new Set(cards.map(k => k.end.slice(5))).size > 1) s.push("Their fiscal years end in different months, so the periods don't line up exactly.");
    return s.join(" ");
  }
  const figure = (id, t, n, legend) => `<figure><figcaption><div class="t">${t}</div><div class="n">${n}</div></figcaption><div id="${id}"></div>${legend}</figure>`;
  const addForm = tickers => tickers.length >= MAX ? `<p class="cmp-full">Four companies is the most a comparison shows. Remove one (×) to add another.</p>` :
    `<form class="cmp-pick cmp-add" data-add="${tickers.join(",")}"><label for="cmp-add">Add a company</label><input id="cmp-add" name="add" list="cmp-list" placeholder="Company or ticker" autocomplete="off" required><button type="submit">Add</button><datalist id="cmp-list"></datalist><p class="cmp-msg" aria-live="polite"></p></form>`;

  (async () => {
    const tickers = [];
    for (const s of asked) { const t = await resolve(s); if (t && !tickers.includes(t)) tickers.push(t); }
    tickers.splice(MAX);
    if (tickers.length < 2) { result.innerHTML = `<p class="cmp-msg">Pick at least two different companies from the list above.</p>`; return; }
    if (tickers.length === 2) {
      const own = (await pairInfo()).pairs[[...tickers].sort().join("|")];
      if (own) { location.replace(own); return; }
    }
    const [info, ...cards] = await Promise.all([pairInfo(), ...tickers.map(t => get(`/companies/${t.toLowerCase()}/card.json`))]);
    if (cards.some(k => !k)) { result.innerHTML = `<p class="cmp-msg">That comparison couldn't be loaded. Try again.</p>`; return; }
    const names = cards.map(k => esc(k.name));
    document.title = `${cards.map(k => k.name).join(" vs ")}: revenue, margins, growth and cash flow compared | The Filing Desk`;
    const robots = document.createElement("meta");   // the pages search engines should list are the pairs' own pages
    robots.name = "robots"; robots.content = "noindex";
    document.head.append(robots);
    const bank = cards.some(k => k.bank);
    const subs = new Set(cards.map(k => k.sub)), sectors = new Set(cards.map(k => k.sector));
    const sub = subs.size === 1 ? cards[0].sub : sectors.size === 1 ? cards[0].sector : "";
    const heads = await Promise.all(cards.map(async k => `<th scope="col">${esc(k.name)}${cards.length > 2 ? ` <a class="cmp-x" href="${await target(tickers.filter(x => x !== k.t))}" aria-label="Remove ${esc(k.name)}" title="Remove">×</a>` : ""}</th>`));
    const rows = info.labels.filter(l => cards.some(k => l in k.cells))
      .map(l => `<tr><td>${esc(l)}</td>${cards.map(k => `<td>${esc(k.cells[l] || "—")}</td>`).join("")}</tr>`).join("");
    const legend = `<div class="legend">${cards.map((k, j) => `<span><i class="line c${j + 1}"></i>${esc(k.name)}</span>`).join("")}</div>`;
    const links = cards.map(k => `<a href="/companies/${k.t.toLowerCase()}/">${esc(k.name)}</a> <span class="tk">${k.t}</span>`).join(" · ");
    document.querySelector(".cmp-start")?.remove();
    result.innerHTML = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/companies/">Companies</a><span aria-hidden="true">/</span><a href="/compare/">Compare</a></nav>
<article class="sheet">
  <header class="card co-hero"><h1>${names.join(" vs ")}</h1>
    <p class="co-meta">${links}${sub ? " · " + esc(sub) : ""}</p>
    <p class="lead">${esc(cards.length === 2 ? leadTwo(...cards) : leadMany(cards))}</p>
    ${addForm(tickers)}</header>
  <section class="card"><h2 id="figures">Side by side</h2>
    <div class="tbl cmp-tbl"><table><thead><tr><th scope="col"></th>${heads.join("")}</tr></thead><tbody>${rows}</tbody></table></div>
    <div class="src">${esc(info.note)}</div></section>
  <section class="card"><h2 id="charts">Ten years</h2>${figure("cmp-rev", "Revenue", "US$ billions, fiscal years", legend)}${figure("cmp-m", bank ? "Return on equity" : "Operating margin", bank ? "Percent. Net income over average equity." : "Percent of revenue", legend)}${figure("cmp-cash", bank ? "Net income" : "Free cash flow", bank ? "US$ billions" : "US$ billions. Cash from operations minus capital expenditure.", legend)}</section>
  <p class="cmp-new"><a href="/compare/">Start a new comparison</a></p>
  <div class="src">Source: the companies' Form 10-K filings, from SEC EDGAR, and the last close. For information only, not investment advice: the figures describe results, not which company is the better investment. The Filing Desk is not affiliated with any of these companies.</div>
</article>`;
    result.querySelectorAll("form[data-add]").forEach(wire);
    charts(cards);
  })();
})();
