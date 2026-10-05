/* The wishes already written, drifting past the corner of the page.
 *
 * One card at a time, high and to the right: the foot of the screen is where a thumb
 * rests and where the music button sits. It holds its tongue while a guest is typing,
 * while the tab is in the background, and while the guest book itself is on screen,
 * where the whole list is there to read.
 */
(function (AK) {
  "use strict";

  var live = null;      // the cycle now running, if any

  function startWishToasts(list) {
    // Starting a second cycle over the first left two sets of timers on one page, and a
    // card replaced itself the moment it arrived. Whoever asks last gets the only cycle.
    if (live) { live.stop(); live = null; }

    if (!list || !list.length) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function T() { return startWishToasts.timing; }

    var el = document.createElement("div");
    el.className = "wisht";
    el.setAttribute("role", "status");
    el.hidden = true;
    el.innerHTML = '<p class="wisht__text"></p><p class="wisht__by"></p>';
    document.body.appendChild(el);

    var text = el.querySelector(".wisht__text");
    var who = el.querySelector(".wisht__by");

    var at = 0, timer = null, bookInView = false, current = null, watcher = null;

    // typing a wish of your own, or reading the ones already there, is not the moment
    function quiet() {
      if (document.hidden || bookInView) return true;
      var a = document.activeElement;
      return !!(a && a.closest && a.closest("form"));
    }

    function next(after) { clearTimeout(timer); timer = setTimeout(show, after); }

    function hide() {
      clearTimeout(timer);                     // the turn that is ending may still be due
      el.classList.remove("is-in");
      timer = setTimeout(function () { el.hidden = true; next(T().gap); }, 400);
    }

    function show() {
      if (quiet()) { next(T().gap); return; }
      var w = list[at % list.length];
      at++;
      if (!w || !w.wish) { next(0); return; }
      current = w;
      text.textContent = w.wish;
      who.textContent = w.name || "Một người bạn";
      el.hidden = false;
      // the class goes on after the element is laid out, or there is nothing to animate from
      requestAnimationFrame(function () { el.classList.add("is-in"); });
      timer = setTimeout(hide, T().shown);
    }

    // a card cut short is still worth reading: tapping it opens the whole wish
    el.addEventListener("click", function () {
      if (!current) return;
      hide();
      if (AK.openWish) AK.openWish(current);
    });

    function onVisibility() {
      if (document.hidden) { clearTimeout(timer); el.hidden = true; el.classList.remove("is-in"); }
      else next(T().gap);
    }
    document.addEventListener("visibilitychange", onVisibility);

    var book = document.getElementById("guestbook");
    if (typeof IntersectionObserver === "function" && book) {
      watcher = new IntersectionObserver(function (entries) {
        bookInView = entries[0].isIntersecting;
      }, { threshold: 0.2 });
      watcher.observe(book);
    }

    function begin() { next(T().first); }
    if (document.documentElement.classList.contains("doors-open")) begin();
    else window.addEventListener("ak:doors-open", begin, { once: true });

    live = {
      stop: function () {
        clearTimeout(timer);
        window.removeEventListener("ak:doors-open", begin);
        document.removeEventListener("visibilitychange", onVisibility);
        if (watcher) watcher.disconnect();
        el.remove();
      },
    };
  }

  // named rather than buried, so the pacing can be read off in one place and a test can
  // run the whole cycle without waiting eighteen seconds for it
  startWishToasts.timing = { first: 5000, shown: 6000, gap: 7000 };

  AK.startWishToasts = startWishToasts;
})(window.AK = window.AK || {});
