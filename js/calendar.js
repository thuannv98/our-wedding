(function (AK) {
  "use strict";

  var data = AK.data, get = AK.get, has = AK.has, lunarLabel = AK.lunarLabel, monthName = AK.monthName, parseDate = AK.parseDate;

  // the week runs Monday to Sunday, as the old calendar laid it out
  const WEEKDAY_HEADS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  /* which ceremony gets which mark, by its key in the data file */
  const MARKS = {
    mass: { icon: "rings", label: "Thánh lễ Hôn phối" },
    brideParty: { icon: "bride", label: "Tiệc nhà gái" },
    groomParty: { icon: "groom", label: "Tiệc nhà trai" },
  };

  const ICONS = {
    rings: `<svg class="std__rings" viewBox="0 0 60 44" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3.4">
      <circle cx="23" cy="27" r="13"/><circle cx="38" cy="27" r="13"/></g>
      <path d="M33 5l5 7h-10z" fill="currentColor"/></svg>`,
    bride: `<img class="std__ico" src="img/ic-bride.png" alt="" />`,
    groom: `<img class="std__ico" src="img/ic-groom.png" alt="" />`,
  };

  /**
   * The month the wedding falls in, with a mark on every ceremony day.
   * The marks come from the ceremonies list, so moving a date moves its icon.
   */
  function renderCalendar(root = document) {
    const box = root.querySelector("[data-calendar]");
    if (!box) return;
    const anchor = parseDate(get(box.dataset.calendar));
    if (!anchor) { box.hidden = true; return; }

    const year = anchor.getFullYear(), month = anchor.getMonth();
    const marked = new Map();          // day of month -> [mark, ...]
    for (const c of get("ceremonies") || []) {
      const d = parseDate(c.date);
      const mark = MARKS[c.key];
      if (!d || !mark || d.getFullYear() !== year || d.getMonth() !== month) continue;
      if (!marked.has(d.getDate())) marked.set(d.getDate(), []);
      marked.get(d.getDate()).push(mark);
    }

    const first = (new Date(year, month, 1).getDay() + 6) % 7;   // Monday is column one
    const days = new Date(year, month + 1, 0).getDate();

    const head = WEEKDAY_HEADS.map((d) => `<div class="std__wd">${d}</div>`).join("");
    const blanks = Array.from({ length: first }, () => '<div class="std__day std__day--empty"></div>');
    const cells = Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const marks = marked.get(day) || [];
      const icons = marks.length
        ? `<span class="std__marks">${marks.map((m) => ICONS[m.icon]).join("")}</span>`
        : "";
      return `<div class="std__day${marks.length ? " std__day--marked" : ""}">
        ${icons}<span class="std__solar">${day}</span>
        <span class="std__lunar">${lunarLabel(new Date(year, month, day))}</span>
      </div>`;
    });

    const legend = [...new Set([...marked.values()].flat())]
      .map((m) => `<span>${ICONS[m.icon]}${m.label}</span>`).join("");

    box.innerHTML = `
      <p class="std__month">${monthName(month)} <span>${year}</span></p>
      <div class="std__grid std__grid">${head}</div>
      <div class="std__grid">${blanks.join("")}${cells.join("")}</div>
      <p class="std__legend">${legend}</p>`;
  }

  AK.renderCalendar = renderCalendar;
})(window.AK = window.AK || {});
