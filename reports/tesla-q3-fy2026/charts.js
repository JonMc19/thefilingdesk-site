const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000), step: 10,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Tesla quarterly revenue over twelve quarters, from $25.2 billion in Q4 2023 to $28.0 billion in Q3 2026",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
      [null, "Change on year earlier", i > 3 ? minus((pct(D.revenue[i], D.revenue[i - 4]) - 100).toFixed(1)) + "%" : "—"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, max: 25, step: 5, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: gross margin between 16.3% and 21.1% and operating margin between 1.4% and 10.8% over twelve quarters; in Q3 2026 gross margin was 19.6% and operating margin 2.6%",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.stacked(document.getElementById("c-cash"), {
    years: Y, xlab, step: 2,
    bottom: {values: D.fcf.map(v => Math.max(v, 0) / 1000), color: "var(--s1)"},
    top: {values: D.capex.map(v => v / 1000), color: "var(--s2)"},
    endLabel: bn(D.ocf[L]),
    aria: "Stacked columns over twelve quarters: capital spending, and free cash flow where it was positive. Capital spending was $4.7 billion in Q3 2026 and free cash flow $1.5 billion.",
    rows: i => [
      [null, "Operating cash flow", "$" + bn(D.ocf[i]) + "B"],
      ["var(--s2)", "Capital spending", "$" + bn(D.capex[i]) + "B"],
      ["var(--s1)", "Free cash flow", (D.fcf[i] < 0 ? "−$" : "$") + bn(Math.abs(D.fcf[i])) + "B"],
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
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: sbn, strong: true},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
