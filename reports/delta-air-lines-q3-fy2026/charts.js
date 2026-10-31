const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const title = i => D.label[i];
const om = D.op_inc.map((o, i) => o == null || D.revenue[i] == null ? null : pct(o, D.revenue[i]));
const yoy = i => i >= 4 && D.revenue[i] != null && D.revenue[i - 4] != null ? minus((pct(D.revenue[i], D.revenue[i - 4]) - 100).toFixed(1)) + "%" : "—";

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, title, values: D.revenue.map(v => v == null ? null : v / 1000), step: 5,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Delta Air Lines quarterly revenue, from $14.2 billion in the fourth quarter of 2023 to $20.2 billion in the third quarter of 2026, up from $16.7 billion a year earlier",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
      [null, "Growth vs year earlier", yoy(i)],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, title, max: 15, step: 5, fmt: v => v + "%",
    series: [
      {values: om, color: "var(--s1)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart of quarterly operating margin, rising to 13.6% in the second quarter of 2024 and at 7.2% in the third quarter of 2026, down from 10.1% a year earlier",
    rows: i => [
      ["var(--s1)", "Operating margin", om[i] == null ? "—" : om[i].toFixed(1) + "%"],
      [null, "Operating income", D.op_inc[i] == null ? "—" : "$" + bn(D.op_inc[i]) + "B"],
    ],
  });
  FD.columns(document.getElementById("c-ocf"), {
    years: Y, xlab, title, values: D.ocf.map(v => v == null ? null : v / 1000), step: 1,
    labels: [L - 4, L], labelFmt: i => bn(D.ocf[i]),
    aria: "Column chart of quarterly cash from operations, between $0.5 billion and $2.4 billion; $1.7 billion in the third quarter of 2026 against $1.8 billion a year earlier",
    rows: i => [
      ["var(--s1)", "Cash from operations", D.ocf[i] == null ? "—" : "$" + bn(D.ocf[i]) + "B"],
    ],
  });
});

FD.table(document.getElementById("t-all"),
  {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i] == null ? "—" : D.revenue[i], fmt: bn, strong: true},
    {name: "Growth vs year earlier", get: i => yoy(i)},
    {name: "Operating income", get: i => D.op_inc[i] == null ? "—" : D.op_inc[i], fmt: sbn, strong: true},
    {name: "Operating margin", get: i => om[i] == null ? "—" : om[i], fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Pre-tax income", get: i => D.pretax[i] == null ? "—" : D.pretax[i], fmt: sbn},
    {name: "Income tax", get: i => D.tax[i] == null ? "—" : D.tax[i], fmt: sbn},
    {name: "Net income", get: i => D.net_inc[i] == null ? "—" : D.net_inc[i], fmt: sbn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i] == null ? "—" : D.eps[i], fmt: v => minus(v.toFixed(2))},
    {name: "Diluted shares (millions)", get: i => D.shares[i] == null ? "—" : D.shares[i], fmt: v => v.toLocaleString("en-US")},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i] == null ? "—" : D.ocf[i], fmt: sbn, strong: true},
    {name: "Dividends paid", get: i => D.dividends[i] == null ? "—" : D.dividends[i], fmt: bn},
    {name: "Share buybacks", get: i => D.buybacks[i] == null ? "—" : D.buybacks[i], fmt: bn},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and cash equivalents", get: i => D.cash[i] == null ? "—" : D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i] == null ? "—" : D.debt[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i] == null ? "—" : D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i] == null ? "—" : D.equity[i], fmt: bn},
  ]);
