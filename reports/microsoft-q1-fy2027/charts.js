const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const nm = D.net_inc.map((o, i) => pct(o, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000), step: 20,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Microsoft quarterly revenue, from $62.0 billion in the second quarter of fiscal 2024 to $92.3 billion in the first quarter of fiscal 2027",
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
    aria: "Line chart: gross margin eased from 69.0% to 67.8% while operating margin rose from 48.9% to 49.8% between the first quarters of fiscal 2026 and fiscal 2027",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.stacked(document.getElementById("c-cash"), {
    years: Y, xlab, step: 10,
    bottom: {values: D.fcf.map(v => v / 1000), color: "var(--s1)"},
    top: {values: D.capex.map(v => v / 1000), color: "var(--s2)"},
    endLabel: bn(D.ocf[L]),
    aria: "Stacked columns: operating cash flow split into capital spending and free cash flow over twelve quarters. In the first quarter of fiscal 2027 capital spending was $39.4 billion and free cash flow $18.6 billion, out of $58.0 billion of operating cash flow.",
    rows: i => [
      [null, "Operating cash flow", "$" + bn(D.ocf[i]) + "B"],
      ["var(--s2)", "Capital spending", "$" + bn(D.capex[i]) + "B"],
      ["var(--s1)", "Free cash flow", "$" + bn(D.fcf[i]) + "B"],
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
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Additions to property and equipment", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: bn, strong: true},
    {name: "Free cash flow margin", get: i => pct(D.fcf[i], D.revenue[i]), fmt: v => v.toFixed(1) + "%"},
    {name: "Dividends paid", get: i => D.dividends[i], fmt: bn},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
