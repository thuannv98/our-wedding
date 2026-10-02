/* Runs each element's animation the first time it comes into view, then forgets it. */
(function (AK) {
  "use strict";

  function startMotion(root) {
    root = root || document;
    var items = root.querySelectorAll("[data-anim]");
    if (!items.length) return;

    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || typeof IntersectionObserver !== "function") {
      // no watcher, or none wanted: show everything rather than leave it invisible
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-shown");
      return;
    }

    // Anything on the cover waits for the doors to begin parting. Without that it plays
    // its entrance behind a closed door and is already finished when the page appears.
    function reveal(el) {
      el.classList.add("is-in");
      el.addEventListener("animationend", function () {
        el.classList.remove("is-in");
        el.classList.add("is-shown");
      }, { once: true });
    }
    function revealWhenVisible(el) {
      var behindDoors = el.closest(".cover")
        && !document.documentElement.classList.contains("doors-open");
      if (behindDoors) {
        window.addEventListener("ak:doors-open", function () { reveal(el); }, { once: true });
      } else {
        reveal(el);
      }
    }

    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        revealWhenVisible(el);
        seen.unobserve(el);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    for (var j = 0; j < items.length; j++) seen.observe(items[j]);
  }

  AK.startMotion = startMotion;
})(window.AK = window.AK || {});
