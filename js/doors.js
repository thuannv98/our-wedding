/* The two halves part when the visitor taps them.
 *
 * They used to open on their own once the cover had loaded, which looked right but left
 * the music silent: no browser will play sound before the visitor has touched the page,
 * and nothing before this point is a touch. Asking for the tap here spends the one
 * gesture on both things at once, so the invitation opens and the music starts together.
 *
 * The prompt only appears once there is something behind the doors worth opening onto.
 */
(function (AK) {
  "use strict";

  var HOLD = 400;          // a beat after the cover arrives, so the words are not abrupt
  var CAP = 2500;          // a slow photograph cannot hold the words back any longer
  var ESCAPE = 25000;      // and nobody is ever stuck behind a door that failed to bind

  function openDoors(root) {
    root = root || document;
    var doors = root.getElementById("doors");
    if (!doors) return;

    var done = false;
    function part() {
      if (done) return;
      done = true;
      doors.classList.add("is-open");
      document.documentElement.classList.add("doors-open");
      window.dispatchEvent(new CustomEvent("ak:doors-open"));
      setTimeout(function () { doors.classList.add("is-gone"); }, 4200);   // after the 4s slide
    }

    // Asked for stillness, the doors are not drawn at all, so there is nothing to tap
    // and nothing to wait for.
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) { part(); return; }

    var prompt = root.getElementById("doors-open");
    var offered = false;
    function offer() {
      if (offered || done) return;
      offered = true;
      doors.classList.add("is-ready");
      // the cover is in and the tap is now a second or two away: whoever else is waiting
      // for a quiet moment on the connection can have it
      window.dispatchEvent(new CustomEvent("ak:doors-ready"));
      if (prompt) { try { prompt.focus({ preventScroll: true }); } catch (err) { /* older browser */ } }
    }

    var cover = root.querySelector(".cover__photo img");
    if (cover && !cover.complete) {
      cover.addEventListener("load", function () { setTimeout(offer, HOLD); }, { once: true });
      cover.addEventListener("error", function () { setTimeout(offer, HOLD); }, { once: true });
    } else {
      setTimeout(offer, HOLD);
    }
    setTimeout(offer, CAP);

    doors.addEventListener("click", part);     // the whole panel, not only the words
    setTimeout(part, ESCAPE);
  }

  AK.openDoors = openDoors;
})(window.AK = window.AK || {});
