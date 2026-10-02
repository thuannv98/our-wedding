(function (AK) {
  "use strict";

  var data = AK.data, dottedDate = AK.dottedDate, get = AK.get, has = AK.has, longDate = AK.longDate, parseDate = AK.parseDate, shortDate = AK.shortDate, shortEnglish = AK.shortEnglish;

  /**
   * Fills the page from the data file.
   *
   *   data-text="groom.name"      text content ("a|b" falls back to b)
   *   data-src="groom.photo"      an <img> source
   *   data-photo="cover.photo"    a background image
   *   data-date="weddingDate"     a date, long or short
   *   data-parents="groom"        the two parent lines, each dropped when unnamed
   *
   * Text always goes in as text, so nothing in the data file can inject markup.
   */
  function bind(root = document) {
    // "a|b" takes the first key that has something in it, so the formal name can be
    // left out without the page showing a blank where a name belongs
    root.querySelectorAll("[data-text]").forEach((el) => {
      const key = el.dataset.text.split("|").find((k) => has(k.trim()) && get(k.trim()) !== "");
      el.textContent = (key ? get(key.trim()) : "") ?? "";
    });

    root.querySelectorAll("[data-src]").forEach((el) => {
      const src = get(el.dataset.src);
      if (src) el.src = src;
      else el.remove();
    });

    // a <source> inside <picture>, for the crop a narrow screen gets instead
    root.querySelectorAll("[data-srcset]").forEach((el) => {
      const src = get(el.dataset.srcset);
      if (src) el.srcset = src;
      else el.remove();
    });

    // a background picture, with an optional second one for narrow screens: both are
    // written as custom properties so the stylesheet decides which applies where
    root.querySelectorAll("[data-photo]").forEach((el) => {
      const clean = (v) => `url("${String(v).replace(/["\\\n]/g, "")}")`;
      const wide = get(el.dataset.photo);
      const small = el.dataset.photoMobile ? get(el.dataset.photoMobile) : null;
      if (wide) el.style.setProperty("--photo", clean(wide));
      if (small) el.style.setProperty("--photo-mobile", clean(small));
    });

    root.querySelectorAll("[data-date]").forEach((el) => {
      const date = parseDate(get(el.dataset.date));
      if (!date) return;
      const how = el.dataset.dateFormat;
      el.textContent = how === "long" ? longDate(date)
        : how === "dot" ? dottedDate(date)
        : how === "en" ? shortEnglish(date)
        : shortDate(date);
      el.setAttribute("datetime", get(el.dataset.date));
    });

    root.querySelectorAll("[data-parents]").forEach((el) => {
      const side = el.dataset.parents;
      const lines = [
        has(`${side}.father`) ? `Con ông: ${get(`${side}.father`)}` : null,
        has(`${side}.mother`) ? `Con bà: ${get(`${side}.mother`)}` : null,
      ].filter(Boolean);
      el.replaceChildren(...lines.flatMap((line, i) => (
        i === 0 ? [document.createTextNode(line)]
                : [document.createElement("br"), document.createTextNode(line)]
      )));
      el.hidden = lines.length === 0;
    });

    // a block of text written as several lines, each becoming its own paragraph
    root.querySelectorAll("[data-lines]").forEach((el) => {
      const lines = String(get(el.dataset.lines) ?? "").split("\n").filter((l) => l.trim());
      el.replaceChildren(...lines.map((line) => {
        const p = document.createElement("p");
        p.textContent = line;
        return p;
      }));
    });

    const title = get("pageTitle");
    if (title) document.title = title;
  }

  AK.bind = bind;
})(window.AK = window.AK || {});
