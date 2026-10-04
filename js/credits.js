/* The wishes running up the page the way names run at the end of a film.
 *
 * The list is laid out again after itself and the track is carried up by the distance
 * from one copy to the next, gap and all. What arrives is then the same thing that left,
 * so the turn of the loop has nothing to show. Measuring the list's own height instead
 * leaves out the gap between the two copies, and the roll jumps by exactly that much.
 *
 * Enough copies go in to cover the window as well as the travel: with two short wishes
 * one copy runs out before the window is full, and the tail of the roll shows through.
 */
(function (AK) {
  "use strict";

  var PER_PIXEL = 22;      // milliseconds the track takes to travel one pixel
  var MOST = 12;           // copies, so a single short wish cannot run away with this

  function addCopy(track, items) {
    for (var i = 0; i < items.length; i++) {
      var copy = items[i].cloneNode(true);
      copy.classList.add("note--copy");
      copy.setAttribute("aria-hidden", "true");          // read once, not twice
      var open = copy.querySelector(".note__open");
      if (open) open.setAttribute("tabindex", "-1");
      track.appendChild(copy);
    }
  }

  function runCredits(track) {
    if (!track) return;
    var old = track.querySelector(".note--copy");
    while (old) { old.remove(); old = track.querySelector(".note--copy"); }

    var items = [].slice.call(track.children);
    if (!items.length) return;

    var plain = track.scrollHeight;          // the list alone, before anything is copied
    addCopy(track, items);

    // the distance from a wish to the same wish in the next copy: the true period
    var reach = track.children[items.length].offsetTop - items[0].offsetTop;
    if (!reach) reach = plain;               // nothing laid out to measure
    if (!reach) return;

    var win = track.closest(".notes__window");
    var need = win ? win.clientHeight : 0;
    for (var n = 1; n < MOST && track.scrollHeight - reach < need; n++) addCopy(track, items);

    track.style.setProperty("--credits-reach", reach + "px");
    track.style.setProperty("--credits-time", Math.round(reach * PER_PIXEL) + "ms");
    track.classList.add("is-running");
  }

  // a wish is worth stopping for, and a moving target is hard to tap
  function setupCredits(root) {
    root = root || document;
    var win = root.querySelector(".notes__window");
    if (!win) return;

    // The height is measured once the wishes are in, but the display faces arrive later
    // and change it. Measured again when they land, the loop lines up.
    var again = function () {
      var track = win.querySelector(".notes__track");
      if (track && track.children.length) runCredits(track);
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(again).catch(function () {});
    window.addEventListener("load", again);

    var hold = function () { win.classList.add("is-held"); };
    var release = function () { win.classList.remove("is-held"); };
    win.addEventListener("pointerenter", hold);
    win.addEventListener("pointerleave", release);
    win.addEventListener("pointerdown", hold);
    win.addEventListener("pointerup", release);
    win.addEventListener("pointercancel", release);
  }

  AK.runCredits = runCredits;
  AK.setupCredits = setupCredits;
})(window.AK = window.AK || {});
