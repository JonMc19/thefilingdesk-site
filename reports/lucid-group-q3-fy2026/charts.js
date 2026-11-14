const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const opl = D.op_inc.map(v => v == null ? null : -v / 1000);
const nl = D.net_inc.map(v => v == null ? null : -v / 1000);
const fo = D.fcf.map(v => v == null ? null : -v / 1000);

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000),
    step: 0.2, labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Lucid quarterly revenue, from $0.16 billion in the fourth quarter of 2023 to $0.35 billion in the third quarter of 2026",
    rows: i => [["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"]]});
  FD.lines(document.getElementById("c-loss"), {years: Y, xlab, max: 1.2, step: 0.4, fmt: v => v.toFixed(1),
    series: [
      {values: opl, color: "var(--s1)", end: "Operating " + opl[L].toFixed(2)},
      {values: nl, color: "var(--s2)", end: "Net " + nl[L].toFixed(2)},
    ],
    aria: "Line chart of Lucid operating loss and net loss per quarter, both between about $0.4 billion and $1.1 billion over twelve quarters",
    rows: i => [["var(--s1)", "Operating loss", "$" + opl[i].toFixed(2) + "B"], ["var(--s2)", "Net loss", "$" + nl[i].toFixed(2) + "B"]]});
  FD.columns(document.getElementById("c-fcf"), {years: Y, xlab, values: fo, step: 0.5,
    labels: [L - 1, L], labelFmt: i => fo[i].toFixed(2),
    aria: "Column chart of Lucid free cash outflow per quarter, peaking at $1.48 billion in the second quarter of 2026 and falling to $1.04 billion in the third quarter",
    rows: i => [["var(--s1)", "Free cash outflow", "$" + fo[i].toFixed(2) + "B"]]});
});

FD.table(document.getElementById("t-all"),
  {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: bn, strong: true},
    {name: "Gross profit (loss)", get: i => D.gross[i], fmt: sbn},
    {name: "Research and development", get: i => D.rnd[i], fmt: bn},
    {name: "Operating income (loss)", get: i => D.op_inc[i], fmt: sbn, strong: true},
    {name: "Net income (loss)", get: i => D.net_inc[i], fmt: sbn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v == null ? "—" : minus(v.toFixed(2))},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: sbn, strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: sbn, strong: true},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash", get: i => D.cash[i], fmt: bn},
    {name: "Debt", get: i => D.debt[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: sbn},
  ]);
