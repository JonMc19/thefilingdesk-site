const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000), step: 0.5,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Take-Two quarterly revenue over twelve quarters, from $1.4 billion in Q3 fiscal 2024 to $1.5 billion in Q2 fiscal 2027, with a peak of $1.8 billion in Q2 fiscal 2026",
    rows: i => [["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"]],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, max: 80, min: -250, step: 50, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart of gross margin and operating margin over twelve quarters. Gross margin stays between 33% and 63%. Operating margin is below zero in most quarters, with large drops in Q4 fiscal 2024 and Q4 fiscal 2025.",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.columns(document.getElementById("c-fcf"), {
    years: Y, xlab, values: D.fcf, step: 100, min: -300,
    labels: [L - 4, L], labelFmt: i => minus(String(D.fcf[i])),
    aria: "Column chart of free cash flow over twelve quarters, in millions of dollars. It is negative in Q2 fiscal 2027 at minus 143, after positive 96 a year earlier.",
    rows: i => [["var(--s1)", "Free cash flow", "$" + minus(String(D.fcf[i])) + "M"]],
  });
});

FD.table(document.getElementById("t-all"),
  {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: v => minus(v.toLocaleString("en-US")), strong: true},
    {name: "Revenue growth on year earlier", get: i => i >= 4 ? pct(D.revenue[i], D.revenue[i - 4]) - 100 : "—", fmt: v => v === "—" ? v : minus(v.toFixed(1)) + "%"},
    {name: "Gross profit", get: i => D.gross[i], fmt: v => minus(v.toLocaleString("en-US"))},
    {name: "Gross margin", get: i => gm[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Operating income", get: i => D.op_inc[i], fmt: v => minus(v.toLocaleString("en-US")), strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Income tax", get: i => D.tax[i], fmt: v => minus(v.toLocaleString("en-US"))},
    {name: "Net income", get: i => D.net_inc[i], fmt: v => minus(v.toLocaleString("en-US")), strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => minus(v.toFixed(2))},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: v => minus(v.toLocaleString("en-US")), strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: v => v.toLocaleString("en-US")},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: v => minus(v.toLocaleString("en-US")), strong: true},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: v => v.toLocaleString("en-US")},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: v => v.toLocaleString("en-US")},
    {name: "Total debt", get: i => D.debt[i], fmt: v => v.toLocaleString("en-US")},
    {name: "Total assets", get: i => D.total_assets[i], fmt: v => v.toLocaleString("en-US")},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: v => v.toLocaleString("en-US")},
  ]);
