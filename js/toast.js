/* A short message that slides in at the foot of the page and goes on its own. */
(function (AK) {
  "use strict";

  var el = null, timer = null;

  function toast(message) {
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");       // read out without stealing focus
      el.hidden = true;
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  AK.toast = toast;
})(window.AK = window.AK || {});
