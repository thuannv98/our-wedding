/* A wish read in full.
 *
 * Both the strip under the book and the card drifting past the corner cut a long wish
 * short, because neither can grow without pushing the page about. Either one opens this.
 */
(function (AK) {
  "use strict";

  function openWish(wish) {
    var box = document.getElementById("wish-full");
    if (!box || !wish || !wish.wish) return;
    box.querySelector(".wishfull__text").textContent = wish.wish;
    box.querySelector(".wishfull__by").textContent = wish.name || "Một người bạn";
    if (box.open) return;                 // asking twice throws
    if (typeof box.showModal === "function") box.showModal();
    else box.setAttribute("open", "");
  }

  function setupWishFull(root) {
    root = root || document;
    var box = root.getElementById("wish-full");
    if (!box) return;
    var close = function () { box.close ? box.close() : box.removeAttribute("open"); };
    box.querySelector(".wishfull__close").addEventListener("click", close);
    // the dialog fills the screen, so a click on the sheet itself must not close it
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
  }

  AK.openWish = openWish;
  AK.setupWishFull = setupWishFull;
})(window.AK = window.AK || {});
