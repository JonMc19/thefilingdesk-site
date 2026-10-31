const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const nm = D.net_inc.map((o, i) => pct(o, D.revenue[i]));
const F = 4;
const Y2 = Y.slice(F);
const xlab2 = (i, short) => xlab(i + F, short);

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000), step: 0.2,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Reddit quarterly revenue, from $243 million in the first quarter of 2024 to $895 million in the third quarter of 2026",
    rows: i => [["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"]],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y2, xlab: xlab2, max: 40, step: 10, fmt: v => v + "%",
    series: [
      {values: om.slice(F), color: "var(--s1)", end: "Operating " + om[L].toFixed(1) + "%"},
      {values: nm.slice(F), color: "var(--s2)", end: "Net " + nm[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: operating margin rising from 1.0% in the first quarter of 2025 to 29.2% in the third quarter of 2026; net margin from 6.7% to 31.6%",
    rows: i => [
      ["var(--s1)", "Operating margin", om[i + F].toFixed(1) + "%"],
      ["var(--s2)", "Net margin", nm[i + F].toFixed(1) + "%"],
    ],
  });
  FD.columns(document.getElementById("c-fcf"), {
    years: Y, xlab, values: D.fcf.map(v => v == null ? null : v), step: 100,
    labels: [L - 4, L], labelFmt: i => String(D.fcf[i]),
    aria: "Column chart of Reddit quarterly free cash flow, from $29 million in the first quarter of 2024 to $363 million in the third quarter of 2026",
    rows: i => [["var(--s1)", "Free cash flow", "$" + D.fcf[i] + "M"]],
  });
});

FD.table(document.getElementById("t-all"),
  {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: v => v.toLocaleString("en-US"), strong: true},
    {name: "Gross profit", get: i => D.gross[i], fmt: v => v.toLocaleString("en-US")},
    {name: "Research and development", get: i => D.rnd[i], fmt: v => v.toLocaleString("en-US")},
    {name: "Operating income", get: i => D.op_inc[i], fmt: v => minus(v.toLocaleString("en-US")), strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Income tax", get: i => D.tax[i], fmt: v => minus(v.toLocaleString("en-US"))},
    {name: "Net income", get: i => D.net_inc[i], fmt: v => minus(v.toLocaleString("en-US")), strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => minus(v.toFixed(2))},
    {name: "Diluted shares (millions)", get: i => D.shares[i] == null ? "—" : D.shares[i], fmt: v => v},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: v => v.toLocaleString("en-US"), strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: v => v.toLocaleString("en-US")},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: v => v.toLocaleString("en-US"), strong: true},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: v => v.toLocaleString("en-US")},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: v => v.toLocaleString("en-US")},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and marketable securities", get: i => D.cash[i], fmt: v => v.toLocaleString("en-US")},
    {name: "Total assets", get: i => D.total_assets[i], fmt: v => v.toLocaleString("en-US")},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: v => v.toLocaleString("en-US")},
  ]);
