(function (AK) {
  "use strict";

  var toLunarDate = AK.toLunarDate;

  const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const MONTHS = ["Tháng Một", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu",
    "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Mười Hai"];

  /** "2026-10-23" -> a Date at local midnight, so no timezone shifts the day. */
  function parseDate(iso) {
    const [y, m, d] = String(iso || "").split("-").map(Number);
    return y && m && d ? new Date(y, m - 1, d) : null;
  }

  const weekdayOf = (date) => WEEKDAYS[date.getDay()];
  const monthName = (index) => MONTHS[index];

  /** "Thứ Sáu, ngày 23 tháng 10 năm 2026" */
  function longDate(date) {
    return `${weekdayOf(date)}, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
  }

  /** "23/10/2026" */
  const shortDate = (date) =>
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

  /** The lunar day, written the way a calendar cell shows it. */
  function lunarLabel(date) {
    const l = toLunarDate(date);
    return l.day === 1 ? `${l.day}/${l.month}` : String(l.day);
  }

  /** "Thứ Sáu · 23 tháng 10 năm 2026", the way the calendar heads its month. */
  function dottedDate(date) {
    return weekdayOf(date) + " \u00b7 " + date.getDate() + " tháng "
      + (date.getMonth() + 1) + " năm " + date.getFullYear();
  }

  /** "Oct 23 2026", the way the cover writes it. */
  const SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const shortEnglish = (date) =>
    `${SHORT_EN[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;

  const pad = (n) => String(n).padStart(2, "0");

  AK.parseDate = parseDate;
  AK.weekdayOf = weekdayOf;
  AK.monthName = monthName;
  AK.longDate = longDate;
  AK.shortDate = shortDate;
  AK.lunarLabel = lunarLabel;
  AK.dottedDate = dottedDate;
  AK.shortEnglish = shortEnglish;
  AK.pad = pad;
})(window.AK = window.AK || {});
