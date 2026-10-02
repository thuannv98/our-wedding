(function (AK) {
  "use strict";

  var get = AK.get, parseDate = AK.parseDate, shortDate = AK.shortDate, weekdayOf = AK.weekdayOf;

  /** One card per ceremony, from the array in the data file. Add a fourth and it appears. */
  function renderCeremonies(root = document) {
    const list = root.querySelector('[data-list="ceremonies"]');
    const tpl = root.getElementById("tpl-ceremony");
    if (!list || !tpl) return;

    for (const c of get("ceremonies") || []) {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const set = (sel, text) => { node.querySelector(sel).textContent = text ?? ""; };
      const photo = node.querySelector(".ceremony__photo");
      if (c.photo) photo.src = c.photo; else photo.remove();

      set(".ceremony__title", c.title);
      // the old page wrote the hour and the weekday together, then the date beneath
      const date = parseDate(c.date);
      set(".ceremony__time", date ? `${c.time} ${weekdayOf(date)}` : c.time);
      set(".ceremony__date", date ? `Ngày ${shortDate(date)}` : c.date);
      set(".ceremony__venue", c.venue);
      set(".ceremony__address", c.address);

      const map = node.querySelector(".ceremony__map");
      if (c.map) map.href = c.map; else map.remove();
      node.style.setProperty("--anim-delay", (list.children.length * 0.15) + "s");
      list.append(node);
    }

    // the RSVP asks which one you are coming to, from the same list
    const picker = root.querySelector('[data-options="ceremonies"]');
    if (picker) {
      for (const c of get("ceremonies") || []) {
        const option = document.createElement("option");
        option.value = c.title;
        option.textContent = c.title;
        picker.append(option);
      }
    }
  }

  AK.renderCeremonies = renderCeremonies;
})(window.AK = window.AK || {});
