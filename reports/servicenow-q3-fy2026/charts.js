const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const nm = D.net_inc.map((o, i) => pct(o, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000), step: 1,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of ServiceNow quarterly revenue, from $2.4 billion in the fourth quarter of fiscal 2023 to $4.1 billion in the third quarter of fiscal 2026",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
      [null, "Growth on a year earlier", i >= 4 ? minus((pct(D.revenue[i], D.revenue[i - 4]) - 100).toFixed(1)) + "%" : "—"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, max: 80, step: 20, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: gross margin fell from about 77% to 70.5% and operating margin from 16.8% to 9.4% between the third quarters of fiscal 2025 and fiscal 2026, after dropping to 4.1% in the second quarter",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.lines(document.getElementById("c-debt"), {
    years: Y, xlab, max: 8, step: 2, fmt: v => "$" + v + "B",
    series: [
      {values: D.debt.map(v => v / 1000), color: "var(--s1)", end: "Debt $" + bn(D.debt[L]) + "B"},
      {values: D.cash.map(v => v / 1000), color: "var(--s2)", end: "Cash $" + bn(D.cash[L]) + "B"},
    ],
    aria: "Line chart: total debt stayed near $1.5 billion until the second quarter of fiscal 2026, then rose to $7.5 billion, while cash and short-term investments fell to $4.6 billion",
    rows: i => [
      ["var(--s1)", "Total debt", "$" + bn(D.debt[i]) + "B"],
      ["var(--s2)", "Cash and short-term investments", "$" + bn(D.cash[i]) + "B"],
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
    {name: "Research and development", get: i => D.rnd[i], fmt: bn},
    {name: "Operating income", get: i => D.op_inc[i], fmt: bn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Income tax", get: i => D.tax[i], fmt: bn},
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Net margin", get: i => nm[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {name: "Diluted shares (millions)", get: i => D.shares[i] == null ? "—" : D.shares[i], fmt: v => v === "—" ? v : v.toLocaleString("en-US")},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Purchases of property and equipment", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: bn, strong: true},
    {name: "Free cash flow margin", get: i => pct(D.fcf[i], D.revenue[i]), fmt: v => v.toFixed(1) + "%"},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
