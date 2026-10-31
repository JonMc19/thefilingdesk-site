const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v / 1000), step: 20,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Meta quarterly revenue over twelve quarters, from $40.1 billion in Q4 2023 to $64.6 billion in Q3 2026",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
      [null, "Growth on year earlier", i > 3 ? (pct(D.revenue[i], D.revenue[i - 4]) - 100).toFixed(1) + "%" : "—"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, max: 100, step: 25, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: gross margin between 79.3% and 82.1%; operating margin between 37.9% and 48.3% until the second quarter of 2026, then 30.9% and 20.1% in the third quarter",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.lines(document.getElementById("c-cash"), {
    years: Y, xlab, max: 40, step: 10, fmt: v => v,
    series: [
      {values: D.ocf.map(v => v / 1000), color: "var(--s1)", end: "Operations " + bn(D.ocf[L])},
      {values: D.capex.map(v => v / 1000), color: "var(--s2)", end: "Capex " + bn(D.capex[L])},
    ],
    aria: "Line chart in US$ billions: cash from operations rises from $19.4 billion to $32.8 billion; capital spending rises from $7.6 billion to $33.9 billion and passes operating cash flow in the third quarter of 2026",
    rows: i => [
      ["var(--s1)", "Cash from operations", "$" + bn(D.ocf[i]) + "B"],
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
    {name: "Growth on year earlier", get: i => i > 3 ? pct(D.revenue[i], D.revenue[i - 4]) - 100 : "—", fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Gross profit", get: i => D.gross[i], fmt: bn},
    {name: "Gross margin", get: i => gm[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Research and development", get: i => D.rnd[i], fmt: bn},
    {name: "Operating income", get: i => D.op_inc[i], fmt: bn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Income tax", get: i => D.tax[i], fmt: sbn},
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Additions to property and equipment", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: sbn, strong: true},
    {name: "Dividends paid", get: i => D.dividends[i], fmt: bn},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and marketable securities", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
