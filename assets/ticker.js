/* The Filing Desk: the front page's market strip. The stylesheet scrolls it (and stops it for anyone who asks
   for reduced motion, or while a pointer or keyboard focus is on it); this adds the pause button that touch
   screens need, since they can't hover. */
(function () {
  const strip = document.querySelector(".ticker"), btn = strip && strip.querySelector(".tk-pause");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const paused = strip.classList.toggle("paused");
    btn.setAttribute("aria-pressed", String(paused));
    btn.setAttribute("aria-label", paused ? "Play the market strip" : "Pause the market strip");
  });
})();
