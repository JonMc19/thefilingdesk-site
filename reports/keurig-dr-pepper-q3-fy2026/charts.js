const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, pct, minus} = FD;
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const num = v => v == null ? "—" : v.toLocaleString("en-US");

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000), step: 2,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Keurig Dr Pepper quarterly revenue. It is between $3.5 billion and $4.5 billion for ten quarters, then $7.3 billion in each of the last two quarters.",
    rows: i => [["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"]],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, max: 60, step: 20, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: gross margin between 42.0% and 56.5%, falling to 48.0% in the third quarter of 2026; operating margin between 1.6% and 24.4%, at 18.2% in the latest quarter",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.stacked(document.getElementById("c-cash"), {
    years: Y, xlab, step: 500,
    bottom: {values: D.fcf, color: "var(--s1)"},
    top: {values: D.capex, color: "var(--s2)"},
    endLabel: num(D.ocf[L]),
    aria: "Stacked columns: operating cash flow split into capital spending and free cash flow for twelve quarters. Operating cash flow is $1,044 million in the latest quarter, of which free cash flow is $884 million.",
    rows: i => [
      [null, "Operating cash flow", "$" + num(D.ocf[i]) + "M"],
      ["var(--s2)", "Capital spending", "$" + num(D.capex[i]) + "M"],
      ["var(--s1)", "Free cash flow", "$" + num(D.fcf[i]) + "M"],
    ],
  });
});

FD.table(document.getElementById("t-all"),
  {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: num, strong: true},
    {name: "Gross profit", get: i => D.gross[i], fmt: num},
    {name: "Gross margin", get: i => gm[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Operating income", get: i => D.op_inc[i], fmt: num, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Income before tax", get: i => D.pretax[i], fmt: num},
    {name: "Income tax", get: i => D.tax[i], fmt: num},
    {name: "Net income to KDP", get: i => D.net_inc[i], fmt: num, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v == null ? "—" : v.toFixed(2)},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: num, strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: num},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: num, strong: true},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: num},
    {section: "Balance sheet at quarter end"},
    {name: "Cash", get: i => D.cash[i], fmt: num},
    {name: "Total debt", get: i => D.debt[i], fmt: num},
    {name: "Total assets", get: i => D.total_assets[i], fmt: num},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: num},
  ]);
