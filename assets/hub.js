/* The Filing Desk: companies hub. A sector and industry filter, cards for the largest companies, a sortable
   table of them all, a ranking chart and a scatter chart, all drawn from window.HUB. The page's HTML already
   holds the first cards and every table row as plain links; script filters, sorts and pages them. */
(function () {
  const ALL = window.HUB, base = document.currentScript.src.replace(/assets\/hub\.js.*$/, "");
  const CARDS = 9, ROWS = 25;
  const METRICS = {
    revenue: {label: "Revenue", money: true},
    revenue_growth: {label: "Revenue growth", pct: true},
    operating_margin: {label: "Operating margin", pct: true},
    net_margin: {label: "Net margin", pct: true},
    fcf_margin: {label: "Free cash flow margin", pct: true},
    roic: {label: "Return on capital", pct: true},
    roe: {label: "Return on equity", pct: true},
    shareholder_returns: {label: "Dividends and buybacks", money: true},
    net_debt_to_ebitda: {label: "Net debt to EBITDA", x: true},
  };
  const val = (c, k) => k === "revenue" ? c.rev : c.m[k];
  const minus = s => String(s).replace(/^-/, "−");
  const fmt = (k, v) => {
    if (v == null) return "—";
    const m = METRICS[k];
    if (m.money) return minus((Math.abs(v) >= 1000 ? "$" + (v / 1000).toFixed(1) + "B" : "$" + v.toFixed(0) + "M").replace("$-", "-$"));
    return minus(v.toFixed(1)) + (m.pct ? "%" : "x");
  };
  const esc = s => s.replace(/[&<>"]/g, ch => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[ch]));
  const link = c => base + "companies/" + c.t.toLowerCase() + "/";
  let sector = "", industry = "", rankKey = "revenue_growth", rankDir = "high", xKey = "revenue_growth", yKey = "operating_margin";
  const inSector = c => (!sector || c.s === sector) && (!industry || c.si === industry);
  const group = () => industry || sector;

  const tip = document.createElement("div");
  tip.className = "tip"; tip.hidden = true;
  document.body.appendChild(tip);
  function showTip(e, html) {
    tip.innerHTML = html; tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = e.clientX + 14, y = e.clientY - h - 10;
    if (x + w > innerWidth - 8) x = e.clientX - w - 14;
    if (y < 8) y = e.clientY + 16;
    tip.style.left = Math.max(8, x) + "px"; tip.style.top = y + "px";
  }
  const hideTip = () => { tip.hidden = true; };

  /* ----------------------------------------------------------- filter */
  const industryBox = document.querySelector(".industry"), industrySel = document.getElementById("industry");
  function industries() {
    const n = {};
    ALL.filter(c => c.s === sector && c.si).forEach(c => { n[c.si] = (n[c.si] || 0) + 1; });
    const total = ALL.filter(c => c.s === sector).length;
    industrySel.innerHTML = `<option value="">All industries (${total})</option>`
      + Object.keys(n).sort().map(k => `<option value="${esc(k)}">${esc(k)} (${n[k]})</option>`).join("");
    industryBox.hidden = !sector || Object.keys(n).length < 2;
  }
  function refilter() { drawCards(); shown = ROWS; drawTable(); drawRank(); drawScatter(); }
  document.querySelectorAll(".chips button").forEach(b => b.addEventListener("click", () => {
    sector = b.dataset.sector; industry = "";
    document.querySelectorAll(".chips button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    industries(); refilter();
  }));
  industrySel.addEventListener("change", () => { industry = industrySel.value; refilter(); });

  /* ----------------------------------------------------------- cards: the largest companies in the group */
  const cardsHost = document.querySelector(".cards");
  const pct = v => v == null ? "—" : minus(v.toFixed(1)) + "%";
  const chip = v => v == null ? "" : Math.abs(v) < 0.05 ? `<span class="chg flat">flat</span>`
    : `<span class="chg ${v >= 0 ? "up" : "down"}">${Math.abs(v).toFixed(1)}%</span>`;
  function spark(vs) {
    const pts = vs.map((v, i) => [i, v]).filter(p => p[1] != null);
    if (pts.length < 2) return "";
    const lo = Math.min(...pts.map(p => p[1])), hi = Math.max(...pts.map(p => p[1])), n = vs.length - 1;
    const xy = pts.map(([i, v]) => `${(i / n * 100).toFixed(1)},${(28 - (v - lo) / ((hi - lo) || 1) * 24).toFixed(1)}`).join(" ");
    return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" role="img" aria-label="Revenue trend over ${vs.length} years">`
      + `<polyline points="${xy}" fill="none" stroke="var(--s1)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }
  function card(c) {
    const m = c.m, rev = ["Revenue", fmt("revenue", c.rev) + chip(m.revenue_growth)];
    const stats = c.bank ? [rev, ["ROE", pct(m.roe)], ["Efficiency", pct(m.efficiency_ratio)]]
      : [rev, m.operating_margin != null ? ["Op. margin", pct(m.operating_margin)] : ["Net margin", pct(m.net_margin)], ["FCF margin", pct(m.fcf_margin)]];
    return `<a class="card" href="${link(c)}"><div class="card-top"><span class="card-name">${esc(c.n)}</span><span class="card-tk">${c.t}</span></div>`
      + `<div class="card-sector">${esc(c.si || c.s)}</div>${spark(c.rs)}<dl class="card-stats">`
      + stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("") + `</dl></a>`;
  }
  function drawCards() { cardsHost.innerHTML = ALL.filter(inSector).slice(0, CARDS).map(card).join(""); }

  /* ----------------------------------------------------------- the table of every company */
  const table = document.getElementById("all"), tbody = table.tBodies[0];
  const rowOf = Object.fromEntries([...tbody.rows].map(r => [r.dataset.t, r]));
  const countEl = document.getElementById("all-count"), moreBtn = document.getElementById("all-more");
  const titleEl = document.getElementById("all-title");
  let sortKey = "rev", sortDir = -1, shown = ROWS;
  const sortVal = (c, k) => k === "n" ? c.n : k === "si" ? (c.si || c.s) : k === "rev" ? c.rev : c.m[k];
  function drawTable() {
    const rows = ALL.filter(inSector).sort((a, b) => {
      const x = sortVal(a, sortKey), y = sortVal(b, sortKey);
      if (x == null || y == null) return (x == null) - (y == null);    // blanks last, whichever way round
      return (typeof x === "string" ? x.localeCompare(y) : x - y) * sortDir || b.rev - a.rev;
    });
    const keep = new Set(rows.map(c => c.t));
    Object.entries(rowOf).forEach(([t, r]) => { if (!keep.has(t)) r.hidden = true; });
    rows.forEach((c, i) => { const r = rowOf[c.t]; r.hidden = i >= shown; tbody.appendChild(r); });
    titleEl.textContent = group() ? `All ${rows.length} companies in ${group()}` : `All ${rows.length} companies`;
    countEl.textContent = rows.length > shown ? `Showing ${shown} of ${rows.length}` : `Showing all ${rows.length}`;
    moreBtn.hidden = rows.length <= shown;
    moreBtn.textContent = `Show ${Math.min(ROWS, rows.length - shown)} more`;
  }
  table.querySelectorAll("th button").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.k;
    sortDir = k === sortKey ? -sortDir : (k === "n" || k === "si" ? 1 : -1);   // names A to Z first, figures largest first
    sortKey = k;
    table.querySelectorAll("th").forEach(th => th.removeAttribute("aria-sort"));
    b.parentElement.setAttribute("aria-sort", sortDir > 0 ? "ascending" : "descending");
    drawTable();
  }));
  moreBtn.addEventListener("click", () => { shown += ROWS; drawTable(); });

  /* ----------------------------------------------------------- rankings */
  function niceStep(span) {
    const raw = Math.max(span, 1e-9) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
  }
  const rankHost = document.getElementById("rank");
  function drawRank() {
    const rows = ALL.filter(c => inSector(c) && val(c, rankKey) != null)
      .sort((a, b) => (val(b, rankKey) - val(a, rankKey)) * (rankDir === "high" ? 1 : -1)).slice(0, 10);
    const W = Math.max(300, Math.min(1160, rankHost.clientWidth || 860)), rowH = 30, T = 6;
    const L = W < 480 ? 104 : 150, R = 64, H = T + rows.length * rowH + 4;
    const vals = rows.map(c => val(c, rankKey));
    const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const x = v => L + (v - lo) / ((hi - lo) || 1) * (W - L - R);
    let s = `<line class="zero" x1="${x(0)}" x2="${x(0)}" y1="0" y2="${H}"/>`;
    rows.forEach((c, i) => {
      const v = val(c, rankKey), y = T + i * rowH, x0 = x(0), x1 = x(v), w = Math.abs(x1 - x0), r = Math.min(4, w / 2);
      const left = Math.min(x0, x1);
      // rounded only at the data end, square at the baseline
      const d = v >= 0
        ? `M${left},${y + 5}H${left + w - r}Q${left + w},${y + 5} ${left + w},${y + 5 + r}V${y + 21 - r}Q${left + w},${y + 21} ${left + w - r},${y + 21}H${left}Z`
        : `M${x0},${y + 5}H${left + r}Q${left},${y + 5} ${left},${y + 5 + r}V${y + 21 - r}Q${left},${y + 21} ${left + r},${y + 21}H${x0}Z`;
      const name = W < 480 && c.n.length > 13 ? c.n.slice(0, 12) + "…" : c.n;
      const vx = v >= 0 ? x1 + 6 : Math.max(x1 - 6, L + 2);
      s += `<g class="rank-row" data-i="${i}"><rect x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent"/>`
        + `<text class="name" x="${L - 10}" y="${y + 17}" text-anchor="end">${esc(name)}</text>`
        + `<path class="rank-bar" d="${d}" fill="var(--s1)"/>`
        + `<text class="val" x="${vx}" y="${y + 17}" text-anchor="${v >= 0 ? "start" : "end"}">${fmt(rankKey, v)}</text></g>`;
    });
    rankHost.innerHTML = rows.length
      ? `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart: ${rankDir === "high" ? "highest" : "lowest"} ${METRICS[rankKey].label.toLowerCase()}${group() ? " in " + group() : ""}, latest fiscal year">${s}</svg>`
      : `<p class="src">No company in this group reports this figure.</p>`;
    rankHost.querySelectorAll(".rank-row").forEach(g => {
      const c = rows[+g.dataset.i];
      g.addEventListener("click", () => { location.href = link(c); });
      g.addEventListener("pointermove", e => showTip(e, `<b>${esc(c.n)}</b><div class="row"><span>${METRICS[rankKey].label}</span><span>${fmt(rankKey, val(c, rankKey))}</span></div><div class="row"><span>Fiscal year</span><span>${c.fy}</span></div>`));
      g.addEventListener("pointerleave", hideTip);
    });
  }
  document.querySelectorAll("#rank-metric button").forEach(b => b.addEventListener("click", () => {
    rankKey = b.dataset.k;
    document.querySelectorAll("#rank-metric button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    drawRank();
  }));
  document.querySelectorAll("#rank-dir button").forEach(b => b.addEventListener("click", () => {
    rankDir = b.dataset.k;
    document.querySelectorAll("#rank-dir button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    drawRank();
  }));

  /* ----------------------------------------------------------- scatter */
  const scHost = document.getElementById("scatter");
  function domain(vals) {
    // 5th to 95th percentile, padded, so one extreme company doesn't flatten the rest
    const v = [...vals].sort((a, b) => a - b), q = p => v[Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))))];
    let lo = q(0.04), hi = q(0.96);
    const pad = (hi - lo || Math.abs(hi) || 1) * 0.12;
    lo -= pad; hi += pad;
    if (lo > 0 && lo < (hi - lo) * 0.6) lo = 0;
    if (hi < 0 && -hi < (hi - lo) * 0.6) hi = 0;
    const step = niceStep(hi - lo);
    return {lo: Math.floor(lo / step) * step, hi: Math.ceil(hi / step) * step, step};
  }
  function drawScatter() {
    const pts = ALL.filter(c => val(c, xKey) != null && val(c, yKey) != null);
    const W = Math.max(300, Math.min(1160, scHost.clientWidth || 860)), H = W < 480 ? 300 : 380;
    const L = 46, R = 14, T = 14, B = 38;
    if (pts.length < 3) { scHost.innerHTML = `<p class="src">Too few companies report both figures.</p>`; return; }
    const dx = domain(pts.map(c => val(c, xKey))), dy = domain(pts.map(c => val(c, yKey)));
    const X = v => L + (Math.min(Math.max(v, dx.lo), dx.hi) - dx.lo) / (dx.hi - dx.lo) * (W - L - R);
    const Y = v => T + (1 - (Math.min(Math.max(v, dy.lo), dy.hi) - dy.lo) / (dy.hi - dy.lo)) * (H - T - B);
    const maxRev = Math.max(...pts.map(c => c.rev || 0));
    const rad = c => 4 + 9 * Math.sqrt((c.rev || 0) / maxRev);
    const tick = (k, v) => minus(+v.toFixed(dx.step < 1 || dy.step < 1 ? 1 : 0)) + (METRICS[k].pct ? "%" : METRICS[k].x ? "x" : "");
    let s = "";
    for (let k = Math.round(dy.lo / dy.step); k <= Math.round(dy.hi / dy.step); k++) {
      const v = +(k * dy.step).toPrecision(12);
      s += `<line class="${v === 0 ? "base" : "grid"}" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${tick(yKey, v)}</text>`;
    }
    for (let k = Math.round(dx.lo / dx.step); k <= Math.round(dx.hi / dx.step); k++) {
      const v = +(k * dx.step).toPrecision(12);
      s += `<line class="${v === 0 ? "base" : "grid"}" x1="${X(v)}" x2="${X(v)}" y1="${T}" y2="${H - B}"/><text x="${X(v)}" y="${H - B + 16}" text-anchor="middle">${tick(xKey, v)}</text>`;
    }
    s += `<text x="${W - R}" y="${H - 4}" text-anchor="end">${METRICS[xKey].label} →</text>`;
    s += `<text x="${L + 4}" y="${T + 10}">↑ ${METRICS[yKey].label}</text>`;
    // context first (other sectors, grey), then the highlighted group on top, biggest first
    const order = [...pts].sort((a, b) => (inSector(a) - inSector(b)) || (b.rev - a.rev));
    order.forEach(c => {
      const vx = val(c, xKey), vy = val(c, yKey);
      const off = vx < dx.lo || vx > dx.hi || vy < dy.lo || vy > dy.hi;
      const on = inSector(c);
      s += `<circle class="dot${on ? "" : " off"}" data-t="${c.t}" cx="${X(vx)}" cy="${Y(vy)}" r="${rad(c)}" fill="${on ? (off ? "var(--sheet)" : "var(--s1)") : ""}"${off && on ? ` style="stroke:var(--s1);stroke-width:2"` : ""}/>`;
    });
    // direct labels for the largest highlighted companies, skipping any that would collide
    const placed = [];
    pts.filter(inSector).sort((a, b) => b.rev - a.rev).slice(0, sector ? 9 : 10).forEach(c => {
      const px = X(val(c, xKey)) + rad(c) + 3, py = Y(val(c, yKey)) + 4;
      if (px > W - 40 || placed.some(([a, b]) => Math.abs(a - px) < 44 && Math.abs(b - py) < 13)) return;
      placed.push([px, py]);
      s += `<text class="lab" x="${px}" y="${py}" pointer-events="none">${c.t}</text>`;
    });
    scHost.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Scatter chart: ${METRICS[xKey].label} against ${METRICS[yKey].label}, one dot per company, sized by revenue">${s}</svg>`;
    scHost.querySelectorAll(".dot").forEach(d => {
      const c = ALL.find(x => x.t === d.dataset.t);
      d.addEventListener("click", () => { location.href = link(c); });
      d.addEventListener("pointermove", e => showTip(e, `<b>${esc(c.n)} · ${c.t}</b>`
        + `<div class="row"><span>${METRICS[xKey].label}</span><span>${fmt(xKey, val(c, xKey))}</span></div>`
        + `<div class="row"><span>${METRICS[yKey].label}</span><span>${fmt(yKey, val(c, yKey))}</span></div>`
        + `<div class="row"><span>Revenue, FY${String(c.fy).slice(2)}</span><span>${fmt("revenue", c.rev)}</span></div>`));
      d.addEventListener("pointerleave", hideTip);
    });
  }
  const selX = document.getElementById("sc-x"), selY = document.getElementById("sc-y");
  selX.value = xKey; selY.value = yKey;
  selX.addEventListener("change", () => { xKey = selX.value; drawScatter(); });
  selY.addEventListener("change", () => { yKey = selY.value; drawScatter(); });

  drawTable(); drawRank(); drawScatter();
  let w = innerWidth, t;
  addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => { if (innerWidth !== w) { w = innerWidth; hideTip(); drawRank(); drawScatter(); } }, 150);
  });
})();
