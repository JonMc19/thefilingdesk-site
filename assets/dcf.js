/* The Filing Desk: discounted cash flow calculator on company pages.
   Starting figures come from the company's 10-K (window.DCF); the assumptions start at the same
   example values for every company and are the reader's to change. Uses FD helpers from report.js. */
(function () {
  const F = window.DCF, root = document.getElementById("dcf");
  if (!F || !root) return;
  const EXAMPLE = {g1: 5, g2: 3, gt: 2.5, r: 10};
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

  // starting free cash flow: latest year, or the average of the last three
  function basisValue(b) { return b === "avg" ? F.fcf_avg3 : F.fcf; }
  let basis = F.fcf != null && F.fcf > 0 ? "latest" : (F.fcf_avg3 != null && F.fcf_avg3 > 0 ? "avg" : "latest");
  function setBasis(b) {
    basis = b;
    root.querySelectorAll(".basis button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.b === b)));
    const v = basisValue(b);
    $("dcf-fcf").value = v != null && v > 0 ? Math.round(v) : "";
  }
  root.querySelectorAll(".basis button").forEach(b => b.addEventListener("click", () => { setBasis(b.dataset.b); run(); }));
  ["dcf-fcf", "dcf-cash", "dcf-shares"].forEach(id => $(id).addEventListener("input", () => {
    if (id === "dcf-fcf") root.querySelectorAll(".basis button").forEach(x => x.setAttribute("aria-pressed", "false"));
    run();
  }));
  $("dcf-reset").addEventListener("click", () => {
    setAssumptions(EXAMPLE); setBasis(F.fcf != null && F.fcf > 0 ? "latest" : "avg");
    $("dcf-cash").value = F.net_cash != null ? Math.round(F.net_cash) : "";
    $("dcf-shares").value = F.shares != null ? Math.round(F.shares) : "";
    run();
  });

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
      return;
    }
    const v = value(fcf0, cash, shares, g1, g2, gt, r);
    $("dcf-ps").textContent = usd(v.perShare);
    $("dcf-eq").textContent = "Equity value " + big(v.equity);
    $("dcf-pv").textContent = big(v.pv);
    $("dcf-tv").textContent = big(v.pvTv);
    $("dcf-nc").textContent = big(cash);
    $("dcf-share").textContent = (v.pvTv / (v.pv + v.pvTv) * 100).toFixed(0) + "%";

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
  setBasis(basis);
  $("dcf-cash").value = F.net_cash != null ? Math.round(F.net_cash) : "";
  $("dcf-shares").value = F.shares != null ? Math.round(F.shares) : "";
  run();
  let w = innerWidth, t;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (innerWidth !== w) { w = innerWidth; run(); } }, 150); });
})();
