const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const nm = D.net_inc.map((o, i) => pct(o, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v / 1000), step: 2,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of McDonald's quarterly revenue over twelve quarters, from $6.4 billion in the fourth quarter of 2023 to $7.2 billion in the third quarter of 2026",
    rows: i => [["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"]],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, max: 60, step: 20, fmt: v => v + "%",
    series: [
      {values: om, color: "var(--s1)", end: "Operating " + om[L].toFixed(1) + "%"},
      {values: nm, color: "var(--s2)", end: "Net " + nm[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: operating margin between 43.7% and 50.2% and net margin between 30.4% and 34.7% over twelve quarters; both are highest in the third quarter of 2026",
    rows: i => [
      ["var(--s1)", "Operating margin", om[i].toFixed(1) + "%"],
      ["var(--s2)", "Net margin", nm[i].toFixed(1) + "%"],
    ],
  });
  FD.columns(document.getElementById("c-eps"), {
    years: Y, xlab, values: D.eps, step: 1,
    labels: [L - 4, L], labelFmt: i => "$" + D.eps[i].toFixed(2),
    aria: "Column chart of McDonald's diluted earnings per share by quarter, from $2.80 in the fourth quarter of 2023 to $3.51 in the third quarter of 2026",
    rows: i => [["var(--s1)", "Diluted EPS", "$" + D.eps[i].toFixed(2)]],
  });
  FD.stacked(document.getElementById("c-cash"), {
    years: Y, xlab, step: 1,
    bottom: {values: D.fcf.map(v => v / 1000), color: "var(--s1)"},
    top: {values: D.capex.map(v => v / 1000), color: "var(--s2)"},
    endLabel: bn(D.ocf[L]),
    aria: "Stacked columns: operating cash flow split into capital spending and free cash flow over twelve quarters. In the third quarter of 2026 cash from operations was $3.0 billion, capital spending $0.9 billion and free cash flow $2.1 billion.",
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
    {name: "Operating income", get: i => D.op_inc[i], fmt: bn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Income tax", get: i => D.tax[i], fmt: bn},
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {name: "Diluted shares (millions)", get: i => D.shares[i] == null ? "—" : D.shares[i], fmt: v => v === "—" ? v : v.toLocaleString("en-US")},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: bn, strong: true},
    {name: "Free cash flow margin", get: i => pct(D.fcf[i], D.revenue[i]), fmt: v => v.toFixed(1) + "%"},
    {name: "Dividends paid", get: i => D.dividends[i], fmt: bn},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: v => (v < 0 ? "−" : "") + bn(Math.abs(v))},
  ]);
