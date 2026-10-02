/* The two controls on the right: back to the top, and a list of the sections built from
   the headings already on the page, so it can never fall out of step with them. */
(function (AK) {
  "use strict";

  function setupDock(root) {
    root = root || document;

    var top = root.getElementById("to-top");
    if (top) {
      top.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    var btn = root.getElementById("menu-btn");
    var menu = root.getElementById("menu");
    if (!btn || !menu) return;

    var list = menu.querySelector("ul");
    // only the sections that say so: the short ones in between are passed on the way
    var sections = root.querySelectorAll("main > section[data-menu]");
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (s.hidden) continue;                       // the portraits open from their buttons
      var heading = root.getElementById(s.getAttribute("aria-labelledby"));
      if (!heading) continue;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + s.id;
      a.textContent = heading.textContent.trim();
      li.appendChild(a);
      list.appendChild(li);
    }

    function close() {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    });
    list.addEventListener("click", close);
    document.addEventListener("click", function (e) {
      if (!menu.hidden && !menu.contains(e.target)) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  AK.setupDock = setupDock;
})(window.AK = window.AK || {});
