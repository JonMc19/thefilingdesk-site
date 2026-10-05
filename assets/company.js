/* The Filing Desk: charts for company pages, drawn from window.COMPANY with the helpers in report.js.
   Tables on these pages are plain HTML from build.py; only the charts need script. */
(function () {
  const C = window.COMPANY, D = C.data, M = C.metrics, Y = C.FY;
  const has = a => a && a.some(v => v != null);
  const dash = "—";
  const num = (v, d = 1) => v == null ? dash : FD.minus(v.toLocaleString("en-US", {minimumFractionDigits: d, maximumFractionDigits: d}));
  const pctf = v => v == null ? dash : num(v) + "%";
  const money = v => v == null ? dash : Math.abs(v) >= 1000 ? "$" + num(v / 1000) + "B" : "$" + num(v, 0) + "M";
  const bnv = a => a.map(v => v == null ? null : v / 1000);

  // a gridline step that gives four or five lines over the data's range
  function niceStep(lo, hi) {
    const raw = Math.max(hi - Math.min(0, lo), 1e-9) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
  }
  const axis = step => v => FD.minus(+v.toFixed(step < 1 ? 2 : 0) + "");
  const range = series => {
    const vals = series.flatMap(s => s.values).filter(v => v != null);
    return [Math.min(0, ...vals), Math.max(0, ...vals)];
  };
  const el = id => document.getElementById(id);
  const hide = id => { const f = el(id); if (f) f.closest("figure").hidden = true; };

  function columns(id, values, {fmtAxis, rows, aria}) {
    if (!el(id)) return;
    if (!has(values)) return hide(id);
    const [lo, hi] = range([{values}]);
    const step = niceStep(lo, hi);
    FD.columns(el(id), {years: Y, values, step, fmt: fmtAxis || axis(step), aria, rows});
  }

  function lines(id, series, {suffix = "%", rows, aria}) {
    if (!el(id)) return;
    series = series.filter(s => has(s.values));
    if (!series.length) return hide(id);
    const [lo, hi] = range(series);
    const step = niceStep(lo, hi);
    series.forEach(s => {
      const last = [...s.values].reverse().find(v => v != null);
      s.end = s.label + " " + num(last) + suffix;
    });
    const fig = el(id).closest("figure");
    fig.querySelectorAll(".legend [data-key]").forEach(item => {
      item.hidden = !series.some(s => s.key === item.dataset.key);
    });
    FD.lines(el(id), {years: Y, series, max: hi, min: lo, step, fmt: v => axis(step)(v) + suffix, aria, rows});
  }

  const line = (key, label, color, values) => ({key, label, color, values});

  FD.draw(() => {
    columns("c-rev", bnv(D.revenue), {
      aria: `Column chart: revenue by fiscal year, ${Y[0]} to ${Y[Y.length - 1]}`,
      rows: i => [
        ["var(--s1)", "Revenue", money(D.revenue[i])],
        [null, "Growth", pctf(M.revenue_growth[i])],
      ],
    });

    if (C.profile === "bank") {
      lines("c-returns", [
        line("roe", "ROE", "var(--s1)", M.roe),
        line("rote", "ROTE", "var(--s2)", M.rote),
      ], {
        aria: "Line chart: return on equity and return on tangible common equity by fiscal year",
        rows: i => [["var(--s1)", "Return on equity", pctf(M.roe[i])], ["var(--s2)", "Return on tangible equity", pctf(M.rote[i])]],
      });
      lines("c-bank", [
        line("efficiency_ratio", "Efficiency", "var(--s1)", M.efficiency_ratio),
        line("net_interest_share", "Net interest", "var(--s2)", M.net_interest_share),
      ], {
        aria: "Line chart: efficiency ratio and net interest income as a share of revenue",
        rows: i => [["var(--s1)", "Efficiency ratio", pctf(M.efficiency_ratio[i])], ["var(--s2)", "Net interest income share", pctf(M.net_interest_share[i])]],
      });
    } else {
      lines("c-margins", [
        line("gross_margin", "Gross", "var(--s1)", M.gross_margin),
        line("operating_margin", "Operating", "var(--s2)", M.operating_margin),
        line("net_margin", "Net", "var(--s3)", M.net_margin),
        line("fcf_margin", "FCF", "var(--s4)", M.fcf_margin),
      ], {
        aria: "Line chart: gross, operating, net and free cash flow margins by fiscal year",
        rows: i => [
          ["var(--s1)", "Gross margin", pctf(M.gross_margin[i])],
          ["var(--s2)", "Operating margin", pctf(M.operating_margin[i])],
          ["var(--s3)", "Net margin", pctf(M.net_margin[i])],
          ["var(--s4)", "Free cash flow margin", pctf(M.fcf_margin[i])],
        ],
      });
      lines("c-returns", [
        line("roic", "ROIC", "var(--s1)", M.roic),
        line("roe", "ROE", "var(--s2)", M.roe),
      ], {
        aria: "Line chart: return on invested capital and return on equity by fiscal year",
        rows: i => [["var(--s1)", "Return on invested capital", pctf(M.roic[i])], ["var(--s2)", "Return on equity", pctf(M.roe[i])]],
      });
      columns("c-fcf", bnv(M.fcf), {
        aria: "Column chart: free cash flow by fiscal year; negative years in red",
        rows: i => [
          [null, "Cash from operations", money(D.ocf[i])],
          [null, "Capital expenditure", money(D.capex[i])],
          ["var(--s1)", "Free cash flow", money(M.fcf[i])],
        ],
      });
    }

    const payouts = Y.map((_, i) => (D.dividends[i] || 0) + (D.buybacks[i] || 0));
    if (payouts.some(v => v > 0) && el("c-payouts")) {
      const step = niceStep(0, Math.max(...payouts) / 1000);
      FD.stacked(el("c-payouts"), {
        years: Y, step, fmt: axis(step),
        bottom: {values: D.dividends.map(v => (v || 0) / 1000), color: "var(--s1)"},
        top: {values: D.buybacks.map(v => (v || 0) / 1000), color: "var(--s2)"},
        aria: "Stacked columns: dividends and share buybacks by fiscal year",
        rows: i => [
          ["var(--s1)", "Dividends", money(D.dividends[i])],
          ["var(--s2)", "Buybacks", money(D.buybacks[i])],
          [null, "Share of free cash flow", pctf(M.payout_of_fcf ? M.payout_of_fcf[i] : null)],
        ],
      });
    } else hide("c-payouts");

    const shares = D.shares_diluted.map(v => v == null ? null : v);
    const big = Math.max(...shares.filter(v => v != null)) >= 1000;
    columns("c-shares", shares.map(v => v == null ? null : big ? v / 1000 : v), {
      aria: "Column chart: weighted-average diluted shares by fiscal year",
      rows: i => [
        ["var(--s1)", "Diluted shares", shares[i] == null ? dash : big ? num(shares[i] / 1000, 2) + " billion" : num(shares[i], 0) + " million"],
        [null, "Change", pctf(M.share_change[i])],
      ],
    });
  });
})();
