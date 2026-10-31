/* The Filing Desk: charts for company pages, drawn from window.COMPANY with the helpers in report.js.
   Tables on these pages are plain HTML from build.py; only the charts need script. A switch above the
   charts shows fiscal years or the last 12 quarters (window.COMPANY.quarterly); returns on capital
   stay annual, because they need a full year of income. */
(function () {
  const C = window.COMPANY, Q = C.quarterly;
  const has = a => a && a.some(v => v != null);
  const dash = "—";
  const num = (v, d = 1) => v == null ? dash : FD.minus(v.toLocaleString("en-US", {minimumFractionDigits: d, maximumFractionDigits: d}));
  const pctf = v => v == null ? dash : num(v) + "%";
  const S = C.cur || "$";   // the company's currency sign: a foreign company's figures are in its own currency
  const money = v => v == null ? dash : (v < 0 ? "−" : "") + S + (Math.abs(v) >= 1e6 && S !== "$" ? num(Math.abs(v) / 1e6) + "T"
    : Math.abs(v) >= 1000 ? num(Math.abs(v) / 1000) + "B" : num(Math.abs(v), 0) + "M");
  const bnv = a => a.map(v => v == null ? null : v / 1000);
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const longDate = iso => { const [y, m, d] = iso.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };

  // what the charts draw from: fiscal years, or the quarters with their own labels and tooltip headings
  const ANNUAL = {X: C.FY, D: C.data, M: C.metrics, unit: "year", xlab: null, title: null};
  const QUARTERS = Q && {
    X: Q.fq, D: Q.data, M: Q.metrics, unit: "quarter",
    // "Q3 ’25"; when tight "Q1’25 Q2 Q3 Q4"; when very tight only each fiscal year's first quarter, "’25"
    xlab: (i, short, tiny) => tiny ? (Q.fq[i] === 1 ? "’" + String(Q.fy[i]).slice(2) : "")
                            : short ? "Q" + Q.fq[i] + (Q.fq[i] === 1 ? "’" + String(Q.fy[i]).slice(2) : "")
                            : "Q" + Q.fq[i] + " ’" + String(Q.fy[i]).slice(2),
    title: i => [`Q${Q.fq[i]} fiscal ${Q.fy[i]}`, `to ${longDate(Q.period_end[i])}`],
    derived: (k, i) => Q.derived[k] && Q.derived[k][i],
  };

  // a gridline step that gives four or five lines over the data's range
  function niceStep(lo, hi) {
    const raw = Math.max(hi - Math.min(0, lo), 1e-9) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
  }
  const axis = step => v => FD.minus(+v.toFixed(step < 1 ? 2 : 0) + "");
  const range = series => {
    const vals = series.flatMap(s => s.values).filter(v => v != null);
    return [Math.min(0, ...vals), Math.max(0, ...vals)];
  };
  const el = id => document.getElementById(id);
  const show = (id, on) => { const f = el(id); if (f) f.closest("figure").hidden = !on; };

  function columns(P, id, values, {fmtAxis, rows, aria, color}) {
    if (!el(id)) return;
    show(id, has(values));
    if (!has(values)) return;
    const [lo, hi] = range([{values}]);
    const step = niceStep(lo, hi);
    FD.columns(el(id), {years: P.X, values, step, fmt: fmtAxis || axis(step), color, aria, rows, xlab: P.xlab, title: P.title});
  }

  // columns side by side, one per series in each period; a series with axis: "right" gets its own axis
  function grouped(P, id, series, {rows, aria, fmt}) {
    if (!el(id)) return;
    const on = series.some(s => has(s.values));
    show(id, on);
    if (!on) return;
    const left = series.filter(s => s.axis !== "right"), right = series.filter(s => s.axis === "right" && has(s.values));
    const [lo, hi] = range(left), step = niceStep(lo, hi);
    const [rlo, rhi] = right.length ? range(right) : [0, 0], rstep = right.length ? niceStep(rlo, rhi) : null;
    FD.grouped(el(id), {years: P.X, series, step, rstep, fmt: fmt ? fmt(step) : axis(step), rfmt: rstep ? (fmt ? fmt(rstep) : axis(rstep)) : null,
                        aria, rows, xlab: P.xlab, title: P.title});
  }

  function lines(P, id, series, {suffix = "%", rows, aria}) {
    if (!el(id)) return;
    series = series.filter(s => has(s.values));
    show(id, series.length > 0);
    if (!series.length) return;
    const [lo, hi] = range(series);
    const step = niceStep(lo, hi);
    series.forEach(s => {
      const last = [...s.values].reverse().find(v => v != null);
      s.end = s.label + " " + num(last) + suffix;
    });
    const fig = el(id).closest("figure");
    fig.querySelectorAll(".legend [data-key]").forEach(item => {
      item.hidden = !series.some(s => s.key === item.dataset.key);
    });
    FD.lines(el(id), {years: P.X, series, max: hi, min: lo, step, fmt: v => axis(step)(v) + suffix, aria, rows, xlab: P.xlab, title: P.title});
  }

  const line = (key, label, color, values) => ({key, label, color, values});
  // a tooltip line saying a quarter was worked out from the year's totals rather than filed as a quarter
  const workedOut = (P, k, i) => P.derived && P.derived(k, i) ? [[null, "Worked out as", "year minus 9 months"]] : [];

  function render(P) {
    const {D, M} = P, A = ANNUAL, per = P.unit === "year" ? "fiscal year" : "quarter";
    const growth = P.unit === "year" ? "Growth" : "Growth on a year earlier";
    grouped(P, "c-revni", [
      {values: bnv(D.revenue), color: "var(--s1)"},
      {values: bnv(D.net_income || []), color: "var(--s2)", axis: "right"},
    ], {
      aria: `Column chart: revenue (left axis) and net income (right axis) by ${per}, side by side; net losses in red`,
      rows: i => [
        ["var(--s1)", "Revenue", money(D.revenue[i])],
        [null, growth, pctf(M.revenue_growth[i])],
        ["var(--s2)", "Net income", money((D.net_income || [])[i])],
        [null, growth, pctf((M.net_income_growth || [])[i])],
        ...(M.net_margin ? [[null, "Net margin", pctf(M.net_margin[i])]] : []),
        ...workedOut(P, "revenue", i),
      ],
    });

    const eps = D.eps_diluted || [];
    columns(P, "c-eps", eps, {
      color: "var(--s2)",
      aria: `Column chart: diluted earnings per share by ${per}; losses in red`,
      rows: i => [
        ["var(--s2)", "Diluted earnings per share", eps[i] == null ? dash : (eps[i] < 0 ? "−" : "") + S + num(Math.abs(eps[i]), 2)],
        [null, P.unit === "year" ? "Growth" : "Growth on a year earlier", pctf((M.eps_growth || [])[i])],
        ...workedOut(P, "eps_diluted", i),
      ],
    });

    if (C.profile === "bank") {
      lines(A, "c-returns", [
        line("roe", "On equity", "var(--s1)", A.M.roe),
        line("rote", "On tangible equity", "var(--s2)", A.M.rote),
      ], {
        aria: "Line chart: return on equity and return on tangible common equity by fiscal year",
        rows: i => [["var(--s1)", "Return on equity", pctf(A.M.roe[i])], ["var(--s2)", "Return on tangible equity", pctf(A.M.rote[i])]],
      });
      lines(P, "c-bank", [
        line("efficiency_ratio", "Efficiency", "var(--s1)", M.efficiency_ratio),
        line("net_interest_share", "Net interest", "var(--s2)", M.net_interest_share),
      ], {
        aria: `Line chart: efficiency ratio and net interest income as a share of revenue, by ${per}`,
        rows: i => [["var(--s1)", "Efficiency ratio", pctf(M.efficiency_ratio[i])], ["var(--s2)", "Net interest income share", pctf(M.net_interest_share && M.net_interest_share[i])]],
      });
    } else {
      lines(P, "c-margins", [
        line("gross_margin", "Gross", "var(--s1)", M.gross_margin),
        line("operating_margin", "Operating", "var(--s2)", M.operating_margin),
        line("net_margin", "Net", "var(--s3)", M.net_margin),
        line("fcf_margin", "FCF", "var(--s4)", M.fcf_margin),
      ], {
        aria: `Line chart: gross, operating, net and free cash flow margins by ${per}`,
        rows: i => [
          ["var(--s1)", "Gross margin", pctf(M.gross_margin[i])],
          ["var(--s2)", "Operating margin", pctf(M.operating_margin[i])],
          ["var(--s3)", "Net margin", pctf(M.net_margin[i])],
          ["var(--s4)", "Free cash flow margin", pctf(M.fcf_margin[i])],
          ...workedOut(P, "revenue", i),
        ],
      });
      lines(A, "c-returns", [
        line("roic", "On capital", "var(--s1)", A.M.roic),
        line("roe", "On equity", "var(--s2)", A.M.roe),
      ], {
        aria: "Line chart: return on capital and return on equity by fiscal year",
        rows: i => [["var(--s1)", "Return on capital", pctf(A.M.roic[i])], ["var(--s2)", "Return on equity", pctf(A.M.roe[i])]],
      });
      grouped(P, "c-fcf", [
        {values: bnv(D.ocf || []), color: "var(--s1)"},
        {values: bnv(D.capex || []), color: "var(--s3)"},
        {values: bnv(M.fcf || []), color: "var(--s2)"},
      ], {
        aria: `Column chart: cash from operations, capital spending and free cash flow by ${per}, side by side; negative values in red`,
        rows: i => [
          ["var(--s1)", "Cash from operations", money((D.ocf || [])[i])],
          ["var(--s3)", "Capital spending", money((D.capex || [])[i])],
          ["var(--s2)", "Free cash flow", money((M.fcf || [])[i])],
          [null, "Free cash flow margin", pctf((M.fcf_margin || [])[i])],
          ...workedOut(P, "ocf", i),
        ],
      });
      // from revenue to operating income: what is left after the cost of sales, one of the costs paid from it, and
      // what is left after all operating costs
      grouped(P, "c-steps", [
        {values: bnv(D.gross_profit || []), color: "var(--s1)"},
        {values: bnv(D.rnd || []), color: "var(--s3)"},
        {values: bnv(D.operating_income || []), color: "var(--s2)"},
      ], {
        aria: `Column chart: gross profit, research and development, and operating income by ${per}, side by side; losses in red`,
        rows: i => [
          [null, "Revenue", money(D.revenue[i])],
          ["var(--s1)", "Gross profit", money((D.gross_profit || [])[i])],
          [null, "Gross margin", pctf((M.gross_margin || [])[i])],
          ["var(--s3)", "Research and development", money((D.rnd || [])[i])],
          ["var(--s2)", "Operating income", money((D.operating_income || [])[i])],
          [null, "Operating margin", pctf((M.operating_margin || [])[i])],
        ],
      });
    }

    // the balance sheet: what the company holds and owes at each year or quarter end, and the ratios between them
    const at = P.unit === "year" ? "Fiscal year end" : "Quarter end";
    if (C.profile === "bank") {
      grouped(P, "c-bs1", [{values: bnv(D.loans || []), color: "var(--s1)"}, {values: bnv(D.deposits || []), color: "var(--s2)"}], {
        aria: `Column chart: loans and deposits at each ${per} end`,
        rows: i => [["var(--s1)", "Loans, net", money((D.loans || [])[i])], ["var(--s2)", "Deposits", money((D.deposits || [])[i])],
                    [null, "Loans to deposits", pctf(D.loans && D.deposits && D.deposits[i] ? D.loans[i] / D.deposits[i] * 100 : null)]],
      });
      grouped(P, "c-bs2", [{values: bnv(D.total_assets || []), color: "var(--s1)"}, {values: bnv(D.equity || []), color: "var(--s2)", axis: "right"}], {
        aria: `Column chart: total assets (left axis) and shareholders' equity (right axis) at each ${per} end`,
        rows: i => [["var(--s1)", "Total assets", money((D.total_assets || [])[i])], ["var(--s2)", "Shareholders' equity", money((D.equity || [])[i])],
                    [null, "Equity to assets", pctf(D.equity && D.total_assets && D.total_assets[i] ? D.equity[i] / D.total_assets[i] * 100 : null)]],
      });
    } else {
      const cash = D.cash_and_st_investments || [], debt = D.debt_and_leases || [];
      grouped(P, "c-bs1", [{values: bnv(cash), color: "var(--s1)"}, {values: bnv(debt), color: "var(--s2)"}], {
        aria: `Column chart: cash and short-term investments, and debt including finance leases, at each ${per} end`,
        rows: i => [["var(--s1)", "Cash and short-term investments", money(cash[i])], ["var(--s2)", "Debt incl. finance leases", money(debt[i])],
                    [null, "Net debt", cash[i] == null || debt[i] == null ? dash : money(debt[i] - cash[i])]],
      });
      grouped(P, "c-bs2", [{values: bnv(D.total_assets || []), color: "var(--s1)"}, {values: bnv(D.total_liabilities || []), color: "var(--s2)"},
                           {values: bnv(D.equity || []), color: "var(--s3)"}], {
        aria: `Column chart: total assets, total liabilities and shareholders' equity at each ${per} end; negative equity in red`,
        rows: i => [["var(--s1)", "Total assets", money((D.total_assets || [])[i])], ["var(--s2)", "Total liabilities", money((D.total_liabilities || [])[i])],
                    ["var(--s3)", "Shareholders' equity", money((D.equity || [])[i])]],
      });
      // ratios: from each period's own figures, so quarters get them too (net debt to EBITDA needs a full year)
      const ratio = (a, b) => (a || []).map((v, i) => v == null || !b || !b[i] || b[i] <= 0 ? null : Math.round(v / b[i] * 100) / 100);
      const de = ratio(debt, D.equity), cr = ratio(D.current_assets, D.current_liabilities);
      lines(P, "c-bs3", [
        line("debt_to_equity", "Debt to equity", "var(--s1)", de),
        line("current_ratio", "Current ratio", "var(--s2)", cr),
        ...(P.unit === "year" ? [line("net_debt_to_ebitda", "Net debt to EBITDA", "var(--s3)", M.net_debt_to_ebitda || [])] : []),
      ], {
        suffix: "×",
        aria: `Line chart: debt to equity, current ratio${P.unit === "year" ? " and net debt to EBITDA" : ""} by ${per}`,
        rows: i => [["var(--s1)", "Debt to equity", de[i] == null ? dash : num(de[i], 2) + "×"],
                    ["var(--s2)", "Current ratio", cr[i] == null ? dash : num(cr[i], 2) + "×"],
                    ...(P.unit === "year" ? [["var(--s3)", "Net debt to EBITDA", M.net_debt_to_ebitda && M.net_debt_to_ebitda[i] != null ? num(M.net_debt_to_ebitda[i], 1) + "×" : dash]] : [])],
      });
    }

    // shares paid to employees against cash spent buying shares back
    grouped(P, "c-sbc", [
      {values: bnv(D.sbc || []), color: "var(--s1)"},
      {values: bnv(D.buybacks || []), color: "var(--s2)"},
    ], {
      aria: `Column chart: stock-based compensation and share buybacks by ${per}, side by side`,
      rows: i => {
        const sb = (D.sbc || [])[i], bb = (D.buybacks || [])[i];
        return [["var(--s1)", "Stock-based compensation", money(sb)], ["var(--s2)", "Share buybacks", money(bb)],
                [null, "Buybacks beyond it", sb == null || bb == null ? dash : money(bb - sb)]];
      },
    });

    const div = D.dividends || P.X.map(() => null), buy = D.buybacks || P.X.map(() => null);
    const payouts = P.X.map((_, i) => (div[i] || 0) + (buy[i] || 0));
    show("c-payouts", payouts.some(v => v > 0));
    if (payouts.some(v => v > 0) && el("c-payouts")) {
      const step = niceStep(0, Math.max(...payouts) / 1000);
      FD.stacked(el("c-payouts"), {
        years: P.X, step, fmt: axis(step), xlab: P.xlab, title: P.title,
        bottom: {values: div.map(v => (v || 0) / 1000), color: "var(--s1)"},
        top: {values: buy.map(v => (v || 0) / 1000), color: "var(--s2)"},
        aria: `Stacked columns: dividends and share buybacks by ${per}`,
        rows: i => [
          ["var(--s1)", "Dividends", money(div[i])],
          ["var(--s2)", "Buybacks", money(buy[i])],
          ...(P.unit === "year" ? [[null, "Share of free cash flow", pctf(M.payout_of_fcf ? M.payout_of_fcf[i] : null)]] : []),
        ],
      });
    }

    const shares = D.shares_diluted || [];
    const big = Math.max(...A.D.shares_diluted.filter(v => v != null)) >= 1000;
    columns(P, "c-shares", shares.map(v => v == null ? null : big ? v / 1000 : v), {
      aria: `Column chart: weighted-average diluted shares by ${per}`,
      rows: i => [
        ["var(--s1)", "Diluted shares", shares[i] == null ? dash : big ? num(shares[i] / 1000, 2) + " billion" : num(shares[i], 0) + " million"],
        ...(P.unit === "year" ? [[null, "Change", pctf(M.share_change[i])]] : []),
      ],
    });
  }

  // the switch: captions, the note beside it, the quarterly notes, and the choice remembered per reader
  const toggle = document.querySelector(".period-toggle");
  // a link ending #quarterly or #annual opens that view; otherwise the reader's last choice
  let mode = "annual";
  try { if (QUARTERS && localStorage.getItem("fd-period") === "quarterly") mode = "quarterly"; } catch (e) {}
  if (location.hash === "#quarterly" && QUARTERS) mode = "quarterly";
  if (location.hash === "#annual") mode = "annual";

  function apply() {
    const quarters = mode === "quarterly" && QUARTERS;
    document.querySelectorAll("figcaption .n[data-q]").forEach(n => {
      if (n.dataset.a == null) n.dataset.a = n.textContent;
      n.textContent = quarters ? n.dataset.q : n.dataset.a;
    });
    if (toggle) toggle.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.period === mode)));
    const note = document.querySelector(".period-note");
    if (note) note.textContent = quarters ? note.dataset.quarterly : note.dataset.annual;
    document.querySelectorAll(".period-notes").forEach(n => { n.hidden = !quarters; });
    render(quarters ? QUARTERS : ANNUAL);
  }

  if (toggle) toggle.addEventListener("click", e => {
    const b = e.target.closest("button[data-period]");
    if (!b || b.dataset.period === mode) return;
    mode = b.dataset.period;
    try { localStorage.setItem("fd-period", mode); } catch (err) {}
    apply();
  });
  FD.draw(apply);

  // insider buys and sells by month: buys above zero, sells below; drawn when the Insiders section is shown
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function drawInsiders() {
    const host = el("c-ins");
    if (!host || !host.clientWidth) return;
    let d;
    try { d = JSON.parse(host.dataset.ins); } catch (e) { return; }
    const buys = d.buys, sells = d.sells.map(v => v ? -v : 0);
    const [lo, hi] = range([{values: buys}, {values: sells}]), step = niceStep(lo, hi);
    const lab = i => { const [y, m] = d.months[i].split("-"); return [MON[+m - 1], y]; };
    const mny = v => !v ? dash : "$" + num(v, v >= 10 ? 0 : 1) + "M";
    FD.grouped(host, {
      years: d.months, step, fmt: axis(step),
      series: [{values: buys, color: "var(--up)"}, {values: sells, color: "var(--down)", negColor: "var(--down)"}],
      xlab: (i, short, tiny) => tiny ? (lab(i)[0] === "Jan" ? "’" + lab(i)[1].slice(2) : "") : short ? lab(i)[0].slice(0, 1) : lab(i)[0] + (lab(i)[0] === "Jan" || i === 0 ? " ’" + lab(i)[1].slice(2) : ""),
      title: i => `${lab(i)[0]} ${lab(i)[1]}`,
      aria: "Column chart: insider purchases above zero and sales below, by month, US$ millions",
      rows: i => [["var(--up)", "Bought", mny(d.buys[i])], ["var(--down)", "Sold", mny(d.sells[i])]],
    });
  }
  FD.draw(drawInsiders);

  // the section bar is a filter: each tab shows its section alone. A link to one (#cash-flow), or to a section the
  // page had before October 31, 2026 (#revenue, #earnings, #returns, #balance, #cash, #payouts, #value), opens it;
  // otherwise the first. The period switch shows only on a section with charts. Charts drawn while their section
  // was hidden had no width to fit, so showing one draws them again. Without script every section shows
  const tabs = [...document.querySelectorAll('.page-bar [role="tab"]')];
  const bar = document.querySelector(".page-bar"), caption = document.querySelector(".chart-block");
  const keyOf = t => t.getAttribute("aria-controls").slice(2);
  const OLD = {revenue: "income-statement", earnings: "income-statement", efficiency: "income-statement", returns: "income-statement",
               financials: "income-statement", balance: "balance-sheet", cash: "cash-flow", payouts: "cash-flow", value: "projections"};
  function pick(key, {focus = false, address = true, scroll = true} = {}) {
    const tab = tabs.find(t => keyOf(t) === key) || tabs[0];
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      el(t.getAttribute("aria-controls")).hidden = !on;
    });
    const charts = tab.dataset.charts === "1";
    if (toggle) toggle.hidden = !charts;
    if (caption) caption.hidden = !charts;
    tab.parentElement.scrollTo({left: tab.offsetLeft - 24, behavior: "auto"});
    if (focus) tab.focus();
    if (address) try { history.replaceState(null, "", "#" + keyOf(tab)); } catch (e) { /* the address can't be changed here */ }
    // the bar stays put when the reader is above it; once it has stuck to the top, the section starts just below it
    if (scroll && bar.getBoundingClientRect().top < 20) {
      const panel = el(tab.getAttribute("aria-controls"));
      scrollTo({top: scrollY + panel.getBoundingClientRect().top - bar.offsetHeight - 24, behavior: "auto"});
    }
    if (charts) apply();
    if (keyOf(tab) === "insiders") drawInsiders();
  }
  if (tabs.length) {
    tabs.forEach(t => t.addEventListener("click", e => { e.preventDefault(); pick(keyOf(t)); }));
    bar.querySelector('[role="tablist"]').addEventListener("keydown", e => {
      const i = tabs.indexOf(document.activeElement), k = {ArrowRight: 1, ArrowLeft: -1}[e.key];
      if (i < 0 || !k) return;
      e.preventDefault();
      pick(keyOf(tabs[(i + k + tabs.length) % tabs.length]), {focus: true});
    });
    const h = location.hash.slice(1).replace(/^p-/, ""), want = OLD[h] || h;
    const known = tabs.some(t => keyOf(t) === want);
    pick(known ? want : keyOf(tabs[0]), {address: false, scroll: false});
    if (known) bar.scrollIntoView();
    // a link within the page to a section (the price panel's "Value X yourself" goes to #value) opens that section
    addEventListener("hashchange", () => {
      const k = location.hash.slice(1).replace(/^p-/, ""), to = OLD[k] || k;
      if (tabs.some(t => keyOf(t) === to)) { pick(to, {address: to !== k}); bar.scrollIntoView(); }
    });
  }
})();
