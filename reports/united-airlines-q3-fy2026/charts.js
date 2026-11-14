const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000), step: 5,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of United Airlines quarterly revenue, from $13.6 billion in the fourth quarter of 2023 to $17.9 billion in the third quarter of 2026",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, max: 15, step: 5, fmt: v => v + "%",
    series: [
      {values: om, color: "var(--s1)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart of United Airlines operating margin by quarter, between 0.8% and 12.9%, at 8.1% in the third quarter of 2026",
    rows: i => [
      ["var(--s1)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.lines(document.getElementById("c-cash"), {
    years: Y, xlab, max: 6, min: -2, step: 2, fmt: v => v,
    series: [
      {values: D.ocf.map(v => v == null ? null : v / 1000), color: "var(--s1)", end: "Operations " + bn(D.ocf[L])},
      {values: D.capex.map(v => v == null ? null : v / 1000), color: "var(--s2)", end: "Capex " + bn(D.capex[L])},
    ],
    aria: "Line chart of United Airlines cash from operations and capital spending by quarter, in US$ billions. Cash from operations fell to $0.5 billion in the third quarter of 2026 while capital spending was $2.1 billion",
    rows: i => [
      ["var(--s1)", "Cash from operations", "$" + sbn(D.ocf[i]) + "B"],
      ["var(--s2)", "Capital spending", "$" + bn(D.capex[i]) + "B"],
      [null, "Free cash flow", "$" + sbn(D.fcf[i]) + "B"],
    ],
  });
});

FD.table(document.getElementById("t-all"),
  {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: bn, strong: true},
    {name: "Growth on a year earlier", get: i => i >= 4 ? pct(D.revenue[i], D.revenue[i - 4]) - 100 : "—", fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Operating income", get: i => D.op_inc[i], fmt: sbn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Income tax", get: i => D.tax[i], fmt: sbn},
    {name: "Net income", get: i => D.net_inc[i], fmt: sbn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => minus(v.toFixed(2))},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: sbn, strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: sbn, strong: true},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
