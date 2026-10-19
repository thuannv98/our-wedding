/* The background music.
 *
 * Asked to play the moment the page opens. Every browser refuses sound until the visitor
 * has touched the page, so when that first ask is turned down the script keeps asking:
 * on the doors parting, and on the first touch, click, key or scroll, retrying until one
 * of them is actually allowed through.
 */
(function (AK) {
  "use strict";

  var WAKE = ["pointerdown", "pointerup", "click", "keydown", "touchstart", "touchend", "scroll", "wheel"];

  function setupMusic(root) {
    root = root || document;
    var audio = root.getElementById("audio");
    var button = root.getElementById("music");
    if (!audio || !button) return;

    var listening = false;

    function mark(on) {
      button.classList.toggle("is-playing", on);
      button.setAttribute("aria-pressed", String(on));
    }

    // Asking is not hearing. The button is never marked from here: it follows the audio
    // element's own events, below.
    function play() {
      var p;
      try { p = audio.play(); } catch (err) { return Promise.reject(err); }
      if (!p || !p.then) { mark(!audio.paused); return Promise.resolve(); }   // an older browser
      return p;
    }

    // One attempt per gesture, and the listeners stay until one of them gets through:
    // `once` dropped them after the first try, so a gesture the browser still refused
    // (the audio not buffered yet, say) left nothing behind to try again.
    function retry() {
      play().then(stopListening, function () {});
    }

    function listen() {
      if (listening) return;
      listening = true;
      window.addEventListener("ak:doors-open", retry);
      WAKE.forEach(function (ev) { window.addEventListener(ev, retry, { passive: true }); });
      document.addEventListener("visibilitychange", retry);
    }

    function stopListening() {
      if (!listening) return;
      listening = false;
      window.removeEventListener("ak:doors-open", retry);
      WAKE.forEach(function (ev) { window.removeEventListener(ev, retry); });
      document.removeEventListener("visibilitychange", retry);
    }

    // The file is left out of the page load so it does not compete with the cover.
    // Once the cover is in, there is room for it, and the visitor has not tapped yet.
    window.addEventListener("ak:doors-ready", function () {
      if (audio.preload === "none") { audio.preload = "auto"; audio.load(); }
    }, { once: true });

    play().catch(listen);

    // "play" fires when playback is asked for, "playing" when sound actually starts. The
    // file is not fetched until the doors open, so between the two there are seconds of
    // loading: marked from "play", the button claimed to be playing while it was silent.
    audio.addEventListener("playing", function () { mark(true); });
    audio.addEventListener("pause", function () { mark(false); });
    audio.addEventListener("ended", function () { mark(false); });

    // The button does what it looks like it will do. Reading audio.paused instead would
    // make a tap on a silent button pause a track that had been asked for but had not
    // begun, and the visitor would hear nothing change.
    button.addEventListener("click", function () {
      if (button.classList.contains("is-playing")) { audio.pause(); stopListening(); }
      else { play().catch(function () {}); }
    });
  }

  AK.setupMusic = setupMusic;
})(window.AK = window.AK || {});
