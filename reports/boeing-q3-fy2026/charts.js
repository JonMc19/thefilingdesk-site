const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const fm = D.fcf.map((f, i) => pct(f, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000), step: 5,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Boeing quarterly revenue over twelve quarters, from $22.0 billion in Q4 2023 to $24.2 billion in Q3 2026",
    rows: i => [["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"]],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, max: 40, min: -40, step: 20, fmt: v => v + "%",
    series: [{values: om, color: "var(--s1)", end: "Operating " + om[L].toFixed(1) + "%"}],
    aria: "Line chart of Boeing operating margin by quarter: negative in most quarters from Q1 2024 to Q3 2025, 36.6% in Q4 2025 and 1.5% in Q3 2026",
    rows: i => [["var(--s1)", "Operating margin", om[i].toFixed(1) + "%"]],
  });
  FD.columns(document.getElementById("c-cash"), {
    years: Y, xlab, values: D.fcf.map(v => v == null ? null : v / 1000), step: 2,
    labels: [L], labelFmt: i => sbn(D.fcf[i]),
    aria: "Column chart of Boeing quarterly free cash flow: negative in most quarters from Q1 2024 to Q2 2025, positive in the last five quarters except Q1 2026",
    rows: i => [["var(--s1)", "Free cash flow", "$" + sbn(D.fcf[i]) + "B"]],
  });
});

FD.table(document.getElementById("t-all"),
  {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: bn, strong: true},
    {name: "Gross profit", get: i => D.gross[i], fmt: sbn},
    {name: "Research and development", get: i => D.rnd[i], fmt: bn},
    {name: "Operating income", get: i => D.op_inc[i], fmt: sbn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Income tax", get: i => D.tax[i], fmt: sbn},
    {name: "Net income", get: i => D.net_inc[i], fmt: sbn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => minus(v.toFixed(2))},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: sbn, strong: true},
    {name: "Additions to property, plant and equipment", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: sbn, strong: true},
    {name: "Free cash flow margin", get: i => fm[i], fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Dividends paid", get: i => D.dividends[i], fmt: bn},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: sbn},
  ]);
