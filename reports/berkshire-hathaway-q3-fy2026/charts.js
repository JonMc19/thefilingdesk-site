const D = window.REPORT_DATA, Y = D.Q, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const xlab = (i, short) => short ? "Q" + String(Y[i]).slice(-1) : D.label[i].replace(" FY", " ’").replace("’20", "’");
FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {years: Y, xlab, values: D.revenue.map(v => v == null ? null : v / 1000),
    step: 25, labels: [L - 4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Berkshire Hathaway quarterly revenue, from $93.4 billion in Q4 FY2023 to $105.6 billion in Q3 FY2026",
    rows: i => [["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"]]});
  FD.columns(document.getElementById("c-ni"), {years: Y, xlab, values: D.net_inc.map(v => v == null ? null : v / 1000),
    step: 10, labels: [L - 4, L], labelFmt: i => bn(D.net_inc[i]),
    aria: "Column chart of Berkshire Hathaway quarterly net income, ranging from $4.6 billion in Q1 FY2025 to $37.6 billion in Q4 FY2023; $22.1 billion in Q3 FY2026",
    rows: i => [["var(--s1)", "Net income", "$" + bn(D.net_inc[i]) + "B"]]});
  FD.columns(document.getElementById("c-bb"), {years: Y, xlab, values: D.buybacks.map(v => v == null ? null : v / 1000),
    step: 2, labels: [L - 1, L], labelFmt: i => bn(D.buybacks[i]),
    aria: "Column chart of Berkshire Hathaway quarterly share buybacks: none from Q3 FY2024 to Q4 FY2025, then $9.3 billion in Q3 FY2026",
    rows: i => [["var(--s1)", "Buybacks", "$" + bn(D.buybacks[i]) + "B"]]});
  FD.table(document.getElementById("t-all"), {head: "Quarter", idx: [...Y.keys()], label: i => D.label[i]}, [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: v => v == null ? "—" : bn(v), strong: true},
    {name: "Pre-tax income", get: i => D.pretax[i], fmt: v => v == null ? "—" : bn(v)},
    {name: "Income tax", get: i => D.tax[i], fmt: v => v == null ? "—" : bn(v)},
    {name: "Net income", get: i => D.net_inc[i], fmt: v => v == null ? "—" : bn(v), strong: true},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: v => v == null ? "—" : bn(v), strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: v => v == null ? "—" : bn(v)},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: v => v == null ? "—" : sbn(v), strong: true},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: v => v == null ? "—" : bn(v)},
    {section: "Balance sheet"},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: v => v == null ? "—" : bn(v)},
  ]);
});
