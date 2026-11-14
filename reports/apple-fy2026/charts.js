const D = window.REPORT_DATA;
const Y = D.FY, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const paid = D.buybacks.map((b, i) => b + D.dividends[i]);

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, values: D.revenue.map(v => v / 1000), step: 100,
    labels: [0, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Apple revenue, from $260.2 billion in fiscal 2019 to $478.8 billion in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
      [null, "Growth", i ? minus((pct(D.revenue[i], D.revenue[i - 1]) - 100).toFixed(1)) + "%" : "—"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, max: 60, step: 20, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: gross margin rising from 37.8% in fiscal 2019 to 48.8% in fiscal 2026; operating margin rising from 24.6% to 33.0%",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.stacked(document.getElementById("c-cash"), {
    years: Y, step: 50,
    bottom: {values: D.fcf.map(v => v / 1000), color: "var(--s1)"},
    top: {values: D.capex.map(v => v / 1000), color: "var(--s2)"},
    endLabel: bn(D.ocf[L]),
    aria: "Stacked columns: operating cash flow split into capital spending and free cash flow, fiscal 2019 to 2026. Capital spending stays between $7.3 billion and $12.7 billion; free cash flow rises from $58.9 billion to $136.1 billion.",
    rows: i => [
      [null, "Operating cash flow", "$" + bn(D.ocf[i]) + "B"],
      ["var(--s2)", "Capital spending", "$" + bn(D.capex[i]) + "B"],
      ["var(--s1)", "Free cash flow", "$" + bn(D.fcf[i]) + "B"],
    ],
  });
  FD.stacked(document.getElementById("c-pay"), {
    years: Y, step: 50,
    bottom: {values: D.dividends.map(v => v / 1000), color: "var(--s1)"},
    top: {values: D.buybacks.map(v => v / 1000), color: "var(--s2)"},
    endLabel: bn(paid[L]),
    aria: "Stacked columns: dividends and buybacks, fiscal 2019 to 2026. Total payouts range from $81.0 billion to $110.2 billion and were $102.1 billion in fiscal 2026.",
    rows: i => [
      ["var(--s2)", "Buybacks", "$" + bn(D.buybacks[i]) + "B"],
      ["var(--s1)", "Dividends", "$" + bn(D.dividends[i]) + "B"],
      [null, "Share of free cash flow", pct(paid[i], D.fcf[i]).toFixed(0) + "%"],
    ],
  });
});

FD.table(document.getElementById("t-bs"),
  {head: "End of fiscal year", idx: [0, 4, 5, 6, 7], label: i => Y[i]},
  [
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Cash minus debt", get: i => D.cash[i] - D.debt[i], fmt: sbn, strong: true},
    {name: "Property, plant and equipment, net", get: i => D.ppe[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
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
    {name: "Other income (expense), net", get: i => D.nonop[i], fmt: sbn},
    {name: "Income tax", get: i => D.tax[i], fmt: bn},
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {name: "Diluted shares (millions)", get: i => D.shares[i], fmt: v => v.toLocaleString("en-US")},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Payments for property and equipment", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: bn, strong: true},
    {name: "Free cash flow margin", get: i => pct(D.fcf[i], D.revenue[i]), fmt: v => v.toFixed(1) + "%"},
    {name: "Dividends paid", get: i => D.dividends[i], fmt: bn},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at fiscal year end"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Finance lease liabilities", get: i => D.leases[i], fmt: bn},
    {name: "Property, plant and equipment, net", get: i => D.ppe[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
