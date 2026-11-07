const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const nm = D.net_inc.map((o, i) => pct(o, D.revenue[i]));
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000), step: 20,
    labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of General Motors quarterly revenue, between $43.0 billion and $50.0 billion over twelve quarters, reaching $50.0 billion in the third quarter of 2026",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, xlab, min: -10, max: 10, step: 5, fmt: v => minus(v) + "%",
    series: [
      {values: om, color: "var(--s1)", end: "Operating " + minus(om[L].toFixed(1)) + "%"},
      {values: nm, color: "var(--s2)", end: "Net " + minus(nm[L].toFixed(1)) + "%"},
    ],
    aria: "Line chart of operating margin and net margin by quarter. Operating margin fell to minus 8.1% in the fourth quarter of 2025 and recovered to 7.2% in the third quarter of 2026; net margin was 6.7%.",
    rows: i => [
      ["var(--s1)", "Operating margin", minus(om[i].toFixed(1)) + "%"],
      ["var(--s2)", "Net margin", minus(nm[i].toFixed(1)) + "%"],
    ],
  });
  FD.stacked(document.getElementById("c-cash"), {
    years: Y, xlab, step: 2,
    bottom: {values: D.fcf.map(v => v == null ? 0 : Math.max(v, 0) / 1000), color: "var(--s1)"},
    top: {values: D.capex.map(v => v == null ? 0 : v / 1000), color: "var(--s2)"},
    endLabel: bn(D.ocf[L]),
    aria: "Stacked columns: operating cash flow split into capital spending and free cash flow by quarter. In the third quarter of 2026, cash from operations was $7.3 billion, of which capital spending was $2.3 billion and free cash flow $5.0 billion.",
    rows: i => [
      [null, "Operating cash flow", "$" + bn(D.ocf[i]) + "B"],
      ["var(--s2)", "Capital spending", "$" + bn(D.capex[i]) + "B"],
      ["var(--s1)", "Free cash flow", minus("$" + sbn(D.fcf[i])) + "B"],
    ],
  });
  FD.table(document.getElementById("t-all"),
    {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]},
    [
      {section: "Income statement"},
      {name: "Revenue", get: i => D.revenue[i], fmt: v => v == null ? "—" : bn(v), strong: true},
      {name: "Operating income", get: i => D.op_inc[i], fmt: v => v == null ? "—" : sbn(v), strong: true},
      {name: "Operating margin", get: i => om[i], fmt: v => minus(v.toFixed(1)) + "%"},
      {name: "Income tax", get: i => D.tax[i], fmt: v => v == null ? "—" : sbn(v)},
      {name: "Net income", get: i => D.net_inc[i], fmt: v => v == null ? "—" : sbn(v), strong: true},
      {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v == null ? "—" : minus(v.toFixed(2))},
      {name: "Diluted shares (millions)", get: i => D.shares[i], fmt: v => v == null ? "—" : v.toLocaleString("en-US")},
      {section: "Cash flow"},
      {name: "Cash from operations", get: i => D.ocf[i], fmt: v => v == null ? "—" : bn(v), strong: true},
      {name: "Capital spending", get: i => D.capex[i], fmt: v => v == null ? "—" : bn(v)},
      {name: "Free cash flow", get: i => D.fcf[i], fmt: v => v == null ? "—" : sbn(v), strong: true},
      {name: "Dividends paid", get: i => D.dividends[i], fmt: v => v == null ? "—" : bn(v)},
      {name: "Share buybacks", get: i => D.buybacks[i], fmt: v => v == null ? "—" : bn(v)},
      {section: "Balance sheet at quarter end"},
      {name: "Cash and cash equivalents", get: i => D.cash[i], fmt: v => v == null ? "—" : bn(v)},
      {name: "Total assets", get: i => D.total_assets[i], fmt: v => v == null ? "—" : bn(v)},
      {name: "Stockholders' equity", get: i => D.equity[i], fmt: v => v == null ? "—" : bn(v)},
    ]);
});
