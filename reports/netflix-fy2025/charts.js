const D = window.REPORT_DATA;
const Y = D.FY, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, values: D.revenue.map(v => v / 1000), step: 10,
    labels: [0, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Netflix revenue, from $15.8 billion in 2018 to $45.2 billion in 2025",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
      [null, "Growth", i ? (pct(D.revenue[i], D.revenue[i - 1]) - 100).toFixed(1) + "%" : "—"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, max: 60, step: 20, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: gross margin rising from 36.9% in 2018 to 48.5% in 2025; operating margin rising from 10.2% to 29.5%",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.columns(document.getElementById("c-fcf"), {
    years: Y, values: D.fcf.map(v => v / 1000), step: 4,
    labels: [1, L], labelFmt: i => sbn(D.fcf[i]),
    aria: "Column chart of Netflix free cash flow: negative in 2018, 2019 and 2021, at minus $3.1 billion in 2019, and $9.5 billion in 2025",
    rows: i => [
      [null, "Cash from operations", "$" + sbn(D.ocf[i]) + "B"],
      [null, "Property and equipment", "$" + bn(D.capex[i]) + "B"],
      ["var(--s1)", "Free cash flow", "$" + sbn(D.fcf[i]) + "B"],
      [null, "Share buybacks", "$" + bn(D.buybacks[i]) + "B"],
    ],
  });
});

FD.table(document.getElementById("t-bs"),
  {head: "December 31", idx: [1, 3, 5, 6, 7], label: i => Y[i]},
  [
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Cash minus debt", get: i => D.cash[i] - D.debt[i], fmt: sbn, strong: true},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
  ]);

FD.table(document.getElementById("t-all"),
  {head: "Fiscal year", idx: [...Array(N).keys()], label: i => "FY" + String(Y[i]).slice(2)},
  [
    {section: "Income statement"},
    {name: "Revenue", get: i => D.revenue[i], fmt: bn, strong: true},
    {name: "Revenue growth", get: i => i ? pct(D.revenue[i], D.revenue[i - 1]) - 100 : "—", fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Gross profit", get: i => D.gross[i], fmt: bn},
    {name: "Gross margin", get: i => gm[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Technology and development", get: i => D.rnd[i], fmt: bn},
    {name: "Operating income", get: i => D.op_inc[i], fmt: bn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Other income (expense), net", get: i => D.nonop[i], fmt: sbn},
    {name: "Income tax", get: i => D.tax[i], fmt: bn},
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {name: "Diluted shares (millions)", get: i => D.shares[i], fmt: v => v.toLocaleString("en-US")},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: sbn, strong: true},
    {name: "Purchases of property and equipment", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: sbn, strong: true},
    {name: "Free cash flow margin", get: i => pct(D.fcf[i], D.revenue[i]), fmt: v => minus(v.toFixed(1)) + "%"},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at December 31"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Property and equipment, net", get: i => D.ppe[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
