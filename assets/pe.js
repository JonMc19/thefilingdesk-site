/* The Filing Desk: the P/E method on company pages. Value per share is earnings per share times a multiple.
   Earnings per share come from the 10-K or the last four quarters (window.PE.eps) and are projected five years
   ahead at a growth rate, or the reader's own estimate for any year. The multiple starts from the peers' median
   and can be set from the sector's median or the company's own P/E today, or typed in. On a future year's
   earnings it gives the price then, brought back to today at the discount rate. */
(function () {
  const F = window.PE, root = document.getElementById("pe-calc");
  if (!F || !root) return;
  const YEARS = 5;
  const $ = id => document.getElementById(id);
  const usd = v => (v < 0 ? "−" : "") + "$" + Math.abs(v).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const num = id => { const v = parseFloat($(id).value); return isNaN(v) ? null : v; };
  const press = (group, key) => root.querySelectorAll(`.basis[data-for="${group}"] button`)
    .forEach(b => b.setAttribute("aria-pressed", String(b.dataset.b === String(key))));
  let years = 1;   // the year whose earnings the multiple is applied to: 0 is now

  // a slider and its number box move together
  function pair(id, onChange) {
    const range = $(id), box = $(id + "-n");
    range.addEventListener("input", () => { box.value = range.value; onChange(); });
    box.addEventListener("input", () => { if (box.value !== "") range.value = box.value; onChange(); });
  }
  const setPair = (id, v) => { $(id).value = v; $(id + "-n").value = v; };

  // the years ahead: each grows from the one before at the growth rate, from `from` on
  function project(from = 0) {
    const g = num("pe-g-n") || 0;
    let prev = from === 0 ? num("pe-eps") : num("pe-y" + from);
    for (let i = from + 1; i <= YEARS; i++) {
      const v = prev == null ? null : prev * (1 + g / 100);
      $("pe-y" + i).value = v == null ? "" : v.toFixed(2);
      prev = v;
    }
  }

  function setEps(key) {
    $("pe-eps").value = F.eps[key] != null ? F.eps[key].toFixed(2) : "";
    if (F.eps_notes[key]) $("pe-eps-note").textContent = F.eps_notes[key];
    press("eps", key);
    project();
  }
  root.querySelectorAll('.basis[data-for="eps"] button').forEach(b => b.addEventListener("click", () => { setEps(b.dataset.b); run(); }));
  $("pe-eps").addEventListener("input", () => { press("eps", null); project(); run(); });
  root.querySelectorAll('.basis[data-for="pe"] button').forEach(b => b.addEventListener("click", () => { setPair("pe-m", F.multiples[b.dataset.b]); press("pe", b.dataset.b); run(); }));
  pair("pe-m", () => { press("pe", null); run(); });
  pair("pe-g", () => { project(); run(); });
  pair("pe-r", run);
  for (let i = 1; i <= YEARS; i++) $("pe-y" + i).addEventListener("input", () => { project(i); run(); });
  root.querySelectorAll('.basis[data-for="yr"] button').forEach(b => b.addEventListener("click", () => { years = +b.dataset.b; press("yr", years); run(); }));

  // the example scenarios above the calculator: each loads its earnings growth, multiple and discount rate on the
  // default earnings per share, applied to next year's earnings; it stays pressed while the calculator matches it
  const scen = [...document.querySelectorAll("#pe .scen")];
  scen.forEach(b => b.addEventListener("click", () => {
    const a = F.presets[b.dataset.p];
    setPair("pe-g", a.g); setEps(F.eps_default);
    setPair("pe-m", a.m); press("pe", Object.keys(F.multiples).find(k => F.multiples[k] === a.m) || null);
    setPair("pe-r", a.r); years = a.n; press("yr", years);
    run();
    if (root.getBoundingClientRect().top > innerHeight * 0.6)
      root.scrollIntoView({block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
  }));
  function markScen() {
    const e = F.eps[F.eps_default] != null ? +F.eps[F.eps_default].toFixed(2) : null, g = num("pe-g-n");
    const onDefaults = e != null && $("pe-eps").value === e.toFixed(2) && g != null
      && $("pe-y1").value === (e * (1 + g / 100)).toFixed(2);   // and Year 1 not typed over (cents, as the boxes show)
    scen.forEach(b => {
      const a = F.presets[b.dataset.p];
      b.setAttribute("aria-pressed", String(onDefaults && a.g === g && a.m === num("pe-m-n") && a.r === num("pe-r-n") && a.n === years));
    });
  }

  function run() {
    markScen();
    const m = num("pe-m-n"), r = num("pe-r-n") ?? 10;
    const eps = years === 0 ? num("pe-eps") : num("pe-y" + years);
    const ok = eps != null && eps > 0 && m != null && m > 0;
    const then = ok ? eps * m : null, v = ok ? then / Math.pow(1 + r / 100, years) : null;
    $("pe-v").textContent = ok ? usd(v) : "—";
    $("pe-calc-line").textContent = !ok ? "Enter positive earnings per share and a multiple."
      : years === 0 ? `${usd(eps)} of earnings per share × ${m}`
      : `Year ${years} earnings of ${usd(eps)} × ${m} = ${usd(then)} then, discounted at ${r}% a year for ${years} year${years > 1 ? "s" : ""}`;
    if ($("pe-gap")) {
      const P = F.price && F.price.close, gap = ok && P ? (v / P - 1) * 100 : null;
      $("pe-gap").textContent = gap == null ? "—" : Math.abs(gap) < 0.5 ? "about the same" : `${Math.abs(gap).toFixed(0)}% ${gap > 0 ? "above" : "below"}`;
    }
  }

  setPair("pe-g", F.g_default);
  setPair("pe-r", F.r_default);
  setEps(F.eps_default);
  const first = Object.keys(F.multiples)[0];
  setPair("pe-m", F.m_default);
  press("pe", first && F.multiples[first] === F.m_default ? first : null);
  years = F.n_default; press("yr", years);
  run();
})();
