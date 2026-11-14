const D = window.REPORT_DATA;
const Y = D.FY, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const nm = D.net_inc.map((n, i) => pct(n, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, values: D.revenue.map(v => v / 1000), step: 10,
    labels: [0, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Starbucks revenue, from $26.5 billion in fiscal 2019 to $37.9 billion in fiscal 2026, with a dip to $23.5 billion in fiscal 2020",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
      [null, "Growth", i ? minus((pct(D.revenue[i], D.revenue[i - 1]) - 100).toFixed(1)) + "%" : "—"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, max: 20, step: 5, fmt: v => v + "%",
    series: [
      {values: om, color: "var(--s1)", end: "Operating " + om[L].toFixed(1) + "%"},
      {values: nm, color: "var(--s2)", end: "Net " + nm[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: operating margin between 14.3% and 16.8% from fiscal 2019 to 2024 except 6.6% in fiscal 2020, falling to 7.9% in fiscal 2025 and recovering to 9.7% in fiscal 2026; net margin 6.7% in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Operating margin", om[i].toFixed(1) + "%"],
      ["var(--s2)", "Net margin", nm[i].toFixed(1) + "%"],
    ],
  });
  FD.stacked(document.getElementById("c-cash"), {
    years: Y, step: 2,
    bottom: {values: D.fcf.map(v => v / 1000), color: "var(--s1)"},
    top: {values: D.capex.map(v => v / 1000), color: "var(--s2)"},
    endLabel: bn(D.ocf[L]),
    aria: "Stacked columns: operating cash flow split into capital spending and free cash flow, fiscal 2019 to 2026. Capital spending peaks at $2.8 billion in fiscal 2024 and falls to $1.3 billion in fiscal 2026; free cash flow rises from $2.4 billion to $3.7 billion in the last year.",
    rows: i => [
      [null, "Operating cash flow", "$" + bn(D.ocf[i]) + "B"],
      ["var(--s2)", "Capital spending", "$" + bn(D.capex[i]) + "B"],
      ["var(--s1)", "Free cash flow", "$" + bn(D.fcf[i]) + "B"],
      [null, "Capex share of cash", pct(D.capex[i], D.ocf[i]).toFixed(0) + "%"],
    ],
  });
});

FD.table(document.getElementById("t-bs"),
  {head: "Fiscal year end", idx: [0, 4, 5, 6, 7], label: i => Y[i]},
  [
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Debt minus cash", get: i => D.debt[i] - D.cash[i], fmt: sbn, strong: true},
    {name: "Property and equipment, net", get: i => D.ppe[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: sbn},
  ]);

FD.table(document.getElementById("t-all"),
  {head: "Fiscal year", idx: [...Array(N).keys()], label: i => "FY" + String(Y[i]).slice(2)},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: bn, strong: true},
    {name: "Revenue growth", get: i => i ? pct(D.revenue[i], D.revenue[i - 1]) - 100 : "—", fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Operating income", get: i => D.op_inc[i], fmt: bn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Other income (expense), net", get: i => D.nonop[i], fmt: sbn},
    {name: "Interest expense", get: i => D.interest[i], fmt: bn},
    {name: "Income tax", get: i => D.tax[i], fmt: bn},
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Net margin", get: i => nm[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {name: "Diluted shares (millions)", get: i => D.shares[i], fmt: v => v.toLocaleString("en-US")},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Additions to property and equipment", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: bn, strong: true},
    {name: "Free cash flow margin", get: i => pct(D.fcf[i], D.revenue[i]), fmt: v => v.toFixed(1) + "%"},
    {name: "Depreciation and amortization", get: i => D.dna[i], fmt: bn},
    {name: "Dividends paid", get: i => D.dividends[i], fmt: bn},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at fiscal year end"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Property and equipment, net", get: i => D.ppe[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: sbn},
  ]);
