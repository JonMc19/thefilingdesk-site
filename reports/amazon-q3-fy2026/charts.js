const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000), step: 50,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Amazon quarterly revenue, from $170.0 billion in Q4 2023 to $201.9 billion in Q3 2026, with a peak each fourth quarter",
    rows: i => [["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"]],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, max: 60, step: 20, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: gross margin between 45.5% and 53.2%; operating margin between 7.8% and 13.9%, highest in Q3 2026",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.lines(document.getElementById("c-cash"), {
    years: Y, xlab, max: 80, step: 20, fmt: v => v,
    series: [
      {values: D.ocf.map(v => v == null ? null : v / 1000), color: "var(--s1)", end: "Operations " + bn(D.ocf[L])},
      {values: D.capex.map(v => v == null ? null : v / 1000), color: "var(--s2)", end: "Capex " + bn(D.capex[L])},
    ],
    aria: "Line chart of cash from operations and capital spending in US$ billions per quarter. Capital spending rises from $14.6 billion in Q4 2023 to $77.3 billion in Q3 2026 and is above operating cash flow in the last three quarters.",
    rows: i => [
      ["var(--s1)", "Cash from operations", "$" + bn(D.ocf[i]) + "B"],
      ["var(--s2)", "Capital spending", "$" + bn(D.capex[i]) + "B"],
      [null, "Free cash flow", (D.fcf[i] < 0 ? "−$" : "$") + bn(Math.abs(D.fcf[i])) + "B"],
    ],
  });
});

FD.table(document.getElementById("t-all"),
  {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: bn, strong: true},
    {name: "Gross profit", get: i => D.gross[i], fmt: bn},
    {name: "Gross margin", get: i => gm[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Operating income", get: i => D.op_inc[i], fmt: bn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Income tax", get: i => D.tax[i], fmt: bn},
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Additions to property and equipment", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: sbn, strong: true},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and marketable securities", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
