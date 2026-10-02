/* The Vietnamese lunar calendar, after Ho Ngoc Duc's algorithm.
   Pure arithmetic: no data, no dependencies, nothing to configure. */
(function (AK) {
  "use strict";

  var data = AK.data;

  function jd(dd, mm, yy) {
    var a = Math.floor((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
    var n = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
          - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    if (n < 2299161) n = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
    return n;
  }
  function newMoon(k) {
    var T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = Math.PI / 180;
    var j = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
          + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    var Mp = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    var F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    var c = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M)
          - 0.4068 * Math.sin(Mp * dr) + 0.0161 * Math.sin(2 * dr * Mp)
          - 0.0004 * Math.sin(3 * dr * Mp) + 0.0104 * Math.sin(2 * dr * F)
          - 0.0051 * Math.sin(dr * (M + Mp)) - 0.0074 * Math.sin(dr * (M - Mp))
          + 0.0004 * Math.sin(dr * (2 * F + M)) - 0.0004 * Math.sin(dr * (2 * F - M))
          - 0.0006 * Math.sin(dr * (2 * F + Mp)) + 0.0010 * Math.sin(dr * (2 * F - Mp))
          + 0.0005 * Math.sin(dr * (2 * Mp + M));
    var dt = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
                     : -0.000278 + 0.000265 * T + 0.000262 * T2;
    return j + c - dt;
  }
  function sunLongitude(d) {
    var T = (d - 2451545.0) / 36525, T2 = T * T, dr = Math.PI / 180;
    var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    var L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    var dl = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M)
           + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    var L = (L0 + dl) * dr;
    return L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  }
  var TZ = 7;
  function sunIndex(d) { return Math.floor(sunLongitude(d - 0.5 - TZ / 24) / Math.PI * 6); }
  function newMoonDay(k) { return Math.floor(newMoon(k) + 0.5 + TZ / 24); }
  function lunarMonth11(yy) {
    var off = jd(31, 12, yy) - 2415021, k = Math.floor(off / 29.530588853), nm = newMoonDay(k);
    if (sunIndex(nm) >= 9) nm = newMoonDay(k - 1);
    return nm;
  }
  function leapMonthOffset(a11) {
    var k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5), i = 1, last;
    var arc = sunIndex(newMoonDay(k + i));
    do { last = arc; i++; arc = sunIndex(newMoonDay(k + i)); } while (arc !== last && i < 14);
    return i - 1;
  }
  function toLunar(dd, mm, yy) {
    var dn = jd(dd, mm, yy), k = Math.floor((dn - 2415021.076998695) / 29.530588853);
    var start = newMoonDay(k + 1);
    if (start > dn) start = newMoonDay(k);
    var a11 = lunarMonth11(yy), b11 = a11, ly;
    if (a11 >= start) { ly = yy; a11 = lunarMonth11(yy - 1); } else { ly = yy + 1; b11 = lunarMonth11(yy + 1); }
    var day = dn - start + 1, diff = Math.floor((start - a11) / 29), month = diff + 11;
    if (b11 - a11 > 365) { var lo = leapMonthOffset(a11); if (diff >= lo) month = diff + 10; }
    if (month > 12) month -= 12;
    if (month >= 11 && diff < 4) ly--;
    return { day: day, month: month, year: ly };
  }

  /* ---- labels shown to the reader ---- */
  var WEEKDAY = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  var MONTH = ["Tháng Giêng", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu",
               "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Chạp"];


  /** A Date -> { day, month, year, leap } in the lunar calendar. */
  function toLunarDate(date) {
    return toLunar(date.getDate(), date.getMonth() + 1, date.getFullYear());
  }

  AK.toLunarDate = toLunarDate;
})(window.AK = window.AK || {});
