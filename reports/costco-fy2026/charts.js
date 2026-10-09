const D = window.REPORT_DATA;
const Y = D.FY, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
// fiscal 2019 gross profit in the structured data doesn't match the income statement, so it is left out
const gross = D.gross.map((g, i) => i === 0 ? null : g);
const gm = gross.map((g, i) => g == null ? null : pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const dash = (v, fmt) => v == null ? "—" : fmt(v);

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, values: D.revenue.map(v => v / 1000), step: 100,
    labels: [0, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Costco revenue, from $152.7 billion in fiscal 2019 to $303.2 billion in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
      [null, "Growth", i ? (pct(D.revenue[i], D.revenue[i - 1]) - 100).toFixed(1) + "%" : "—"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, max: 15, step: 5, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: gross margin between 12.2% and 13.1% from fiscal 2020 to 2026; operating margin rising from 3.1% in fiscal 2019 to 3.9% in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Gross margin", dash(gm[i], v => v.toFixed(1) + "%")],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.stacked(document.getElementById("c-cash"), {
    years: Y, step: 5,
    bottom: {values: D.fcf.map(v => v / 1000), color: "var(--s1)"},
    top: {values: D.capex.map(v => v / 1000), color: "var(--s2)"},
    endLabel: bn(D.ocf[L]),
    aria: "Stacked columns: operating cash flow split into capital spending and free cash flow, fiscal 2019 to 2026. Operating cash flow grows from $6.4 billion to $15.8 billion; free cash flow dips to $3.5 billion in fiscal 2022 and reaches $9.4 billion in fiscal 2026.",
    rows: i => [
      [null, "Operating cash flow", "$" + bn(D.ocf[i]) + "B"],
      ["var(--s2)", "Capital spending", "$" + bn(D.capex[i]) + "B"],
      ["var(--s1)", "Free cash flow", "$" + bn(D.fcf[i]) + "B"],
      [null, "Capex share of cash", pct(D.capex[i], D.ocf[i]).toFixed(0) + "%"],
    ],
  });
  FD.columns(document.getElementById("c-div"), {
    years: Y, values: D.dividends.map(v => v / 1000), step: 2,
    labels: [2, 5, L], labelFmt: i => bn(D.dividends[i]),
    aria: "Column chart of Costco dividends paid, fiscal 2019 to 2026, with peaks of $5.7 billion in fiscal 2021 and $9.0 billion in fiscal 2024 from special dividends, and $2.5 billion in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Dividends paid", "$" + bn(D.dividends[i]) + "B"],
      [null, "Share buybacks", "$" + bn(D.buybacks[i]) + "B"],
    ],
  });
});

FD.table(document.getElementById("t-bs"),
  {head: "Fiscal year end", idx: [0, 4, 5, 6, 7], label: i => Y[i]},
  [
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Cash minus debt", get: i => D.cash[i] - D.debt[i], fmt: sbn, strong: true},
    {name: "Property and equipment, net", get: i => D.ppe[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);

FD.table(document.getElementById("t-all"),
  {head: "Fiscal year", idx: [...Array(N).keys()], label: i => "FY" + String(Y[i]).slice(2)},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: bn, strong: true},
    {name: "Revenue growth", get: i => i ? pct(D.revenue[i], D.revenue[i - 1]) - 100 : "—", fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Gross profit", get: i => dash(gross[i], bn), fmt: bn},
    {name: "Gross margin", get: i => dash(gm[i], v => v.toFixed(1) + "%"), fmt: v => v.toFixed(1) + "%"},
    {name: "Operating income", get: i => D.op_inc[i], fmt: bn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Other income (expense), net", get: i => D.nonop[i], fmt: sbn},
    {name: "Income tax", get: i => D.tax[i], fmt: bn},
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {name: "Diluted shares (millions)", get: i => D.shares[i], fmt: v => v.toLocaleString("en-US")},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: bn, strong: true},
    {name: "Free cash flow margin", get: i => pct(D.fcf[i], D.revenue[i]), fmt: v => v.toFixed(1) + "%"},
    {name: "Dividends paid", get: i => D.dividends[i], fmt: bn},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at fiscal year end"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Property and equipment, net", get: i => D.ppe[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
