/* The Filing Desk: the projections page (/projections/?t=<TICKER>). Loads /companies/<t>/projections.json, written by
   sitebuild/companies.py (projection_inputs), and shows the company's own outlook ("What X says to expect") and one of
   two models, chosen in "Type of projections":
   - the P/E model (the default): a bull, a base and a bear case, each projecting revenue, net income and earnings per
     share five years ahead from the revenue growth and net income growth the reader enters (a net margin for a
     company with a loss), with the reader's low and high P/E estimates for each year (every box starts empty), the share prices and yearly changes from the last close
     they give, and a chart of each case's share price range against the last close;
   - the discounted cash flow (DCF) model, built the same way (October 30, 2026): a bull, a base and a bear case, each
     projecting revenue and free cash flow five years ahead from the revenue growth and free cash flow growth the
     reader enters (a free cash flow margin for a company whose free cash flow was negative), with the reader's
     discount rate and growth after year five for each case; it gives each year's cash flow worth today, a value per
     share and its difference from the last close, and a chart of each case's value per share against the last close.
     Not for a bank, whose cash flow is mostly the money it lends and takes in.
   What the reader changes goes in the address (?pe_base_g1=12, ?dcf_bull_r=9), so a link shares the projection; links from the
   company pages' old P/E calculator (?pe_g=, ?pe_m=) start the base case from their growth and multiple.
   "Save projection" asks for a name and keeps the address under it in this browser's own storage (localStorage,
   never sent anywhere), as many as the reader likes; "My projections", on the page without a company, lists them to
   open, rename or delete, and a company's page lists its own.
   Uses FD helpers from report.js. */
(function () {
  const app = document.getElementById("proj-app");
  if (!app || !window.FD) return;
  const params = new URLSearchParams(location.search);
  const t = (params.get("t") || "").toUpperCase().replace(/[^A-Z0-9.\-]/g, "");
  const CASES = ["bull", "base", "bear"], FIELDS = ["g", "n", "m", "lo", "hi"], YEARS = 5;
  const DCF_YEARLY = ["g", "f"], DCF_ONCE = ["r", "t"];   // DCF: revenue growth and FCF growth (or margin) a year; discount rate and growth after year five a case
  const COLOR = {bull: "var(--up)", base: "var(--s2)", bear: "var(--down)"};
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[ch]));
  const minus = s => String(s).replace(/^-/, "−");
  const big = v => v == null ? "—" : (v < 0 ? "−" : "") + (Math.abs(v) >= 1000
    ? "$" + (Math.abs(v) / 1000).toLocaleString("en-US", {minimumFractionDigits: 1, maximumFractionDigits: 1}) + "B"
    : "$" + Math.abs(v).toFixed(0) + "M");
  const pct = v => v == null || !isFinite(v) ? "—" : minus(v.toFixed(1)) + "%";
  const eps = v => v == null ? "—" : (v < 0 ? "−" : "") + "$" + Math.abs(v).toFixed(2);
  const price = v => v == null ? "—" : "$" + (v >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(2));
  const day = s => new Date(s + "T00:00:00Z");
  const longDate = s => day(s).toLocaleDateString("en-US", {month: "long", day: "numeric", year: "numeric", timeZone: "UTC"});

  // My projections: a list of {id, name, t: ticker, n: company name, q: the address's query, d: the date saved, at: when} in
  // this browser only. Storage can be blocked or full (a private window): then saving says so and the copied link is
  // the way to keep one. The first version kept one per company ({TICKER: {n, q, d}}); those join the list
  const STORE = "fd-projections";
  function load() {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(STORE)); } catch (e) { /* blocked: nothing saved here */ }
    if (Array.isArray(v)) return v.filter(s => s && s.id && s.t && typeof s.q === "string");
    if (v && typeof v === "object")
      return Object.entries(v).map(([tk, s], k) => ({id: "v1" + k, name: `${s.n} projection`, t: tk, n: s.n, q: s.q, d: s.d}));
    return [];
  }
  const store = list => { try { localStorage.setItem(STORE, JSON.stringify(list)); return true; } catch (e) { return false; } };
  const today = () => new Date().toISOString().slice(0, 10);
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  // two addresses hold the same projection when their figures match, whichever model each shows
  const sameAs = (a, b) => {
    const n = q => [...new URLSearchParams(q)].filter(([k]) => k !== "model").map(([k, v]) => k + "=" + v).sort().join("&");
    return n(a) === n(b);
  };
  const open = s => `/projections/?${esc(s.q)}`;

  // the box that asks for a name (saving, renaming): resolves to the name, or null when cancelled
  function askName({title, value, button, hint}) {
    let d = $("proj-dialog");
    if (!d) {
      d = document.createElement("dialog");
      d.id = "proj-dialog";
      d.className = "proj-dialog";
      d.setAttribute("aria-labelledby", "proj-dialog-h");
      d.innerHTML = `<form method="dialog">
          <h2 id="proj-dialog-h"></h2>
          <label for="proj-name">Name</label>
          <input id="proj-name" maxlength="60" autocomplete="off" required>
          <p class="proj-dialog-hint" id="proj-dialog-hint" aria-live="polite"></p>
          <p class="src">Kept in this browser only, on this device, in My projections on the Projections page.</p>
          <div class="proj-dialog-actions"><button type="button" class="dcf-reset" id="proj-dialog-cancel">Cancel</button>
            <button class="dcf-reset proj-save" id="proj-dialog-ok" value="ok"></button></div>
        </form>`;
      document.body.appendChild(d);
      $("proj-dialog-cancel").addEventListener("click", () => d.close("cancel"));
    }
    if (typeof d.showModal !== "function") {      // a browser without <dialog>: its own prompt
      const v = window.prompt(title, value);
      return Promise.resolve(v && v.trim() ? v.trim().slice(0, 60) : null);
    }
    $("proj-dialog-h").textContent = title;
    $("proj-dialog-ok").textContent = button;
    const input = $("proj-name"), hintBox = $("proj-dialog-hint");
    input.value = value;
    const update = () => { hintBox.textContent = hint ? hint(input.value.trim()) : ""; };
    input.oninput = update;
    update();
    d.returnValue = "";
    d.showModal();
    input.select();
    return new Promise(done => {
      d.addEventListener("close", () => done(d.returnValue === "ok" && input.value.trim() ? input.value.trim().slice(0, 60) : null), {once: true});
    });
  }

  if (!t) { listMine(); return; }
  fetch("/companies/" + t.toLowerCase() + "/projections.json")
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(() => {
      app.hidden = false;
      app.innerHTML = `<p>We have no projections for “${esc(t)}”. Search for a company above: foreign companies, whose shares trade in the US as ADSs, aren't covered.</p>`;
    });

  // the page without a company: My projections, newest first, each to open, rename or delete
  function listMine() {
    const box = $("my");
    if (!box) return;
    const list = load().sort((a, b) => (b.at || 0) - (a.at || 0));
    box.hidden = false;
    box.innerHTML = `<h2>My projections</h2>` + (list.length
      ? `<ul>` + list.map(s => `<li><a href="${open(s)}">${esc(s.name)}</a><span class="co">${esc(s.n)} <span class="tk">${esc(s.t)}</span></span>`
          + `<span class="d">Saved ${longDate(s.d)}</span><span class="acts"><button type="button" class="dcf-reset" data-ren="${esc(s.id)}">Rename</button>`
          + `<button type="button" class="dcf-reset" data-del="${esc(s.id)}">Delete</button></span></li>`).join("") + `</ul>`
      : `<p>No projections saved yet. Pick a company, change any figure and press “Save projection”: you can keep as many as you like.</p>`)
      + `<p class="src">Kept only in this browser, on this device: nothing is sent to us. Clearing the site's data in your browser removes them.</p>`;
    box.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
      const s = load().find(x => x.id === b.dataset.del);
      if (s && window.confirm(`Delete “${s.name}”?`)) { store(load().filter(x => x.id !== s.id)); listMine(); }
    }));
    box.querySelectorAll("[data-ren]").forEach(b => b.addEventListener("click", () => {
      const s = load().find(x => x.id === b.dataset.ren);
      if (!s) return;
      askName({title: "Rename projection", value: s.name, button: "Rename"}).then(name => {
        if (!name) return;
        store(load().map(x => x.id === s.id ? {...x, name} : x));
        listMine();
      });
    }));
  }

  function render(P) {
    document.title = `${P.name} (${P.t}) projections: bull, base and bear cases | The Filing Desk`;
    const intro = $("proj-intro");
    intro.querySelector("h1").textContent = `${P.name} projections`;
    intro.querySelectorAll("p, .proj-top").forEach(x => { x.hidden = true; });
    const input = intro.querySelector("input");
    if (input) input.placeholder = "Search another company";
    const px = P.price;
    const hasDcf = !!P.dcf;
    const model = hasDcf && params.get("model") === "dcf" ? "dcf" : "pe";
    const pick = hasDcf
      ? `<label class="proj-pick" for="proj-model">Type of projections <select id="proj-model"><option value="pe">P/E model</option><option value="dcf">DCF model</option></select></label>`
      : `<p class="proj-pick">P/E model <small>(a bank's cash flow is mostly the money it lends and takes in, so the cash flow model doesn't suit it)</small></p>`;
    app.hidden = false;
    app.innerHTML = `
      <div class="proj-head">
        <p class="proj-co"><a href="/companies/${P.t.toLowerCase()}/">${esc(P.name)}</a><span class="tk">${P.t}</span></p>
        ${px ? `<p class="proj-px">Last close <b>$${px.close.toFixed(2)}</b> on ${longDate(px.date)}${P.pe_today ? ` · P/E today <b>${P.pe_today.toFixed(1)}×</b>` : ""}</p>` : ""}
        ${pick}
      </div>
      <div class="proj-bar">
        <button type="button" class="dcf-reset" id="proj-reset">Clear all values</button>
        <button type="button" class="dcf-reset" id="proj-link">Copy link to my projection</button>
        <button type="button" class="dcf-reset proj-save" id="proj-save">Save projection</button>
        <a class="dcf-reset" href="/projections/#my">My projections</a>
        <span class="share-note" id="proj-note" role="status"></span>
      </div>
      <p class="proj-saved-bar" id="proj-saved-bar" hidden></p>
      ${P.outlook || ""}
      <div id="proj-pe"></div>
      <div id="proj-dcf" hidden></div>`;
    const note = $("proj-note");
    const pe = renderPe(P, $("proj-pe"));
    const dcf = hasDcf ? renderDcf(P, $("proj-dcf")) : null;
    if ([...params.keys()].some(k => /^(pe|dcf)_/.test(k)))
      note.textContent = "Showing a shared or saved projection. “Clear all values” empties every box.";

    // the bar at the top: clear every box of both models, copy the address, save it under a name in this browser
    $("proj-reset").addEventListener("click", () => {
      pe.reset();
      if (dcf) dcf.reset();
      note.textContent = "";
    });
    $("proj-link").addEventListener("click", () => FD.share.copy(note, ""));
    const mine = () => load().filter(s => s.t === P.t);
    const named = name => mine().find(s => s.name.toLowerCase() === name.toLowerCase());
    $("proj-save").addEventListener("click", () => {
      const here = location.search.slice(1), current = mine().find(s => sameAs(s.q, here));
      askName({
        title: `Save ${P.name} projection`, button: "Save",
        value: current ? current.name : `${P.name} projection ${mine().length + 1}`,
        hint: name => named(name) ? `You already have a projection for ${P.name} called “${named(name).name}”: saving replaces it.` : "",
      }).then(name => {
        if (!name) return;
        const list = load(), same = named(name), entry = {name, t: P.t, n: P.name, q: location.search.slice(1), d: today(), at: Date.now()};
        const next = same ? list.map(s => s.id === same.id ? {...s, ...entry} : s) : list.concat({id: newId(), ...entry});
        note.textContent = store(next) ? `Saved as “${name}”. Find it in My projections.`
          : "This browser doesn't allow saving here (a private window, say): use “Copy link” to keep it.";
        savedBar();
      });
    });
    // this company's saved projections, with the one on screen marked
    function savedBar() {
      const bar = $("proj-saved-bar"), list = mine(), here = location.search.slice(1);
      bar.hidden = !list.length;
      if (!list.length) return;
      const cur = list.find(s => sameAs(s.q, here));
      bar.innerHTML = (cur ? `This is your saved projection “${esc(cur.name)}”. ` : "")
        + `Your ${esc(P.name)} projections: ` + list.map(s => s === cur ? `<b>${esc(s.name)}</b>` : `<a href="${open(s)}">${esc(s.name)}</a>`).join(" · ");
    }
    // any change to a figure changes the address, so which saved projection is on screen is checked again
    ["input", "click"].forEach(e => app.addEventListener(e, () => setTimeout(savedBar, 0)));
    savedBar();

    if (!hasDcf) return;
    const sel = $("proj-model"), peBox = $("proj-pe"), dcfBox = $("proj-dcf");
    function show(m) {
      sel.value = m;
      peBox.hidden = m !== "pe";
      dcfBox.hidden = m !== "dcf";
      (m === "pe" ? pe : dcf).chart();   // drawn to its width, so once it is visible
      try {
        const q = new URLSearchParams(location.search);
        q.set("model", m);
        history.replaceState(null, "", location.pathname + "?" + q.toString() + location.hash);
      } catch (e) { /* the address can't be changed here */ }
    }
    sel.addEventListener("change", () => show(sel.value));
    show(model);
  }

  // the row explanations: one box that floats over the page (so no table needs a scroller to hold it), shown on
  // hover, on focus or on a tap of the "?"
  function tips(box, help) {
    const tip = document.createElement("div");
    tip.className = "tip proj-tip"; tip.hidden = true;
    document.body.appendChild(tip);
    let pinned = null;
    const showTip = b => {
      tip.textContent = help[b.dataset.k];
      tip.hidden = false;
      const r = b.getBoundingClientRect(), w = tip.offsetWidth;
      tip.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px";
      tip.style.top = (r.bottom + 6) + "px";
    };
    const hideTip = () => { if (!pinned) tip.hidden = true; };
    box.querySelectorAll(".q").forEach(b => {
      b.addEventListener("pointerenter", () => showTip(b));
      b.addEventListener("pointerleave", hideTip);
      b.addEventListener("focus", () => showTip(b));
      b.addEventListener("blur", () => { pinned = null; hideTip(); });
      b.addEventListener("click", () => { pinned = pinned === b ? null : b; if (pinned) showTip(b); else tip.hidden = true; });
    });
    addEventListener("scroll", () => { pinned = null; tip.hidden = true; }, {passive: true});
  }

  // for reference above the tables: what the company has done, never a suggestion of what to enter
  function reference(P) {
    const bits = [];
    if (P.growth) bits.push(`${esc(P.name)}'s revenue grew ${pct(P.growth[0])} a year over the last ${P.growth[1] > 1 ? P.growth[1] + " years" : "year"}`);
    const pe = (P.refs || []).map(([k, label, v]) => `${k === "today" ? "its P/E today" : k === "peers" ? "its peers' median" : `the ${label.replace(/ median$/, "")} median`} ${v.toFixed(1)}×`);
    if (pe.length) bits.push(pe.join(", "));
    return bits.length ? `<p class="proj-ref"><b>For reference:</b> ${bits.join("; ")}.</p>` : "";
  }

  // the P/E model. The reader's figures are revenue growth, net income growth and a low and a high P/E for each
  // year; net income grows from the latest fiscal year's, and the net margin follows. A company that made a loss
  // can't grow net income from it, so there the reader gives a net margin for each year instead
  function renderPe(P, box) {
    const A = P.actual, px = P.price;
    const fy = y => "FY" + y;
    const byGrowth = A.net_income != null && A.net_income > 0;
    const keys = CASES.flatMap(c => FIELDS.flatMap(f => [1, 2, 3, 4, 5].map(i => `${c}_${f}${i}`)));
    const defaults = {};
    CASES.forEach(c => { defaults[c] = {}; FIELDS.forEach(f => { defaults[c][f] = Array(YEARS).fill(null); }); });   // every box starts empty
    const state = JSON.parse(JSON.stringify(defaults));
    // a link from the old P/E calculator: its growth and multiple start the base case
    const legacy = FD.share.read("pe", ["g", "m"]);
    if (isFinite(parseFloat(legacy.g))) { state.base.g = Array(YEARS).fill(parseFloat(legacy.g)); if (byGrowth) state.base.n = state.base.g.slice(); }
    if (isFinite(parseFloat(legacy.m))) { state.base.lo = Array(YEARS).fill(parseFloat(legacy.m)); state.base.hi = Array(YEARS).fill(parseFloat(legacy.m)); }
    const shared = FD.share.read("pe", keys);
    Object.entries(shared).forEach(([k, v]) => {
      const m = /^(bull|base|bear)_(g|n|m|lo|hi)([1-5])$/.exec(k), n = parseFloat(v);
      if (m && isFinite(n)) state[m[1]][m[2]][+m[3] - 1] = n;
    });

    const help = {
      rev: `Revenue grows each year at the revenue growth below, from fiscal ${P.fy}'s, which is from the 10-K.`,
      g: "Revenue growth in each year, in percent. Enter your own.",
      ni: byGrowth ? `Net income grows each year at the net income growth below, from fiscal ${P.fy}'s.` : "Revenue times the net margin below.",
      n: byGrowth ? "Net income growth in each year, in percent. Enter your own." : "The change in net income from the year before. Left blank after a loss.",
      m: byGrowth ? "Net income as a percent of revenue, from the two rows above." : `Net income as a percent of revenue. ${P.name} made a loss in fiscal ${P.fy}, so net income can't grow from it: enter a net margin for each year instead.`,
      eps: `Net income over today's diluted share count, ${Math.round(A.shares).toLocaleString("en-US")} million, held level. Fiscal ${P.fy}'s is the 10-K's diluted earnings per share.`,
      lo: "Your low estimate of the price-to-earnings multiple: the price a share might fetch for each dollar of that year's earnings. Enter your own.",
      hi: "Your high estimate of the price-to-earnings multiple. Enter your own.",
      plo: "Earnings per share times the low P/E estimate.",
      phi: "Earnings per share times the high P/E estimate.",
      clo: px ? `Compound annual growth rate: the yearly change from the last close, ${price(px.close)} on ${longDate(px.date)}, to the low share price by the end of that fiscal year. Left blank less than a year ahead.` : "Needs a last close.",
      chi: "The same for the high share price.",
    };
    const q = k => `<button type="button" class="q" aria-label="${esc(help[k])}" data-k="${k}">?</button>`;
    const row = (k, label, cls = "") => `<tr${cls ? ` class="${cls}"` : ""}><th scope="row">${label} ${q(k)}</th>`;
    const inputs = (c, f, label, step) => Array.from({length: YEARS}, (_, i) =>
      `<td><input type="number" step="${step}" placeholder="Enter value" data-c="${c}" data-f="${f}" data-i="${i}" aria-label="${esc(`${P.cases[c].label}, ${label}, ${fy(P.years[i])}`)}"></td>`).join("");
    const outs = (c, k) => Array.from({length: YEARS}, (_, i) => `<td data-c="${c}" data-o="${k}" data-i="${i}">—</td>`).join("");
    const table = c => `
      <div class="proj-case ${c}">
        <h3><span class="chip">${esc(P.cases[c].label)}</span></h3>
        <div class="tbl"><table class="proj-t">
          <thead><tr><th scope="col">Fiscal year</th><th scope="col" class="act">${fy(P.fy)}<small>actual</small></th>${P.years.map(y => `<th scope="col">${fy(y)}</th>`).join("")}</tr></thead>
          <tbody>
            ${row("rev", "Revenue")}<td class="act">${big(A.revenue)}</td>${outs(c, "rev")}</tr>
            ${row("g", "Revenue growth (%)", "in")}<td class="act">${pct(A.revenue_growth)}</td>${inputs(c, "g", "revenue growth, %", 0.5)}</tr>
            ${row("ni", "Net income", "gap")}<td class="act">${big(A.net_income)}</td>${outs(c, "ni")}</tr>
            ${byGrowth
              ? `${row("n", "Net income growth (%)", "in")}<td class="act">${pct(A.net_income_growth)}</td>${inputs(c, "n", "net income growth, %", 0.5)}</tr>
            ${row("m", "Net margin")}<td class="act">${pct(A.margin)}</td>${outs(c, "m")}</tr>`
              : `${row("n", "Net income growth")}<td class="act">${pct(A.net_income_growth)}</td>${outs(c, "nig")}</tr>
            ${row("m", "Net margin (%)", "in")}<td class="act">${pct(A.margin)}</td>${inputs(c, "m", "net margin, %", 0.1)}</tr>`}
            ${row("eps", "EPS", "gap")}<td class="act">${eps(A.eps)}</td>${outs(c, "eps")}</tr>
            ${row("lo", "P/E low estimate (×)", "in gap")}<td class="act"></td>${inputs(c, "lo", "low P/E estimate", 0.5)}</tr>
            ${row("hi", "P/E high estimate (×)", "in")}<td class="act"></td>${inputs(c, "hi", "high P/E estimate", 0.5)}</tr>
            ${row("plo", "Share price low", "px gap")}<td class="act"></td>${outs(c, "plo")}</tr>
            ${row("phi", "Share price high", "px")}<td class="act"></td>${outs(c, "phi")}</tr>
            ${row("clo", "CAGR low", "px gap")}<td class="act"></td>${outs(c, "clo")}</tr>
            ${row("chi", "CAGR high", "px")}<td class="act"></td>${outs(c, "chi")}</tr>
          </tbody></table></div>
      </div>`;
    box.innerHTML = `
      <p class="proj-notes">Enter ${byGrowth ? "revenue growth, net income growth" : "revenue growth, a net margin"} and a low and a high P/E estimate for each year of each case; the rest is worked out as you type. Earnings per share are net income over today's diluted share count, held level.${byGrowth ? "" : ` ${esc(P.name)} made a loss in fiscal ${P.fy}, so net income can't grow from it: enter a net margin for each year instead.`}</p>
      ${reference(P)}
      ${CASES.map(table).join("")}
      <figure class="proj-fig"><figcaption><div class="t">Share price projections</div>
        <div class="n">US$ per share at the end of each fiscal year. Each case's bar runs from its low to its high share price, and the diamond marks the middle.${px ? " The dashed line is the last close." : ""}</div></figcaption>
        <div id="c-proj"></div>
        <div class="legend">${CASES.map(c => `<span><i class="line ${c}"></i>${esc(P.cases[c].label)}</span>`).join("")}</div></figure>
      <div class="note"><b>How the projections work.</b> Each year, revenue grows at that year's revenue growth and ${byGrowth ? "net income at its net income growth, which together give the net margin" : "net income is revenue times the net margin"}; earnings per share are net income over today's diluted share count. The low and high P/E estimates turn each year's earnings per share into a low and a high share price, and the CAGR is the yearly change from the last close those prices would mean. Every projected figure is the one you enter; the latest fiscal year is from the 10-K. The results are the arithmetic of your figures: not a forecast, a price target or a recommendation.</div>`;

    const cells = [...box.querySelectorAll("input[data-c]")];
    const fill = () => cells.forEach(x => { const v = state[x.dataset.c][x.dataset.f][+x.dataset.i]; x.value = v == null ? "" : v; });
    const ends = P.ends.map(day), close = px ? px.close : null, closeDay = px ? day(px.date) : null;
    let ranges = {};   // each case's low and high share prices and CAGRs, for the chart
    function run() {
      CASES.forEach(c => {
        const S = state[c], out = {}, R = ranges[c] = {lo: [], hi: [], clo: [], chi: []};
        let rev = A.revenue, ni0 = A.net_income;
        for (let i = 0; i < YEARS; i++) {
          rev = rev == null || S.g[i] == null ? null : rev * (1 + S.g[i] / 100);
          const ni = byGrowth ? (ni0 == null || S.n[i] == null ? null : ni0 * (1 + S.n[i] / 100))
                              : (rev == null || S.m[i] == null ? null : rev * S.m[i] / 100);
          const nig = ni != null && ni0 != null && ni0 > 0 ? (ni / ni0 - 1) * 100 : null;
          const margin = ni != null && rev ? ni / rev * 100 : null;
          const e = ni == null || !A.shares ? null : ni / A.shares;
          const lo = e != null && e > 0 && S.lo[i] > 0 ? e * S.lo[i] : null, hi = e != null && e > 0 && S.hi[i] > 0 ? e * S.hi[i] : null;
          const years = closeDay ? (ends[i] - closeDay) / (365.25 * 864e5) : 0;
          const cagr = p => p != null && close > 0 && years >= 1 ? (Math.pow(p / close, 1 / years) - 1) * 100 : null;
          R.lo[i] = lo; R.hi[i] = hi; R.clo[i] = cagr(lo); R.chi[i] = cagr(hi);
          out[i] = {rev: big(rev), ni: big(ni), nig: pct(nig), m: pct(margin), eps: eps(e), plo: price(lo), phi: price(hi),
                    clo: R.clo[i] == null ? "" : pct(R.clo[i]), chi: R.chi[i] == null ? "" : pct(R.chi[i])};
          ni0 = ni;
        }
        box.querySelectorAll(`td[data-c="${c}"]`).forEach(td => { td.textContent = out[+td.dataset.i][td.dataset.o]; });
      });
      chart();
      // what the reader entered goes in the address
      const diff = {};
      CASES.forEach(c => FIELDS.forEach(f => state[c][f].forEach((v, i) => {
        if (v !== defaults[c][f][i] && v != null) diff[`${c}_${f}${i + 1}`] = v;
      })));
      FD.share.write("pe", diff);
    }
    // the chart under the tables: each case's range of share prices by year, against the last close
    function chart() {
      const host = $("c-proj");
      if (!host || !host.clientWidth) return;
      const top = Math.max(close || 0, ...CASES.flatMap(c => ranges[c].hi.filter(v => v != null)));
      if (!CASES.some(c => ranges[c].hi.some(v => v != null))) {
        host.innerHTML = '<p class="proj-empty">Enter values in the tables above to see each case’s share prices here.</p>';
        return;
      }
      const raw = top / 5, mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const step = [1, 2, 2.5, 5, 10].map(k => k * mag).find(s => s >= raw);
      FD.ranges(host, {
        years: P.years, step, fmt: v => "$" + v.toLocaleString("en-US"),
        series: CASES.map(c => ({color: COLOR[c], lo: ranges[c].lo, hi: ranges[c].hi})),
        ref: close ? {value: close, label: `Last close ${price(close)}`} : null,
        aria: `Projected share price ranges for ${P.name}'s bull, base and bear cases, fiscal ${P.years[0]} to ${P.years[YEARS - 1]}`,
        title: i => fy(P.years[i]),
        rows: i => CASES.map(c => {
          const R = ranges[c];
          const range = R.lo[i] == null ? "—" : `${price(R.lo[i])}–${price(R.hi[i])}`;
          const g = R.clo[i] == null ? "" : ` (${pct(R.clo[i])} to ${pct(R.chi[i])} CAGR)`;
          return [COLOR[c], P.cases[c].label, range + g];
        }),
      });
    }
    cells.forEach(x => x.addEventListener("input", () => {
      const n = parseFloat(x.value);
      state[x.dataset.c][x.dataset.f][+x.dataset.i] = isFinite(n) ? n : null;
      run();
    }));
    tips(box, help);
    fill(); run();
    FD.draw(chart);
    return {chart, reset() { CASES.forEach(c => FIELDS.forEach(f => { state[c][f] = defaults[c][f].slice(); })); fill(); run(); }};
  }

  // the DCF model, laid out like the P/E model. The reader's figures are revenue growth and free cash flow growth for
  // each year, and a discount rate and a growth rate after year five for each case; free cash flow grows from the
  // latest fiscal year's. A company whose free cash flow was negative can't grow it, so there the reader gives a free
  // cash flow margin for each year instead. Each year's cash flow is discounted from the end of the latest fiscal year;
  // the years after the fifth are valued as the fifth year's cash flow growing for ever at the reader's rate
  function renderDcf(P, box) {
    const A = P.actual, D = P.dcf, px = P.price, Y5 = P.years[YEARS - 1];
    const fy = y => "FY" + y;
    const byGrowth = D.fcf != null && D.fcf > 0;
    const keys = CASES.flatMap(c => DCF_YEARLY.flatMap(f => [1, 2, 3, 4, 5].map(i => `${c}_${f}${i}`)).concat(DCF_ONCE.map(f => `${c}_${f}`)));
    const blank = () => ({g: Array(YEARS).fill(null), f: Array(YEARS).fill(null), r: null, t: null});
    const state = {};
    CASES.forEach(c => { state[c] = blank(); });   // every box starts empty
    Object.entries(FD.share.read("dcf", keys)).forEach(([k, v]) => {
      const n = parseFloat(v), y = /^(bull|base|bear)_(g|f)([1-5])$/.exec(k), o = /^(bull|base|bear)_(r|t)$/.exec(k);
      if (!isFinite(n)) return;
      if (y) state[y[1]][y[2]][+y[3] - 1] = n;
      else if (o) state[o[1]][o[2]] = n;
    });
    const cashDate = D.net_cash_date ? longDate(D.net_cash_date) : "";
    const help = {
      rev: `Revenue grows each year at the revenue growth below, from fiscal ${P.fy}'s, which is from the 10-K.`,
      g: "Revenue growth in each year, in percent. Enter your own.",
      fcf: byGrowth ? `Free cash flow, cash from operations minus capital spending, grows each year at the free cash flow growth below, from fiscal ${P.fy}'s.`
                    : "Revenue times the free cash flow margin below.",
      f: byGrowth ? "Free cash flow growth in each year, in percent. Enter your own."
                  : `Free cash flow as a percent of revenue. ${P.name}'s free cash flow was negative in fiscal ${P.fy}, so it can't grow from it: enter a margin for each year instead.`,
      x: byGrowth ? "Free cash flow as a percent of revenue, from the two rows above." : "The change in free cash flow from the year before. Left blank after a negative year.",
      pv: `That year's free cash flow worth today: discounted at the case's discount rate for each year from the end of fiscal ${P.fy}.`,
      r: "The discount rate: the yearly return you would ask for to wait for this cash, in percent. A higher rate makes future cash worth less today. Enter your own.",
      t: `How fast free cash flow grows each year after fiscal ${Y5}, for ever, in percent. It has to be below the discount rate. Enter your own.`,
      s5: `The five years' cash flow worth today, added up.`,
      tv: `Every year after fiscal ${Y5}: fiscal ${Y5}'s free cash flow growing at the rate above, valued at the end of fiscal ${Y5} and discounted to today. Often most of the total.`,
      nc: `Cash and short-term investments minus debt and leases on ${cashDate}, from the latest filing. A negative figure is net debt.`,
      eq: "The cash flows worth today plus net cash: what the whole company is worth to its shareholders on these figures.",
      vps: `The equity value over today's diluted share count, ${Math.round(A.shares).toLocaleString("en-US")} million.`,
      vs: px ? `The value per share against the last close, ${price(px.close)} on ${longDate(px.date)}.` : "Needs a last close.",
    };
    const q = k => `<button type="button" class="q" aria-label="${esc(help[k])}" data-k="${k}">?</button>`;
    const row = (k, label, cls = "") => `<tr${cls ? ` class="${cls}"` : ""}><th scope="row">${label} ${q(k)}</th>`;
    const inputs = (c, f, label, step) => Array.from({length: YEARS}, (_, i) =>
      `<td><input type="number" step="${step}" placeholder="Enter value" data-c="${c}" data-f="${f}" data-i="${i}" aria-label="${esc(`${P.cases[c].label}, ${label}, ${fy(P.years[i])}`)}"></td>`).join("");
    const once = (c, f, label) => `<input type="number" step="0.5" placeholder="Enter value" data-c="${c}" data-f="${f}" aria-label="${esc(`${P.cases[c].label}, ${label}`)}">`;
    const outs = (c, k) => Array.from({length: YEARS}, (_, i) => `<td data-c="${c}" data-o="${k}" data-i="${i}">—</td>`).join("");
    const sum = (c, k) => `<td data-c="${c}" data-s="${k}">—</td>`;
    const table = c => `
      <div class="proj-case ${c}">
        <h3><span class="chip">${esc(P.cases[c].label)}</span></h3>
        <div class="tbl"><table class="proj-t">
          <thead><tr><th scope="col">Fiscal year</th><th scope="col" class="act">${fy(P.fy)}<small>actual</small></th>${P.years.map(y => `<th scope="col">${fy(y)}</th>`).join("")}</tr></thead>
          <tbody>
            ${row("rev", "Revenue")}<td class="act">${big(A.revenue)}</td>${outs(c, "rev")}</tr>
            ${row("g", "Revenue growth (%)", "in")}<td class="act">${pct(A.revenue_growth)}</td>${inputs(c, "g", "revenue growth, %", 0.5)}</tr>
            ${row("fcf", "Free cash flow", "gap")}<td class="act">${big(D.fcf)}</td>${outs(c, "fcf")}</tr>
            ${byGrowth
              ? `${row("f", "Free cash flow growth (%)", "in")}<td class="act">${pct(D.fcf_growth)}</td>${inputs(c, "f", "free cash flow growth, %", 0.5)}</tr>
            ${row("x", "Free cash flow margin")}<td class="act">${pct(D.fcf_margin)}</td>${outs(c, "x")}</tr>`
              : `${row("x", "Free cash flow growth")}<td class="act">${pct(D.fcf_growth)}</td>${outs(c, "x")}</tr>
            ${row("f", "Free cash flow margin (%)", "in")}<td class="act">${pct(D.fcf_margin)}</td>${inputs(c, "f", "free cash flow margin, %", 0.1)}</tr>`}
            ${row("pv", "Worth today", "px gap")}<td class="act"></td>${outs(c, "pv")}</tr>
          </tbody></table></div>
        <div class="tbl"><table class="proj-t proj-sum">
          <tbody>
            ${row("r", "Discount rate (%)", "in")}<td>${once(c, "r", "discount rate, %")}</td></tr>
            ${row("t", `Growth after ${fy(Y5)} (%)`, "in")}<td>${once(c, "t", `growth after ${fy(Y5)}, %`)}</td></tr>
            ${row("s5", "Five years' cash, worth today", "gap")}${sum(c, "s5")}</tr>
            ${row("tv", `After ${fy(Y5)}, worth today`)}${sum(c, "tv")}</tr>
            ${row("nc", "Net cash")}<td>${big(D.net_cash)}</td></tr>
            ${row("eq", "Equity value", "gap")}${sum(c, "eq")}</tr>
            ${row("vps", "Value per share", "px")}${sum(c, "vps")}</tr>
            ${row("vs", "Against the last close", "px")}${sum(c, "vs")}</tr>
          </tbody></table></div>
      </div>`;
    const avg = D.fcf_margin_avg ? `its free cash flow margin averaged ${pct(D.fcf_margin_avg[0])} over the last ${D.fcf_margin_avg[1] > 1 ? D.fcf_margin_avg[1] + " years" : "year"}` : "";
    const ref = [P.growth ? `${esc(P.name)}'s revenue grew ${pct(P.growth[0])} a year over the last ${P.growth[1] > 1 ? P.growth[1] + " years" : "year"}` : "", avg].filter(Boolean);
    box.innerHTML = `
      <p class="proj-notes">Enter ${byGrowth ? "revenue growth and free cash flow growth" : "revenue growth and a free cash flow margin"} for each year of each case, and a discount rate and a growth rate after ${fy(Y5)} for each case; the rest is worked out as you type.${byGrowth ? "" : ` ${esc(P.name)}'s free cash flow was negative in fiscal ${P.fy}, so it can't grow from it: enter a margin for each year instead.`}</p>
      ${ref.length ? `<p class="proj-ref"><b>For reference:</b> ${ref.join("; ")}.</p>` : ""}
      ${CASES.map(table).join("")}
      <figure class="proj-fig"><figcaption><div class="t">Value per share</div>
        <div class="n">US$ per share, each case's value on your figures.${px ? " The dashed line is the last close." : ""}</div></figcaption>
        <div id="c-dcf"></div></figure>
      <div class="note"><b>How the DCF works.</b> Each year, revenue grows at that year's revenue growth and ${byGrowth ? "free cash flow at its free cash flow growth" : "free cash flow is revenue times the free cash flow margin"}. Each year's free cash flow is discounted to today at the case's discount rate, and every year after ${fy(Y5)} is valued as ${fy(Y5)}'s free cash flow growing for ever at the rate you give. Their sum plus net cash is the equity value; divided by today's diluted share count, held level, it is the value per share. Every projected figure is the one you enter; the latest fiscal year is from the 10-K. The results are the arithmetic of your figures: not a forecast, a price target or a recommendation.</div>`;

    const cells = [...box.querySelectorAll("input[data-c]")];
    const get = x => x.dataset.i == null ? state[x.dataset.c][x.dataset.f] : state[x.dataset.c][x.dataset.f][+x.dataset.i];
    const fill = () => cells.forEach(x => { const v = get(x); x.value = v == null ? "" : v; });
    const close = px ? px.close : null;
    let values = {};   // each case's value per share, for the chart
    function run() {
      CASES.forEach(c => {
        const S = state[c], out = {}, r = S.r == null ? null : S.r / 100, tg = S.t == null ? null : S.t / 100;
        let rev = A.revenue, f0 = D.fcf, s5 = 0, full = true, last = null;
        for (let i = 0; i < YEARS; i++) {
          rev = rev == null || S.g[i] == null ? null : rev * (1 + S.g[i] / 100);
          const f = byGrowth ? (f0 == null || S.f[i] == null ? null : f0 * (1 + S.f[i] / 100))
                             : (rev == null || S.f[i] == null ? null : rev * S.f[i] / 100);
          const x = byGrowth ? (f != null && rev ? f / rev * 100 : null) : (f != null && f0 != null && f0 > 0 ? (f / f0 - 1) * 100 : null);
          const pv = f == null || r == null || r <= -1 ? null : f / Math.pow(1 + r, i + 1);
          if (pv == null) full = false; else s5 += pv;
          out[i] = {rev: big(rev), fcf: big(f), x: pct(x), pv: big(pv)};
          f0 = f; last = f;
        }
        const ok = full && r != null && tg != null && r > tg;
        const tv = ok ? last * (1 + tg) / (r - tg) / Math.pow(1 + r, YEARS) : null;
        const eq = ok && D.net_cash != null ? s5 + tv + D.net_cash : null;
        const vps = eq != null && A.shares ? eq / A.shares : null;
        values[c] = vps;
        const vs = vps != null && close ? (vps / close - 1) * 100 : null;
        const why = full && r != null && tg != null && r <= tg ? "The discount rate must be above the growth rate" : "—";
        const S5 = {s5: full ? big(s5) : "—", tv: ok ? big(tv) : why, eq: big(eq),
                    vps: vps == null ? "—" : (vps < 0 ? "−" : "") + "$" + Math.abs(vps).toFixed(2),
                    vs: vs == null ? "—" : pct(Math.abs(vs)) + (vs >= 0 ? " above" : " below")};
        box.querySelectorAll(`td[data-c="${c}"][data-o]`).forEach(td => { td.textContent = out[+td.dataset.i][td.dataset.o]; });
        box.querySelectorAll(`td[data-c="${c}"][data-s]`).forEach(td => { td.textContent = S5[td.dataset.s]; });
      });
      chart();
      const diff = {};
      CASES.forEach(c => {
        DCF_YEARLY.forEach(f => state[c][f].forEach((v, i) => { if (v != null) diff[`${c}_${f}${i + 1}`] = v; }));
        DCF_ONCE.forEach(f => { if (state[c][f] != null) diff[`${c}_${f}`] = state[c][f]; });
      });
      FD.share.write("dcf", diff);
    }
    // under the tables: each case's value per share as a bar, against the last close
    function chart() {
      const host = $("c-dcf");
      if (!host || !host.clientWidth) return;
      const shown = CASES.filter(c => values[c] != null);
      if (!shown.length) {
        host.innerHTML = '<p class="proj-empty">Enter values in the tables above to see each case’s value per share here.</p>';
        return;
      }
      const W = Math.max(300, Math.min(1100, host.clientWidth)), L = W < 480 ? 86 : 110, R = 90, rowH = 40, T = 8;
      const H = T + CASES.length * rowH + 22;
      const top = Math.max(close || 0, ...shown.map(c => values[c]), 0), lo = Math.min(0, ...shown.map(c => values[c]));
      const x = v => L + (v - lo) / ((top - lo) || 1) * (W - L - R);
      let svg = `<line class="zero" x1="${x(0)}" x2="${x(0)}" y1="${T}" y2="${H - 22}"/>`;
      CASES.forEach((c, i) => {
        const v = values[c], y = T + i * rowH;
        svg += `<text class="name" x="${L - 10}" y="${y + 24}" text-anchor="end">${esc(P.cases[c].label)}</text>`;
        if (v == null) { svg += `<text class="val" x="${x(0) + 6}" y="${y + 24}">—</text>`; return; }
        const a = Math.min(x(0), x(v)), w = Math.max(2, Math.abs(x(v) - x(0)));
        svg += `<rect x="${a}" y="${y + 9}" width="${w}" height="22" rx="4" fill="${COLOR[c]}"/>`
          + `<text class="val" x="${Math.max(x(v), x(0)) + 6}" y="${y + 24}">${(v < 0 ? "−" : "") + "$" + Math.abs(v).toFixed(2)}</text>`;
      });
      if (close) svg += `<line x1="${x(close)}" x2="${x(close)}" y1="${T}" y2="${H - 22}" stroke="var(--ink-2)" stroke-dasharray="4 4"/>`
        + `<text class="val" x="${x(close)}" y="${H - 6}" text-anchor="middle">Last close ${price(close)}</text>`;
      host.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart: ${esc(P.name)}'s value per share in the bull, base and bear cases${close ? ", against the last close" : ""}">${svg}</svg>`;
    }
    cells.forEach(x => x.addEventListener("input", () => {
      const n = parseFloat(x.value), v = isFinite(n) ? n : null;
      if (x.dataset.i == null) state[x.dataset.c][x.dataset.f] = v; else state[x.dataset.c][x.dataset.f][+x.dataset.i] = v;
      run();
    }));
    tips(box, help);
    fill(); run();
    FD.draw(chart);
    return {chart, reset() { CASES.forEach(c => { state[c] = blank(); }); fill(); run(); }};
  }
})();
