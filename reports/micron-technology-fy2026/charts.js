const D = window.REPORT_DATA;
const Y = D.FY, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const pc = v => minus(v.toFixed(1)) + "%";

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, values: D.revenue.map(v => v / 1000), step: 25,
    labels: [4, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Micron revenue: $23.4 billion in fiscal 2019, a low of $15.5 billion in fiscal 2023, $37.4 billion in fiscal 2025 and $133.2 billion in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
      [null, "Growth", i ? pc(pct(D.revenue[i], D.revenue[i - 1]) - 100) : "—"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, max: 100, min: -40, step: 20, fmt: v => minus(v) + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: gross margin fell from 45.7% in fiscal 2019 to minus 9.1% in fiscal 2023, then rose to 80.7% in fiscal 2026; operating margin went from minus 37.0% in fiscal 2023 to 74.6% in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Gross margin", pc(gm[i])],
      ["var(--s2)", "Operating margin", pc(om[i])],
    ],
  });
  FD.lines(document.getElementById("c-cash"), {
    years: Y, max: 90, step: 20, fmt: v => v,
    series: [
      {values: D.ocf.map(v => v / 1000), color: "var(--s1)", end: "Operations " + bn(D.ocf[L])},
      {values: D.capex.map(v => v / 1000), color: "var(--s2)", end: "Capex " + bn(D.capex[L])},
    ],
    aria: "Line chart: cash from operations and capital spending, fiscal 2019 to 2026. Capital spending was close to operating cash flow in most years until fiscal 2026, when operating cash flow reached $89.7 billion and capital spending $30.7 billion.",
    rows: i => [
      ["var(--s1)", "Cash from operations", "$" + bn(D.ocf[i]) + "B"],
      ["var(--s2)", "Capital spending", "$" + bn(D.capex[i]) + "B"],
      [null, "Capex share of cash", pct(D.capex[i], D.ocf[i]).toFixed(0) + "%"],
    ],
  });
  FD.columns(document.getElementById("c-fcf"), {
    years: Y, values: D.fcf.map(v => v / 1000), step: 20,
    labels: [L], labelFmt: i => bn(D.fcf[i]),
    aria: "Column chart of Micron free cash flow: between minus $6.1 billion and $3.4 billion from fiscal 2019 to 2025, then $59.0 billion in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Free cash flow", "$" + sbn(D.fcf[i]) + "B"],
      [null, "Share of revenue", pc(pct(D.fcf[i], D.revenue[i]))],
    ],
  });
});

FD.table(document.getElementById("t-bs"),
  {head: "Fiscal year end", idx: [0, 4, 5, 6, 7], label: i => Y[i]},
  [
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Finance lease liabilities", get: i => D.leases[i], fmt: bn},
    {name: "Cash minus debt and leases", get: i => D.cash[i] - D.debt[i] - D.leases[i], fmt: sbn, strong: true},
    {name: "Property, plant and equipment, net", get: i => D.ppe[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);

FD.table(document.getElementById("t-all"),
  {head: "Fiscal year", idx: [...Array(N).keys()], label: i => "FY" + String(Y[i]).slice(2)},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: bn, strong: true},
    {name: "Revenue growth", get: i => i ? pct(D.revenue[i], D.revenue[i - 1]) - 100 : "—", fmt: pc},
    {name: "Gross profit", get: i => D.gross[i], fmt: sbn},
    {name: "Gross margin", get: i => gm[i], fmt: pc},
    {name: "Research and development", get: i => D.rnd[i], fmt: bn},
    {name: "Operating income", get: i => D.op_inc[i], fmt: sbn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: pc},
    {name: "Other income (expense), net", get: i => D.nonop[i], fmt: sbn},
    {name: "Income tax", get: i => D.tax[i], fmt: bn},
    {name: "Net income", get: i => D.net_inc[i], fmt: sbn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => minus(v.toFixed(2))},
    {name: "Diluted shares (millions)", get: i => D.shares[i], fmt: v => v.toLocaleString("en-US")},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: sbn, strong: true},
    {name: "Free cash flow margin", get: i => pct(D.fcf[i], D.revenue[i]), fmt: pc},
    {name: "Dividends paid", get: i => D.dividends[i], fmt: bn},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at fiscal year end"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Finance lease liabilities", get: i => D.leases[i], fmt: bn},
    {name: "Property, plant and equipment, net", get: i => D.ppe[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
