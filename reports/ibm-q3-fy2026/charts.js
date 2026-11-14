const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const nm = D.net_inc.map((n, i) => pct(n, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000),
    step: 5, labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of IBM quarterly revenue over twelve quarters; the latest quarter, Q3 2026, was $17.1 billion, up from $16.3 billion a year earlier",
    rows: i => [["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"]],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, max: 70, step: 10, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: nm, color: "var(--s2)", end: "Net " + nm[L].toFixed(1) + "%"},
    ],
    aria: "Line chart of IBM gross margin, between 53.5% and 60.6%, and net margin, which moves between negative 2.2% and 28.4%, over twelve quarters",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Net margin", nm[i].toFixed(1) + "%"],
    ],
  });
  FD.columns(document.getElementById("c-fcf"), {
    years: Y, xlab, values: D.fcf.map(v => v == null ? null : v / 1000),
    step: 2, labels: [L - 4, L], labelFmt: i => bn(D.fcf[i]),
    aria: "Column chart of IBM quarterly free cash flow over twelve quarters; Q3 2026 was $3.7 billion, up from $2.8 billion a year earlier",
    rows: i => [
      ["var(--s1)", "Free cash flow", "$" + bn(D.fcf[i]) + "B"],
      [null, "Cash from operations", "$" + bn(D.ocf[i]) + "B"],
    ],
  });
});

FD.table(document.getElementById("t-all"),
  {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: bn, strong: true},
    {name: "Revenue growth on year earlier", get: i => i >= 4 ? pct(D.revenue[i], D.revenue[i - 4]) - 100 : "—", fmt: v => v === "—" ? v : minus(v.toFixed(1)) + "%"},
    {name: "Gross profit", get: i => D.gross[i], fmt: bn},
    {name: "Gross margin", get: i => gm[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Research and development", get: i => D.rnd[i], fmt: bn},
    {name: "Pre-tax income", get: i => D.pretax[i], fmt: v => v == null ? "—" : minus(bn(v))},
    {name: "Income tax", get: i => D.tax[i], fmt: v => v == null ? "—" : minus(bn(v))},
    {name: "Net income", get: i => D.net_inc[i], fmt: v => v == null ? "—" : minus(bn(v)), strong: true},
    {name: "Net margin", get: i => nm[i], fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v == null ? "—" : minus(v.toFixed(2))},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: bn, strong: true},
    {name: "Dividends paid", get: i => D.dividends[i], fmt: bn},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
