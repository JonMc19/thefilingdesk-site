const D = window.REPORT_DATA;
const Y = D.FY, N = Y.length, L = N - 1;
const {bn, sbn, pct, minus} = FD;
const gm = D.gross.map((g, i) => pct(g, D.revenue[i]));
const om = D.op_inc.map((o, i) => pct(o, D.revenue[i]));
const pay = D.buybacks.map((b, i) => b + D.dividends[i]);

FD.draw(() => {
  FD.columns(document.getElementById("c-rev"), {
    years: Y, values: D.revenue.map(v => v / 1000), step: 20,
    labels: [0, L], labelFmt: i => bn(D.revenue[i]),
    aria: "Column chart of Accenture revenue, from $43.2 billion in fiscal 2019 to $74.2 billion in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Revenue", "$" + bn(D.revenue[i]) + "B"],
      [null, "Growth", i ? (pct(D.revenue[i], D.revenue[i - 1]) - 100).toFixed(1) + "%" : "—"],
    ],
  });
  FD.lines(document.getElementById("c-margin"), {
    years: Y, max: 40, step: 10, fmt: v => v + "%",
    series: [
      {values: gm, color: "var(--s1)", end: "Gross " + gm[L].toFixed(1) + "%"},
      {values: om, color: "var(--s2)", end: "Operating " + om[L].toFixed(1) + "%"},
    ],
    aria: "Line chart: gross margin between 30.8% and 32.6%; operating margin between 13.7% and 15.4%, ending at 15.4% in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Gross margin", gm[i].toFixed(1) + "%"],
      ["var(--s2)", "Operating margin", om[i].toFixed(1) + "%"],
    ],
  });
  FD.stacked(document.getElementById("c-pay"), {
    years: Y, step: 3,
    bottom: {values: D.dividends.map(v => v / 1000), color: "var(--s1)"},
    top: {values: D.buybacks.map(v => v / 1000), color: "var(--s2)"},
    endLabel: bn(pay[L]),
    aria: "Stacked columns: dividends and share buybacks, fiscal 2019 to 2026. The total grows from $4.6 billion to $11.5 billion, with buybacks of $7.5 billion in fiscal 2026.",
    rows: i => [
      ["var(--s2)", "Share buybacks", "$" + bn(D.buybacks[i]) + "B"],
      ["var(--s1)", "Dividends", "$" + bn(D.dividends[i]) + "B"],
      [null, "Free cash flow", "$" + bn(D.fcf[i]) + "B"],
      [null, "Share of free cash flow", pct(pay[i], D.fcf[i]).toFixed(0) + "%"],
    ],
  });
  FD.lines(document.getElementById("c-debt"), {
    years: Y, max: 14, step: 2, fmt: v => v,
    series: [
      {values: D.cash.map(v => v / 1000), color: "var(--s1)", end: "Cash " + bn(D.cash[L])},
      {values: D.debt.map(v => v / 1000), color: "var(--s2)", end: "Debt " + bn(D.debt[L])},
    ],
    aria: "Line chart: cash and short-term investments between $5.0 billion and $12.8 billion; total debt near zero until fiscal 2023, then rising to $10.1 billion in fiscal 2026",
    rows: i => [
      ["var(--s1)", "Cash and short-term investments", "$" + bn(D.cash[i]) + "B"],
      ["var(--s2)", "Total debt", "$" + bn(D.debt[i]) + "B"],
      [null, "Cash minus debt", "$" + sbn(D.cash[i] - D.debt[i]) + "B"],
    ],
  });
});

FD.table(document.getElementById("t-bs"),
  {head: "August 31", idx: [0, 4, 5, 6, 7], label: i => Y[i]},
  [
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Cash minus debt", get: i => D.cash[i] - D.debt[i], fmt: sbn, strong: true},
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
    {name: "Operating income", get: i => D.op_inc[i], fmt: bn, strong: true},
    {name: "Operating margin", get: i => om[i], fmt: v => v.toFixed(1) + "%"},
    {name: "Interest expense", get: i => D.interest[i], fmt: bn},
    {name: "Income tax", get: i => D.tax[i], fmt: bn},
    {name: "Net income", get: i => D.net_inc[i], fmt: bn, strong: true},
    {name: "Diluted EPS (US$)", get: i => D.eps[i], fmt: v => v.toFixed(2)},
    {name: "Diluted shares (millions)", get: i => D.shares[i], fmt: v => v.toLocaleString("en-US")},
    {section: "Cash flow"},
    {name: "Cash from operations", get: i => D.ocf[i], fmt: bn, strong: true},
    {name: "Capital spending", get: i => D.capex[i], fmt: bn},
    {name: "Free cash flow", get: i => D.fcf[i], fmt: bn, strong: true},
    {name: "Free cash flow margin", get: i => pct(D.fcf[i], D.revenue[i]), fmt: v => v.toFixed(1) + "%"},
    {name: "Acquisitions", get: i => D.acquisitions[i], fmt: bn},
    {name: "Dividends paid", get: i => D.dividends[i], fmt: bn},
    {name: "Share buybacks", get: i => D.buybacks[i], fmt: bn},
    {name: "Stock-based compensation", get: i => D.sbc[i], fmt: bn},
    {section: "Balance sheet at August 31"},
    {name: "Cash and short-term investments", get: i => D.cash[i], fmt: bn},
    {name: "Total debt", get: i => D.debt[i], fmt: bn},
    {name: "Total assets", get: i => D.total_assets[i], fmt: bn},
    {name: "Shareholders' equity", get: i => D.equity[i], fmt: bn},
  ]);
