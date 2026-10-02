/* The two portraits. Each button opens its panel below the couple and closes the other,
   swapping its own look, which is what the old page did with two stacked copies of the
   same button. */
(function (AK) {
  "use strict";

  function setupPortraits(root) {
    root = root || document;
    var buttons = root.querySelectorAll("[data-portrait]");
    if (!buttons.length) return;

    function show(which) {
      buttons.forEach(function (btn) {
        var mine = btn.dataset.portrait === which;
        var panel = root.getElementById(btn.getAttribute("aria-controls"));
        btn.classList.toggle("is-open", mine);
        btn.setAttribute("aria-expanded", String(mine));
        if (panel) panel.hidden = !mine;
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var already = btn.classList.contains("is-open");
        show(already ? null : btn.dataset.portrait);
        if (!already) {
          var panel = root.getElementById(btn.getAttribute("aria-controls"));
          if (panel && panel.scrollIntoView) {
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    });
  }

  AK.setupPortraits = setupPortraits;
})(window.AK = window.AK || {});
