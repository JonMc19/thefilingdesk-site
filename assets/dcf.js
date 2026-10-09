/* The Filing Desk: discounted cash flow calculator on company pages.
   Starting figures come from the company's 10-K, or for net cash and shares its latest 10-Q (window.DCF);
   the assumptions start from one of three example scenarios, the same for every company, and are the reader's to change. With a last close
   (window.DCF.price) it compares the value with the share price and works out the growth the price
   implies. Uses FD helpers from report.js. */
(function () {
  const F = window.DCF, root = document.getElementById("dcf");
  if (!F || !root) return;
  const PRESETS = F.presets || {   // defined once in sitebuild/companies.py, which also works out the scenario row
    cautious: {g1: 2, g2: 1, gt: 2, r: 11},
    base: {g1: 5, g2: 3, gt: 2.5, r: 10},
    optimistic: {g1: 10, g2: 6, gt: 3, r: 9},
  };
  const EXAMPLE = PRESETS.base;
  const $ = id => document.getElementById(id);
  const minus = s => String(s).replace(/^-/, "−");
  const usd = v => (v < 0 ? "−" : "") + "$" + Math.abs(v).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const big = v => (v < 0 ? "−" : "") + (Math.abs(v) >= 1000 ? "$" + (Math.abs(v) / 1000).toLocaleString("en-US", {maximumFractionDigits: 1, minimumFractionDigits: 1}) + "B" : "$" + Math.abs(v).toFixed(0) + "M");
  const num = id => { const v = parseFloat($(id).value); return isNaN(v) ? null : v; };

  const sliders = ["g1", "g2", "gt", "r"];
  function setAssumptions(a) {
    sliders.forEach(k => { $("dcf-" + k).value = a[k]; $("dcf-" + k + "-n").value = a[k]; });
  }
  sliders.forEach(k => {
    const range = $("dcf-" + k), box = $("dcf-" + k + "-n");
    range.addEventListener("input", () => { box.value = range.value; run(); });
    box.addEventListener("input", () => { if (box.value !== "") range.value = box.value; run(); });
  });

  // the starting figures, each with a choice of where it comes from: free cash flow from the latest year, the
  // average of the last three, or before growth spending (cash from operations minus depreciation); net cash
  // and diluted shares from the 10-K or the latest 10-Q
  const N = F.notes || {};
  const BASES = {
    fcf: {input: "dcf-fcf", values: {fy: F.fcf, avg: F.fcf_avg3, norm: F.fcf_norm}, notes: N.fcf, positive: true},
    cash: {input: "dcf-cash", values: {fy: F.net_cash, q: F.net_cash_q}, notes: N.cash},
    shares: {input: "dcf-shares", values: {fy: F.shares, q: F.shares_q}, notes: N.shares},
  };
  const usable = (g, b) => { const v = BASES[g].values[b]; return v != null && (!BASES[g].positive || v > 0); };
  // the page says which figure each starts from (window.DCF.defaults, worked out with the scenario row in
  // sitebuild/companies.py); otherwise the 10-K's, or the next one where it's missing
  const defaultBasis = g => (F.defaults && usable(g, F.defaults[g])) ? F.defaults[g]
    : usable(g, "fy") ? "fy" : (["avg", "norm", "q"].find(b => usable(g, b)) || "fy");
  function setBasis(g, b) {
    const B = BASES[g], v = B.values[b];
    root.querySelectorAll(`.basis[data-for="${g}"] button`).forEach(x => x.setAttribute("aria-pressed", String(x.dataset.b === b)));
    $(B.input).value = usable(g, b) ? Math.round(v) : "";
    const note = $(B.input + "-note");
    if (note && B.notes && B.notes[b]) note.textContent = B.notes[b];
  }
  root.querySelectorAll(".basis button").forEach(b => b.addEventListener("click", () => { setBasis(b.parentElement.dataset.for, b.dataset.b); run(); }));
  Object.entries(BASES).forEach(([g, B]) => $(B.input).addEventListener("input", () => {
    // a figure typed by hand comes from neither filing
    root.querySelectorAll(`.basis[data-for="${g}"] button`).forEach(x => x.setAttribute("aria-pressed", "false"));
    run();
  }));
  const setAllBases = () => Object.keys(BASES).forEach(g => setBasis(g, defaultBasis(g)));
  // scenarios: a button sets all four assumptions; it shows as pressed while they still match
  const presetButtons = [...root.querySelectorAll(".dcf-presets button")];
  presetButtons.forEach(b => b.addEventListener("click", () => { setAssumptions(PRESETS[b.dataset.p]); run(); }));
  // the row of scenario values above the calculator: each loads its scenario with the default starting figures,
  // which are the figures its value was worked out from
  const scenButtons = [...document.querySelectorAll(".scen")];
  scenButtons.forEach(b => b.addEventListener("click", () => {
    setAssumptions(PRESETS[b.dataset.p]); setAllBases(); run();
    if (root.getBoundingClientRect().top > innerHeight * 0.6)   // on a phone the row is tall: bring the calculator up
      root.scrollIntoView({block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
  }));
  function markPreset() {
    const now = Object.fromEntries(sliders.map(k => [k, num("dcf-" + k + "-n")]));
    const matches = p => sliders.every(k => PRESETS[p][k] === now[k]);
    presetButtons.forEach(b => b.setAttribute("aria-pressed", String(matches(b.dataset.p))));
    const defaults = Object.keys(BASES).every(g => {
      const b = defaultBasis(g);
      return num(BASES[g].input) === (usable(g, b) ? Math.round(BASES[g].values[b]) : null);
    });
    scenButtons.forEach(b => b.setAttribute("aria-pressed", String(defaults && matches(b.dataset.p))));
  }

  $("dcf-reset").addEventListener("click", () => { setAssumptions(EXAMPLE); setAllBases(); run(); });

  function value(fcf0, cash, shares, g1, g2, gt, r) {
    const flows = [];
    let f = fcf0, pv = 0;
    for (let y = 1; y <= 10; y++) {
      f *= 1 + (y <= 5 ? g1 : g2) / 100;
      const d = f / Math.pow(1 + r / 100, y);
      flows.push({f, d});
      pv += d;
    }
    const tv = f * (1 + gt / 100) / ((r - gt) / 100), pvTv = tv / Math.pow(1 + r / 100, 10);
    const equity = pv + pvTv + cash;
    return {flows, pv, pvTv, equity, perShare: shares ? equity / shares : null};
  }

  function run() {
    const fcf0 = num("dcf-fcf"), cash = num("dcf-cash") || 0, shares = num("dcf-shares");
    const [g1, g2, gt, r] = sliders.map(k => num("dcf-" + k + "-n"));
    markPreset();
    const warn = $("dcf-warn");
    const problem = fcf0 == null || fcf0 <= 0 ? "Enter a positive starting free cash flow to see a value."
      : !shares || shares <= 0 ? "Enter the number of shares to see a value per share."
      : [g1, g2, gt, r].some(v => v == null) ? "Fill in every assumption."
      : r - gt < 0.5 ? "The discount rate has to be at least half a point above terminal growth, or the terminal value has no finite answer."
      : "";
    warn.textContent = problem || (num("dcf-cash") == null ? "Net cash was left blank and is counted as zero." : "");
    if (problem) {
      $("dcf-ps").textContent = "—";
      ["dcf-eq", "dcf-pv", "dcf-tv", "dcf-nc", "dcf-share"].forEach(id => { $(id).textContent = "—"; });
      $("c-dcf").innerHTML = ""; $("dcf-grid").innerHTML = "";
      if ($("dcf-gap")) { $("dcf-gap").textContent = "—"; $("dcf-implied").textContent = ""; }
      return;
    }
    const v = value(fcf0, cash, shares, g1, g2, gt, r);
    $("dcf-ps").textContent = usd(v.perShare);
    $("dcf-eq").textContent = "Equity value " + big(v.equity);
    $("dcf-pv").textContent = big(v.pv);
    $("dcf-tv").textContent = big(v.pvTv);
    $("dcf-nc").textContent = big(cash);
    $("dcf-share").textContent = (v.pvTv / (v.pv + v.pvTv) * 100).toFixed(0) + "%";

    // against the last close: how far apart they are, and the growth in years 1 to 5 that would give the
    // price, with the reader's other assumptions (a reverse DCF)
    const P = F.price && F.price.close;
    if (P && $("dcf-gap")) {
      const gap = (v.perShare / P - 1) * 100;
      $("dcf-gap").textContent = Math.abs(gap) < 0.5 ? "about the same"
        : `${Math.abs(gap).toFixed(0)}% ${gap > 0 ? "above" : "below"}`;
      const at = g => value(fcf0, cash, shares, g, g2, gt, r).perShare;
      let lo = -50, hi = 100, implied = null;
      if (at(lo) <= P && at(hi) >= P) {
        for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (at(mid) < P) lo = mid; else hi = mid; }
        implied = (lo + hi) / 2;
      }
      $("dcf-implied").textContent = implied == null
        ? `No growth rate between −50% and 100% a year in years 1 to 5 gives the last close of ${usd(P)} with these other assumptions.`
        : `The last close of ${usd(P)} matches free cash flow growth of ${minus(implied.toFixed(1))}% a year in years 1 to 5, with your other assumptions unchanged.`;
    }

    const years = v.flows.map((_, i) => F.fy + 1 + i);
    const maxF = Math.max(...v.flows.map(x => x.f)) / 1000;
    const raw = maxF / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
    FD.stacked($("c-dcf"), {
      years, step, fmt: x => +x.toFixed(step < 1 ? 2 : 0),
      bottom: {values: v.flows.map(x => x.d / 1000), color: "var(--s1)"},
      top: {values: v.flows.map(x => (x.f - x.d) / 1000), color: "var(--s2)"},
      aria: "Stacked columns: projected free cash flow for the next ten years, split into its value today and the part removed by discounting",
      rows: i => [
        [null, "Projected free cash flow", big(v.flows[i].f)],
        ["var(--s1)", "Value today", big(v.flows[i].d)],
        ["var(--s2)", "Removed by discounting", big(v.flows[i].f - v.flows[i].d)],
      ],
    });

    // sensitivity: discount rate down the side, terminal growth across the top
    const rs = [-2, -1, 0, 1, 2].map(d => +(r + d).toFixed(1)), gs = [-1, -0.5, 0, 0.5, 1].map(d => +(gt + d).toFixed(1));
    let html = `<thead><tr><th scope="col">Discount rate ↓ · Terminal growth →</th>${gs.map((g, k) => `<th scope="col"${k === 2 ? ' class="last"' : ""}>${minus(g)}%</th>`).join("")}</tr></thead><tbody>`;
    rs.forEach((rr, i) => {
      html += `<tr><td>${rr}%</td>` + gs.map((gg, k) => {
        const ok = rr - gg >= 0.5 && rr > 0;
        const cell = ok ? usd(value(fcf0, cash, shares, g1, g2, gg, rr).perShare) : "—";
        return `<td${i === 2 && k === 2 ? ' class="cur"' : ""}>${cell}</td>`;
      }).join("") + "</tr>";
    });
    $("dcf-grid").innerHTML = html + "</tbody>";
  }

  setAssumptions(EXAMPLE);
  setAllBases();
  run();
  let w = innerWidth, t;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (innerWidth !== w) { w = innerWidth; run(); } }, 150); });
})();
