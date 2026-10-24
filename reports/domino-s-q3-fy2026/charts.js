const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
const title = i => D.label[i];
const mm = v => minus(v.toLocaleString("en-US"));
const m = v => v == null ? "—" : "$" + v.toLocaleString("en-US") + "M";
const om = D.op_inc.map((o, i) => o == null || D.revenue[i] == null ? null : pct(o, D.revenue[i]));
const yoy = i => i >= 4 && D.revenue[i] != null && D.revenue[i - 4] != null ? minus((pct(D.revenue[i], D.revenue[i - 4]) - 100).toFixed(1)) + "%" : "—";

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, title, values: D.revenue.map(v => v == null ? null : v / 1000), step: 0.5, fmt: v => v.toFixed(1),
    labels: [L - 4, L], labelFmt: i => (D.revenue[i] / 1000).toFixed(2),
    aria: "Column chart of Domino's quarterly revenue, between $1.08 billion and $1.54 billion; $1.19 billion in the third quarter of 2026, up from $1.15 billion a year earlier. Fourth quarters, which are longer, are the tallest columns.",
    rows: i => [
      ["var(--s1)", "Revenue", m(D.revenue[i])],
      [null, "Growth vs year earlier", yoy(i)],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, title, max: 25, step: 5, fmt: v => v + "%",
    series: [
      {values: om, color: "var(--s1)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart of quarterly operating margin, between 17.9% and 20.4%, reaching 20.4% in the third quarter of 2026",
    rows: i => [
      ["var(--s1)", "Operating margin", om[i] == null ? "—" : om[i].toFixed(1) + "%"],
      [null, "Operating income", m(D.op_inc[i])],
    ],
  });
  FD.stacked(document.getElementById("c-cash"), {
    years: Y, xlab, title, step: 0.1, fmt: v => v.toFixed(1),
    bottom: {values: D.fcf.map(v => v == null ? 0 : v / 1000), color: "var(--s1)"},
    top: {values: D.capex.map(v => v == null ? 0 : v / 1000), color: "var(--s2)"},
    aria: "Stacked columns: quarterly cash from operations split into capital spending and free cash flow. Cash from operations was between $124 million and $240 million a quarter; $168 million in the third quarter of 2026.",
    rows: i => [
      [null, "Cash from operations", m(D.ocf[i])],
      ["var(--s2)", "Capital spending", m(D.capex[i])],
      ["var(--s1)", "Free cash flow", m(D.fcf[i])],
    ],
  });
});

FD.table(document.getElementById("t-all"),
  {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i] == null ? "—" : D.revenue[i], fmt: mm, strong: true},
    {name: "Growth vs year earlier", get: i => yoy(i)},
    {name: "Operating income", get: i => D.op_inc[i] == null ? "—" : D.op_inc[i], fmt: mm, strong: true},
    {name: "Operating margin", get: i => om[i] == null ? "—" : om[i], fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Pre-tax income", get: i => D.pretax[i] == null ? "—" : D.pretax[i], fmt: mm},
    {name: "Income tax", get: i => D.tax[i] == null ? "—" : D.tax[i], fmt: mm},
    {name: "Net income", get: i => D.net_inc[i] == null ? "—" : D.net_inc[i], fmt: mm, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i] == null ? "—" : D.eps[i], fmt: v => minus(v.toFixed(2))},
    {name: "Diluted shares (millions)", get: i => D.shares[i] == null ? "—" : D.shares[i], fmt: v => v.toLocaleString("en-US")},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i] == null ? "—" : D.ocf[i], fmt: mm, strong: true},
    {name: "Capital spending", get: i => D.capex[i] == null ? "—" : D.capex[i], fmt: mm},
    {name: "Free cash flow", get: i => D.fcf[i] == null ? "—" : D.fcf[i], fmt: mm, strong: true},
    {name: "Dividends paid", get: i => D.dividends[i] == null ? "—" : D.dividends[i], fmt: mm},
    {name: "Share buybacks", get: i => D.buybacks[i] == null ? "—" : D.buybacks[i], fmt: mm},
    {section: "Balance sheet at quarter end"},
    {name: "Cash and cash equivalents", get: i => D.cash[i] == null ? "—" : D.cash[i], fmt: mm},
    {name: "Total debt", get: i => D.debt[i] == null ? "—" : D.debt[i], fmt: mm},
    {name: "Total assets", get: i => D.total_assets[i] == null ? "—" : D.total_assets[i], fmt: mm},
    {name: "Shareholders' equity (deficit)", get: i => D.equity[i] == null ? "—" : D.equity[i], fmt: mm},
  ]);
