const D = window.REPORT_DATA;
const Y = D.FY, N = Y.length, L = N - 1;
const {bn, pct, minus} = FD;
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
// capital spending, and so free cash flow, starts in fiscal 2022
const F0 = D.capex.findIndex(v => v != null);
const YF = Y.slice(F0);
const ret = D.buybacks.map((b, i) => b + D.dividends[i]);

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, values: D.revenue.map(v => v / 1000), step: 50,
    labels: [0, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Nvidia revenue, from $11.7 billion in fiscal 2019 to $215.9 billion in fiscal 2026, with most of the growth after fiscal 2023",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
      [null, "Growth", i ? minus((pct(D.revenue[i], D.revenue[i - 1]) - 100).toFixed(1)) + "%" : "—"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, max: 80, step: 20, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: gross margin between 56.9% and 75.0%, peaking in fiscal 2025 and falling to 71.1% in fiscal 2026; operating margin from 15.7% in fiscal 2023 to 62.4% in fiscal 2025 and 60.4% in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.stacked(document.getElementById("c-cash"), {
    years: YF, step: 20,
    bottom: {values: D.fcf.slice(F0).map(v => v / 1000), color: "var(--s1)"},
    top: {values: D.capex.slice(F0).map(v => v / 1000), color: "var(--s2)"},
    endLabel: bn(D.ocf[L]),
    aria: "Stacked columns: operating cash flow split into capital spending and free cash flow, fiscal 2022 to 2026. Operating cash flow grows from $9.1 billion to $102.7 billion; capital spending stays small, at $6.0 billion in fiscal 2026.",
    rows: k => {
      const i = F0 + k;
      return [
        [null, "Operating cash flow", "$" + bn(D.ocf[i]) + "B"],
        ["var(--s2)", "Capital spending", "$" + bn(D.capex[i]) + "B"],
        ["var(--s1)", "Free cash flow", "$" + bn(D.fcf[i]) + "B"],
        [null, "Capex share of cash", pct(D.capex[i], D.ocf[i]).toFixed(1) + "%"],
      ];
    },
  });
  FD.columns(document.getElementById("c-ret"), {
    years: Y, values: ret.map(v => v / 1000), step: 10,
    labels: [L], labelFmt: i => bn(ret[i]),
    aria: "Column chart of buybacks plus dividends, under $2 billion a year until fiscal 2022, then $10.4 billion in fiscal 2023, $34.5 billion in fiscal 2025 and $41.1 billion in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Buybacks and dividends", "$" + bn(ret[i]) + "B"],
      [null, "Buybacks", "$" + bn(D.buybacks[i]) + "B"],
      [null, "Dividends", "$" + bn(D.dividends[i]) + "B"],
    ],
  });
});

FD.table(document.getElementById("t-bs"),
  {head: "Fiscal year end", idx: [0, 4, 5, 6, 7], label: i => "FY" + String(Y[i]).slice(2)},
  [
    {name: "Cash and short-term investments", get: i => D.cash[i] == null ? "—" : D.cash[i], fmt: bn},
    {name: "Debt", get: i => D.debt[i], fmt: bn},
    {name: "Property and equipment, net", get: i => D.ppe[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn, strong: true},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn, strong: true},
  ]);

FD.table(document.getElementById("t-all"),
  {head: "Fiscal year", idx: [...Array(N).keys()], label: i => "FY" + String(Y[i]).slice(2)},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: bn, strong: true},
    {name: "Revenue growth", get: i => i ? pct(D.revenue[i], D.revenue[i - 1]) - 100 : "—", fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Gross profit", get: i => D.gross[i], fmt: bn},
    {name: "Gross margin", get: i => gm[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Research and development", get: i => D.rnd[i], fmt: bn},
    {name: "Operating income", get: i => D.op_inc[i], fmt: bn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Other income (expense), net", get: i => D.nonop[i], fmt: FD.sbn},
    {name: "Income tax", get: i => D.tax[i], fmt: FD.sbn},
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {name: "Diluted shares (millions)", get: i => D.shares[i], fmt: v => v.toLocaleString("en-US")},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Capital spending", get: i => D.capex[i] == null ? "—" : D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i] == null ? "—" : D.fcf[i], fmt: bn, strong: true},
    {name: "Free cash flow margin", get: i => D.fcf[i] == null ? "—" : pct(D.fcf[i], D.revenue[i]), fmt: v => v.toFixed(1) + "%"},
    {name: "Dividends paid", get: i => D.dividends[i], fmt: bn},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at fiscal year end"},
    {name: "Cash and short-term investments", get: i => D.cash[i] == null ? "—" : D.cash[i], fmt: bn},
    {name: "Debt", get: i => D.debt[i], fmt: bn},
    {name: "Property and equipment, net", get: i => D.ppe[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
