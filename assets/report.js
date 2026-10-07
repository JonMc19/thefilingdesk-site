/* The Filing Desk: chart and table helpers for report pages.
   Charts are inline SVG drawn to the width of their container, with a
   per-period hover/tap tooltip. Colors come from CSS tokens. `years` are fiscal years unless a chart
   passes `xlab` (axis label for period i; `short` when space is tight, `tiny` when very tight) and `title`
   (tooltip heading). */
(function () {
  const FD = {};
  const tip = document.createElement("div");
  tip.className = "tip"; tip.hidden = true;
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(tip));

  FD.bn = v => (v / 1000).toLocaleString("en-US", {minimumFractionDigits: 1, maximumFractionDigits: 1});
  FD.sbn = v => (v < 0 ? "−" : "") + FD.bn(Math.abs(v));
  FD.pct = (a, b) => a / b * 100;
  FD.minus = s => String(s).replace(/^-/, "−");

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
      s += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
    }
    const lab = xlab || fyLab(years);
    years.forEach((_, i) => {
      s += `<text x="${cx(i)}" y="${H - B + 18}" text-anchor="middle">${lab(i, short, band < 22)}</text>`;
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
      tip.innerHTML = `<b>${title ? title(i) : "Fiscal " + years[i]}</b>` + rowsFor(i).map(([c, k, v]) =>
        `<div class="row"><span>${c ? `<i style="background:${c}"></i>` : ""}${k}</span><span>${v}</span></div>`).join("");
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
    labels.forEach(i => { marks += `<text class="lab" x="${f.cx(i)}" y="${f.y(values[i]) - 7}" text-anchor="middle">${labelFmt(i)}</text>`; });
    host.innerHTML = `<svg class="chart" viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="${aria}">${f.bands}${f.grid}${marks}${f.hits}</svg>`;
    wire(host, years, rows, title);
  };

  /* line series on one axis, end dot and end label per series */
  FD.lines = (host, {years, series, max, min = 0, step, fmt, aria, rows, xlab, title}) => {
    const f = frame(years, {W: widthOf(host), max, min, step, fmt, R: 104, xlab});
    let marks = `<line class="xhair" y1="${f.T}" y2="${f.H - f.B}" ${years.map((_, i) => `data-x${i}="${f.cx(i)}"`).join(" ")}/>`;
    const ends = [];
    series.forEach(s => {
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
    ends.forEach(e => { marks += `<text class="lab" x="${e.x}" y="${e.y}">${e.text}</text>`; });
    host.innerHTML = `<svg class="chart" viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="${aria}">${f.grid}${marks}${f.hits}</svg>`;
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
      marks += `<rect x="${x0}" y="${yM}" width="${w}" height="${yb - yM}" fill="${bottom.color}"/>`;
      marks += `<path d="${topPath(x0, x1, yT, yM - 2, 4)}" fill="${top.color}"/>`;
    });
    if (endLabel) { const li = years.length - 1; marks += `<text class="lab" x="${f.cx(li)}" y="${f.y(totals[li]) - 7}" text-anchor="middle">${endLabel}</text>`; }
    host.innerHTML = `<svg class="chart" viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="${aria}">${f.bands}${f.grid}${marks}${f.hits}</svg>`;
    wire(host, years, rows, title);
  };

  FD.table = (el, cols, rows) => {
    const n = cols.idx.length;
    const head = `<thead><tr><th scope="col">${cols.head}</th>${cols.idx.map((i, k) => `<th scope="col" class="${k === n - 1 ? "last" : ""}">${cols.label(i)}</th>`).join("")}</tr></thead>`;
    const body = rows.map(r => {
      if (r.section) return `<tr class="sec"><td colspan="${n + 1}">${r.section}</td></tr>`;
      return `<tr class="${r.strong ? "sub" : ""}"><td>${r.name}</td>${cols.idx.map((i, k) => {
        const v = r.get(i);
        const isNeg = typeof v === "number" && v < 0;
        const txt = typeof v === "number" ? r.fmt(v) : v;
        return `<td class="${isNeg ? "neg " : ""}${k === n - 1 ? "last" : ""}">${txt}</td>`;
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

  window.FD = FD;
})();
