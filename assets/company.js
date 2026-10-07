/* The Filing Desk: charts for company pages, drawn from window.COMPANY with the helpers in report.js.
   Tables on these pages are plain HTML from build.py; only the charts need script. A switch above the
   charts shows fiscal years or the last 12 quarters (window.COMPANY.quarterly); returns on capital
   stay annual, because they need a full year of income. */
(function () {
  const C = window.COMPANY, Q = C.quarterly;
  const has = a => a && a.some(v => v != null);
  const dash = "—";
  const num = (v, d = 1) => v == null ? dash : FD.minus(v.toLocaleString("en-US", {minimumFractionDigits: d, maximumFractionDigits: d}));
  const pctf = v => v == null ? dash : num(v) + "%";
  const money = v => v == null ? dash : Math.abs(v) >= 1000 ? "$" + num(v / 1000) + "B" : "$" + num(v, 0) + "M";
  const bnv = a => a.map(v => v == null ? null : v / 1000);
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const longDate = iso => { const [y, m, d] = iso.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };

  // what the charts draw from: fiscal years, or the quarters with their own labels and tooltip headings
  const ANNUAL = {X: C.FY, D: C.data, M: C.metrics, unit: "year", xlab: null, title: null};
  const QUARTERS = Q && {
    X: Q.fq, D: Q.data, M: Q.metrics, unit: "quarter",
    // "Q3 ’25"; when tight "Q1’25 Q2 Q3 Q4"; when very tight only each fiscal year's first quarter, "’25"
    xlab: (i, short, tiny) => tiny ? (Q.fq[i] === 1 ? "’" + String(Q.fy[i]).slice(2) : "")
                            : short ? "Q" + Q.fq[i] + (Q.fq[i] === 1 ? "’" + String(Q.fy[i]).slice(2) : "")
                            : "Q" + Q.fq[i] + " ’" + String(Q.fy[i]).slice(2),
    title: i => `Q${Q.fq[i]} fiscal ${Q.fy[i]} <span class="tip-sub">to ${longDate(Q.period_end[i])}</span>`,
    derived: (k, i) => Q.derived[k] && Q.derived[k][i],
  };

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
  const show = (id, on) => { const f = el(id); if (f) f.closest("figure").hidden = !on; };

  function columns(P, id, values, {fmtAxis, rows, aria}) {
    if (!el(id)) return;
    show(id, has(values));
    if (!has(values)) return;
    const [lo, hi] = range([{values}]);
    const step = niceStep(lo, hi);
    FD.columns(el(id), {years: P.X, values, step, fmt: fmtAxis || axis(step), aria, rows, xlab: P.xlab, title: P.title});
  }

  function lines(P, id, series, {suffix = "%", rows, aria}) {
    if (!el(id)) return;
    series = series.filter(s => has(s.values));
    show(id, series.length > 0);
    if (!series.length) return;
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
    FD.lines(el(id), {years: P.X, series, max: hi, min: lo, step, fmt: v => axis(step)(v) + suffix, aria, rows, xlab: P.xlab, title: P.title});
  }

  const line = (key, label, color, values) => ({key, label, color, values});
  // a tooltip line saying a quarter was worked out from the year's totals rather than filed as a quarter
  const workedOut = (P, k, i) => P.derived && P.derived(k, i) ? [[null, "Worked out as", "year minus 9 months"]] : [];

  function render(P) {
    const {D, M} = P, A = ANNUAL, per = P.unit === "year" ? "fiscal year" : "quarter";
    columns(P, "c-rev", bnv(D.revenue), {
      aria: `Column chart: revenue by ${per}`,
      rows: i => [
        ["var(--s1)", "Revenue", money(D.revenue[i])],
        [null, P.unit === "year" ? "Growth" : "Growth on a year earlier", pctf(M.revenue_growth[i])],
        ...workedOut(P, "revenue", i),
      ],
    });

    if (C.profile === "bank") {
      lines(A, "c-returns", [
        line("roe", "ROE", "var(--s1)", A.M.roe),
        line("rote", "ROTE", "var(--s2)", A.M.rote),
      ], {
        aria: "Line chart: return on equity and return on tangible common equity by fiscal year",
        rows: i => [["var(--s1)", "Return on equity", pctf(A.M.roe[i])], ["var(--s2)", "Return on tangible equity", pctf(A.M.rote[i])]],
      });
      lines(P, "c-bank", [
        line("efficiency_ratio", "Efficiency", "var(--s1)", M.efficiency_ratio),
        line("net_interest_share", "Net interest", "var(--s2)", M.net_interest_share),
      ], {
        aria: `Line chart: efficiency ratio and net interest income as a share of revenue, by ${per}`,
        rows: i => [["var(--s1)", "Efficiency ratio", pctf(M.efficiency_ratio[i])], ["var(--s2)", "Net interest income share", pctf(M.net_interest_share && M.net_interest_share[i])]],
      });
    } else {
      lines(P, "c-margins", [
        line("gross_margin", "Gross", "var(--s1)", M.gross_margin),
        line("operating_margin", "Operating", "var(--s2)", M.operating_margin),
        line("net_margin", "Net", "var(--s3)", M.net_margin),
        line("fcf_margin", "FCF", "var(--s4)", M.fcf_margin),
      ], {
        aria: `Line chart: gross, operating, net and free cash flow margins by ${per}`,
        rows: i => [
          ["var(--s1)", "Gross margin", pctf(M.gross_margin[i])],
          ["var(--s2)", "Operating margin", pctf(M.operating_margin[i])],
          ["var(--s3)", "Net margin", pctf(M.net_margin[i])],
          ["var(--s4)", "Free cash flow margin", pctf(M.fcf_margin[i])],
          ...workedOut(P, "revenue", i),
        ],
      });
      lines(A, "c-returns", [
        line("roic", "ROIC", "var(--s1)", A.M.roic),
        line("roe", "ROE", "var(--s2)", A.M.roe),
      ], {
        aria: "Line chart: return on invested capital and return on equity by fiscal year",
        rows: i => [["var(--s1)", "Return on invested capital", pctf(A.M.roic[i])], ["var(--s2)", "Return on equity", pctf(A.M.roe[i])]],
      });
      columns(P, "c-fcf", bnv(M.fcf), {
        aria: `Column chart: free cash flow by ${per}; negative values in red`,
        rows: i => [
          [null, "Cash from operations", money(D.ocf[i])],
          [null, "Capital expenditure", money(D.capex[i])],
          ["var(--s1)", "Free cash flow", money(M.fcf[i])],
          ...workedOut(P, "ocf", i),
        ],
      });
    }

    const div = D.dividends || P.X.map(() => null), buy = D.buybacks || P.X.map(() => null);
    const payouts = P.X.map((_, i) => (div[i] || 0) + (buy[i] || 0));
    show("c-payouts", payouts.some(v => v > 0));
    if (payouts.some(v => v > 0) && el("c-payouts")) {
      const step = niceStep(0, Math.max(...payouts) / 1000);
      FD.stacked(el("c-payouts"), {
        years: P.X, step, fmt: axis(step), xlab: P.xlab, title: P.title,
        bottom: {values: div.map(v => (v || 0) / 1000), color: "var(--s1)"},
        top: {values: buy.map(v => (v || 0) / 1000), color: "var(--s2)"},
        aria: `Stacked columns: dividends and share buybacks by ${per}`,
        rows: i => [
          ["var(--s1)", "Dividends", money(div[i])],
          ["var(--s2)", "Buybacks", money(buy[i])],
          ...(P.unit === "year" ? [[null, "Share of free cash flow", pctf(M.payout_of_fcf ? M.payout_of_fcf[i] : null)]] : []),
        ],
      });
    }

    const shares = D.shares_diluted || [];
    const big = Math.max(...A.D.shares_diluted.filter(v => v != null)) >= 1000;
    columns(P, "c-shares", shares.map(v => v == null ? null : big ? v / 1000 : v), {
      aria: `Column chart: weighted-average diluted shares by ${per}`,
      rows: i => [
        ["var(--s1)", "Diluted shares", shares[i] == null ? dash : big ? num(shares[i] / 1000, 2) + " billion" : num(shares[i], 0) + " million"],
        ...(P.unit === "year" ? [[null, "Change", pctf(M.share_change[i])]] : []),
      ],
    });
  }

  // the switch: captions, the note beside it, the quarterly notes, and the choice remembered per reader
  const toggle = document.querySelector(".period-toggle");
  // a link ending #quarterly or #annual opens that view; otherwise the reader's last choice
  let mode = "annual";
  try { if (QUARTERS && localStorage.getItem("fd-period") === "quarterly") mode = "quarterly"; } catch (e) {}
  if (location.hash === "#quarterly" && QUARTERS) mode = "quarterly";
  if (location.hash === "#annual") mode = "annual";

  function apply() {
    const quarters = mode === "quarterly" && QUARTERS;
    document.querySelectorAll("figcaption .n[data-q]").forEach(n => {
      if (n.dataset.a == null) n.dataset.a = n.textContent;
      n.textContent = quarters ? n.dataset.q : n.dataset.a;
    });
    if (toggle) {
      toggle.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.period === mode)));
      const note = toggle.querySelector(".period-note");
      note.textContent = quarters ? note.dataset.quarterly : note.dataset.annual;
    }
    document.querySelectorAll(".period-notes").forEach(n => { n.hidden = !quarters; });
    render(quarters ? QUARTERS : ANNUAL);
  }

  if (toggle) toggle.addEventListener("click", e => {
    const b = e.target.closest("button[data-period]");
    if (!b || b.dataset.period === mode) return;
    mode = b.dataset.period;
    try { localStorage.setItem("fd-period", mode); } catch (err) {}
    apply();
  });
  FD.draw(apply);
})();
