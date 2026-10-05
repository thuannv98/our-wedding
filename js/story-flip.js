/* The drawing and the four photographs taking turns in the one place.
 *
 * The drawing comes first, because it is the thing a guest has not seen before. It turns
 * over to the photographs, back again, and so on. It only turns while the section is on
 * screen: turning over and over in a part of the page nobody is looking at wastes the
 * phone's battery and lands the guest on a half-turned card when they do scroll to it.
 */
(function (AK) {
  "use strict";

  var live = null;      // the turning now running, if any

  function setupStoryFlip(root) {
    // Two of these on one page is two sets of timers turning the same card, which cancel
    // each other out as often as not. Whoever asks last gets the only one.
    if (live) { live.stop(); live = null; }

    root = root || document;
    var box = root.getElementById("story-flip");
    if (!box) return;

    // nothing to turn to: one face on its own just stands there
    if (!box.querySelector(".story__drawing") || !box.querySelector(".story__photo")) return;

    var timer = null, watcher = null;

    function turn() {
      box.classList.toggle("is-turned");
      timer = setTimeout(turn, setupStoryFlip.hold);
    }
    function start() { if (!timer && open) timer = setTimeout(turn, setupStoryFlip.hold); }
    function stop() { clearTimeout(timer); timer = null; }

    // Not before the doors part. The cover is shorter than a phone screen, so the top of
    // this section is already in view behind the closed doors; left to the watcher alone
    // the first turn came and went while the guest was still looking at the red panel.
    var open = false;
    function watch() {
      open = true;
      if (typeof IntersectionObserver === "function") {
        watcher = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) start(); else stop();
        }, { threshold: 0.25 });
        watcher.observe(box);
      } else {
        start();
      }
    }
    if (document.documentElement.classList.contains("doors-open")) watch();
    else window.addEventListener("ak:doors-open", watch, { once: true });
    function onVisibility() { if (document.hidden) stop(); else start(); }
    document.addEventListener("visibilitychange", onVisibility);

    live = {
      stop: function () {
        clearTimeout(timer);
        window.removeEventListener("ak:doors-open", watch);
        document.removeEventListener("visibilitychange", onVisibility);
        if (watcher) watcher.disconnect();
      },
    };
  }

  // how long each face is held before it turns, the 1.5s of the turn itself not counted
  setupStoryFlip.hold = 7000;

  AK.setupStoryFlip = setupStoryFlip;
})(window.AK = window.AK || {});
