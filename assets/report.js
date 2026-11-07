/* The Filing Desk: chart and table helpers for report pages.
   Charts are inline SVG drawn to the width of their container, with a
   per-period hover/tap tooltip. Colors come from CSS tokens. `years` are fiscal years unless a chart
   passes `xlab` (axis label for period i; `short` when space is tight, `tiny` when very tight) and `title`
   (tooltip heading: a string, or [heading, smaller note]).
   Every label, value and description the callers pass is text: it is escaped before it goes into the page, and
   a color must be a plain CSS color, so a chart script can't add markup or load anything. */
(function () {
  const FD = {};
  const tip = document.createElement("div");
  tip.className = "tip"; tip.hidden = true;
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(tip));

  FD.bn = v => (v / 1000).toLocaleString("en-US", {minimumFractionDigits: 1, maximumFractionDigits: 1});
  FD.sbn = v => (v < 0 ? "−" : "") + FD.bn(Math.abs(v));
  FD.pct = (a, b) => a / b * 100;
  FD.minus = s => String(s).replace(/^-/, "−");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
  const col = c => /^(var\(--[\w-]+\)|#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/.test(String(c)) ? c : "currentColor";
  const heading = h => Array.isArray(h) ? esc(h[0]) + (h[1] ? ` <span class="tip-sub">${esc(h[1])}</span>` : "") : esc(h);

  function topPath(x0, x1, yTop, yBase, r) {
    const h = yBase - yTop; r = Math.max(0, Math.min(r, h, (x1 - x0) / 2));
    return `M${x0},${yBase}V${yTop + r}Q${x0},${yTop} ${x0 + r},${yTop}H${x1 - r}Q${x1},${yTop} ${x1},${yTop + r}V${yBase}Z`;
  }
  const widthOf = host => Math.round(Math.max(340, Math.min(1100, host.clientWidth || 640)));

  const fyLab = years => (i, short) => (short ? "’" : "FY") + String(years[i]).slice(2);
  const barW = band => Math.min(24, Math.max(6, band * 0.62));

  function frame(years, {W, H = 250, L = 44, R = 14, T = 16, B = 28, max, min = 0, step, fmt, xlab}) {
    const N = years.length;
    const top = Math.max(step, Math.ceil(max / step) * step);
    const bottom = Math.min(0, Math.floor(min / step) * step);
    const y = v => T + (H - T - B) * (top - v) / (top - bottom);
    const band = (W - L - R) / N;
    const cx = i => L + band * (i + 0.5);
    const short = band < 38;
    let s = "";
    for (let k = Math.round(bottom / step); k <= Math.round(top / step); k++) {
      const v = +(k * step).toPrecision(12);
      s += `<line class="${v === 0 ? "base" : "grid"}" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`;
      s += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${esc(fmt(v))}</text>`;
    }
    const lab = xlab || fyLab(years);
    years.forEach((_, i) => {
      s += `<text x="${cx(i)}" y="${H - B + 18}" text-anchor="middle">${esc(lab(i, short, band < 22))}</text>`;
    });
    const bands = years.map((_, i) => `<rect class="band" data-i="${i}" x="${L + band * i + 2}" y="${T}" width="${band - 4}" height="${H - T - B}"/>`).join("");
    const hits = years.map((_, i) => `<rect class="hit" data-i="${i}" x="${L + band * i}" y="0" width="${band}" height="${H}"/>`).join("");
    return {W, H, L, R, T, B, N, y, band, cx, grid: s, bands, hits};
  }

  function wire(host, years, rowsFor, title) {
    const svg = host.querySelector("svg");
    const show = (e, i) => {
      svg.querySelectorAll(".band").forEach(b => b.classList.toggle("on", +b.dataset.i === i));
      svg.querySelectorAll(".xhair").forEach(x => { x.classList.add("on"); x.setAttribute("x1", x.dataset["x" + i]); x.setAttribute("x2", x.dataset["x" + i]); });
      tip.innerHTML = `<b>${title ? heading(title(i)) : "Fiscal " + esc(years[i])}</b>` + rowsFor(i).map(([c, k, v]) =>
        `<div class="row"><span>${c ? `<i style="background:${col(c)}"></i>` : ""}${esc(k)}</span><span>${esc(v)}</span></div>`).join("");
      tip.hidden = false;
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let x = e.clientX + 14, yy = e.clientY - h - 10;
      if (x + w > window.innerWidth - 8) x = e.clientX - w - 14;
      if (yy < 8) yy = e.clientY + 16;
      tip.style.left = Math.max(8, x) + "px"; tip.style.top = yy + "px";
    };
    const hide = () => {
      tip.hidden = true;
      svg.querySelectorAll(".band").forEach(b => b.classList.remove("on"));
      svg.querySelectorAll(".xhair").forEach(x => x.classList.remove("on"));
    };
    svg.querySelectorAll(".hit").forEach(r => {
      r.addEventListener("pointermove", e => show(e, +r.dataset.i));
      r.addEventListener("pointerdown", e => show(e, +r.dataset.i));
      r.addEventListener("pointerleave", hide);
    });
  }

  /* single-series columns; values already in display units */
  FD.columns = (host, {years, values, step, fmt = v => v, color = "var(--s1)", negColor = "var(--down)", labels = [], labelFmt = i => values[i], aria, rows, xlab, title}) => {
    color = col(color); negColor = col(negColor);
    const known = values.filter(v => v != null);
    const f = frame(years, {W: widthOf(host), max: Math.max(0, ...known), min: Math.min(0, ...known), step, fmt, xlab});
    const w = barW(f.band);
    let marks = "";
    values.forEach((v, i) => {
      if (v == null) return;
      const x0 = f.cx(i) - w / 2;
      marks += v >= 0 ? `<path d="${topPath(x0, x0 + w, f.y(v), f.y(0), 4)}" fill="${color}"/>`
                      : `<rect x="${x0}" y="${f.y(0)}" width="${w}" height="${f.y(v) - f.y(0)}" fill="${negColor}"/>`;
    });
    labels.forEach(i => { marks += `<text class="lab" x="${f.cx(i)}" y="${f.y(values[i]) - 7}" text-anchor="middle">${esc(labelFmt(i))}</text>`; });
    host.innerHTML = `<svg class="chart" viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="${esc(aria)}">${f.bands}${f.grid}${marks}${f.hits}</svg>`;
    wire(host, years, rows, title);
  };

  /* two or more series as columns side by side in each period; values already in display units. A series' negative
     values (a loss) take its negColor, or --down. A series with axis: "right" is read on a second axis at the right,
     with its own step (rstep) and labels (rfmt): both axes put zero on the same line and use the same gridlines, so a
     loss on either side sits below the one baseline */
  FD.grouped = (host, {years, series, step, rstep, fmt = v => v, rfmt = v => v, aria, rows, xlab, title}) => {
    const side = s => s.axis === "right" ? "R" : "L";
    const vals = k => series.filter(s => side(s) === k).flatMap(s => s.values).filter(v => v != null);
    const L = vals("L"), Rv = vals("R"), dual = Rv.length > 0 && rstep;
    // gridlines above and below zero, enough for both axes
    const up = Math.max(1, Math.ceil(Math.max(0, ...L) / step), dual ? Math.ceil(Math.max(0, ...Rv) / rstep) : 0);
    const down = Math.max(0, Math.ceil(-Math.min(0, ...L) / step), dual ? Math.ceil(-Math.min(0, ...Rv) / rstep) : 0);
    const f = frame(years, {W: widthOf(host), max: up * step, min: -down * step, step, fmt, xlab, R: dual ? 56 : 14});
    const yOf = s => side(s) === "R" ? v => f.y(v * step / rstep) : f.y;
    const n = series.length, gap = 2, w = Math.min(18, Math.max(4, (f.band * 0.7 - gap * (n - 1)) / n));
    let marks = "";
    if (dual) for (let k = -down; k <= up; k++) {
      const v = +(k * rstep).toPrecision(12);
      marks += `<text class="r-axis" x="${f.W - f.R + 8}" y="${f.y(k * step) + 4}" text-anchor="start">${esc(rfmt(v))}</text>`;
    }
    series.forEach((s, k) => {
      const color = col(s.color || "var(--s1)"), neg = col(s.negColor || "var(--down)"), y = yOf(s);
      s.values.forEach((v, i) => {
        if (v == null) return;
        const x0 = f.cx(i) - (n * w + (n - 1) * gap) / 2 + k * (w + gap);
        marks += v >= 0 ? `<path d="${topPath(x0, x0 + w, y(v), y(0), 3)}" fill="${color}"/>`
                        : `<rect x="${x0}" y="${y(0)}" width="${w}" height="${y(v) - y(0)}" fill="${neg}"/>`;
      });
    });
    host.innerHTML = `<svg class="chart" viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="${esc(aria)}">${f.bands}${f.grid}${marks}${f.hits}</svg>`;
    wire(host, years, rows, title);
  };

  /* line series on one axis, end dot and end label per series */
  FD.lines = (host, {years, series, max, min = 0, step, fmt, aria, rows, xlab, title}) => {
    const f = frame(years, {W: widthOf(host), max, min, step, fmt, R: 104, xlab});
    let marks = `<line class="xhair" y1="${f.T}" y2="${f.H - f.B}" ${years.map((_, i) => `data-x${i}="${f.cx(i)}"`).join(" ")}/>`;
    const ends = [];
    series.forEach(s => {
      s = {...s, color: col(s.color)};
      let run = [];
      const flush = () => {
        if (run.length > 1) marks += `<polyline points="${run.join(" ")}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
        if (run.length === 1) marks += `<circle cx="${run[0].split(",")[0]}" cy="${run[0].split(",")[1]}" r="2.5" fill="${s.color}"/>`;
        run = [];
      };
      s.values.forEach((v, i) => { if (v == null) flush(); else run.push(`${f.cx(i)},${f.y(v)}`); });
      flush();
      let li = s.values.length - 1;
      while (li >= 0 && s.values[li] == null) li--;
      if (li < 0) return;
      marks += `<circle cx="${f.cx(li)}" cy="${f.y(s.values[li])}" r="4" fill="${s.color}" stroke="var(--sheet)" stroke-width="2"/>`;
      if (s.end) ends.push({x: f.cx(li) + 10, y: f.y(s.values[li]) + 4, text: s.end});
    });
    ends.sort((a, b) => a.y - b.y);
    for (let k = 1; k < ends.length; k++) ends[k].y = Math.max(ends[k].y, ends[k - 1].y + 13);
    ends.forEach(e => { marks += `<text class="lab" x="${e.x}" y="${e.y}">${esc(e.text)}</text>`; });
    host.innerHTML = `<svg class="chart" viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="${esc(aria)}">${f.grid}${marks}${f.hits}</svg>`;
    wire(host, years, rows, title);
  };

  /* a low-to-high range per period for a few series (the projections' cases): a bar from low to high, a diamond at
     the middle joined by a line, each series a little apart; and an optional dashed reference line with its label
     (the last close). series: [{color, lo: [], hi: []}], values already in display units */
  FD.ranges = (host, {years, series, ref, step, fmt, aria, rows, xlab, title}) => {
    const known = series.flatMap(s => s.lo.concat(s.hi)).filter(v => v != null);
    const f = frame(years, {W: widthOf(host), H: 300, max: Math.max(0, ref ? ref.value : 0, ...known), step, fmt, xlab});
    const gap = Math.min(9, f.band / 9), off = k => (k - (series.length - 1) / 2) * gap;
    let marks = `<line class="xhair" y1="${f.T}" y2="${f.H - f.B}" ${years.map((_, i) => `data-x${i}="${f.cx(i)}"`).join(" ")}/>`;
    if (ref) marks += `<line class="ref" x1="${f.L}" x2="${f.W - f.R}" y1="${f.y(ref.value)}" y2="${f.y(ref.value)}"/>`
      + `<text class="lab" x="${f.L + 6}" y="${f.y(ref.value) - 6}">${esc(ref.label)}</text>`;
    series.forEach((s, k) => {
      const c = col(s.color), mid = s.lo.map((lo, i) => lo == null || s.hi[i] == null ? null : (lo + s.hi[i]) / 2);
      let run = [];
      const flush = () => {
        if (run.length > 1) marks += `<polyline points="${run.join(" ")}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
        run = [];
      };
      mid.forEach((v, i) => { if (v == null) flush(); else run.push(`${f.cx(i) + off(k)},${f.y(v)}`); });
      flush();
      mid.forEach((v, i) => {
        if (v == null) return;
        const x = f.cx(i) + off(k), a = f.y(s.hi[i]), b = f.y(s.lo[i]), m = f.y(v);
        marks += `<path d="M${x},${a}V${b}M${x - 4},${a}H${x + 4}M${x - 4},${b}H${x + 4}" stroke="${c}" stroke-width="1.5" fill="none" opacity="0.75"/>`
          + `<path d="M${x},${m - 5}L${x + 5},${m}L${x},${m + 5}L${x - 5},${m}Z" fill="${c}" stroke="var(--sheet)" stroke-width="1.5"/>`;
      });
    });
    host.innerHTML = `<svg class="chart" viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="${esc(aria)}">${f.bands}${f.grid}${marks}${f.hits}</svg>`;
    wire(host, years, rows, title);
  };

  /* two-part stacked columns: bottom + top = total */
  FD.stacked = (host, {years, bottom, top, step, fmt = v => v, endLabel, aria, rows, xlab, title}) => {
    const totals = bottom.values.map((b, i) => b + top.values[i]);
    const f = frame(years, {W: widthOf(host), max: Math.max(...totals), step, fmt, xlab});
    const w = barW(f.band);
    let marks = "";
    years.forEach((_, i) => {
      const x0 = f.cx(i) - w / 2, x1 = x0 + w, yb = f.y(0), yM = f.y(bottom.values[i]), yT = f.y(totals[i]);
      marks += `<rect x="${x0}" y="${yM}" width="${w}" height="${yb - yM}" fill="${col(bottom.color)}"/>`;
      marks += `<path d="${topPath(x0, x1, yT, yM - 2, 4)}" fill="${col(top.color)}"/>`;
    });
    if (endLabel) { const li = years.length - 1; marks += `<text class="lab" x="${f.cx(li)}" y="${f.y(totals[li]) - 7}" text-anchor="middle">${esc(endLabel)}</text>`; }
    host.innerHTML = `<svg class="chart" viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="${esc(aria)}">${f.bands}${f.grid}${marks}${f.hits}</svg>`;
    wire(host, years, rows, title);
  };

  FD.table = (el, cols, rows) => {
    const n = cols.idx.length;
    const head = `<thead><tr><th scope="col">${esc(cols.head)}</th>${cols.idx.map((i, k) => `<th scope="col" class="${k === n - 1 ? "last" : ""}">${esc(cols.label(i))}</th>`).join("")}</tr></thead>`;
    const body = rows.map(r => {
      if (r.section) return `<tr class="sec"><td colspan="${n + 1}">${esc(r.section)}</td></tr>`;
      return `<tr class="${r.strong ? "sub" : ""}"><td>${esc(r.name)}</td>${cols.idx.map((i, k) => {
        const v = r.get(i);
        const isNeg = typeof v === "number" && v < 0;
        const txt = typeof v === "number" ? r.fmt(v) : v;
        return `<td class="${isNeg ? "neg " : ""}${k === n - 1 ? "last" : ""}">${esc(txt)}</td>`;
      }).join("")}</tr>`;
    }).join("");
    el.innerHTML = head + `<tbody>${body}</tbody>`;
  };

  /* draw now and again when the width changes */
  FD.draw = fn => {
    const run = () => { tip.hidden = true; fn(); };
    run();
    let w = window.innerWidth, t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => { if (window.innerWidth !== w) { w = window.innerWidth; run(); } }, 150);
    });
  };

  /* Shareable calculator state. A calculator keeps what the reader changed from its defaults in the page address
     (?dcf_g1=8&pe_m=30) so that a link reproduces the scenario; each calculator owns the keys with its prefix. */
  FD.share = {
    read(prefix, keys) {
      const p = new URLSearchParams(location.search), out = {};
      keys.forEach(k => { const v = p.get(prefix + "_" + k); if (v !== null) out[k] = v; });
      return out;
    },
    write(prefix, diff) {
      try {
        const p = new URLSearchParams(location.search);
        [...p.keys()].filter(k => k.startsWith(prefix + "_")).forEach(k => p.delete(k));
        Object.entries(diff).forEach(([k, v]) => p.set(prefix + "_" + k, v));
        const q = p.toString();
        history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash);
      } catch (e) { /* the address can't be changed here: the link just won't carry the scenario */ }
    },
    copy(note, hash) {
      const url = location.origin + location.pathname + location.search + hash;
      const say = msg => { note.textContent = msg; clearTimeout(note._t); note._t = setTimeout(() => { note.textContent = ""; }, 5000); };
      const fallback = () => { window.prompt("Copy this link", url); };
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => say("Link copied"), fallback);
    },
  };

  window.FD = FD;
})();
