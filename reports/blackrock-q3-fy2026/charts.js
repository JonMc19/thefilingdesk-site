const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const nm = D.net_inc.map((o, i) => pct(o, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000), step: 2,
    labels: [0, L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of BlackRock quarterly revenue, from $4.6 billion in the fourth quarter of 2023 to $7.8 billion in the third quarter of 2026",
    rows: i => [["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"]],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, max: 50, step: 10, fmt: v => v + "%",
    series: [
      {values: om, color: "var(--s1)", end: "Operating " + om[L].toFixed(1) + "%"},
      {values: nm, color: "var(--s2)", end: "Net " + nm[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: BlackRock operating margin between 23.7% and 42.0% and net income margin between 16.1% and 33.3% over twelve quarters",
    rows: i => [
      ["var(--s1)", "Operating margin", om[i].toFixed(1) + "%"],
      ["var(--s2)", "Net income margin", nm[i].toFixed(1) + "%"],
    ],
  });
  FD.columns(document.getElementById("c-cash"), {
    years: Y, xlab, values: D.fcf.map(v => v == null ? null : v / 1000), step: 1,
    labels: [L], labelFmt: i => bn(D.fcf[i]),
    aria: "Column chart of BlackRock quarterly free cash flow, negative in the first quarters of 2024, 2025 and 2026 and $2.6 billion in the third quarter of 2026",
    rows: i => [
      ["var(--s1)", "Free cash flow", (D.fcf[i] < 0 ? "−$" : "$") + bn(Math.abs(D.fcf[i])) + "B"],
      [null, "Cash from operations", (D.ocf[i] < 0 ? "−$" : "$") + bn(Math.abs(D.ocf[i])) + "B"],
    ],
  });
});

FD.table(document.getElementById("t-all"),
  {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: bn, strong: true},
    {name: "Operating income", get: i => D.op_inc[i], fmt: bn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Income before taxes", get: i => D.pretax[i], fmt: bn},
    {name: "Income tax", get: i => D.tax[i], fmt: bn},
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: v => v < 0 ? "−" + bn(-v) : bn(v), strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: v => v < 0 ? "−" + bn(-v) : bn(v), strong: true},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash", get: i => D.cash[i], fmt: bn},
    {name: "Debt", get: i => D.debt[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
