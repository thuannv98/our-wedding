(function (AK) {
  "use strict";

  var get = AK.get, parseDate = AK.parseDate, pad = AK.pad;

  const SECOND = 1000, MINUTE = 60 * SECOND, HOUR = 60 * MINUTE, DAY = 24 * HOUR;

  /** Counts down to the wedding and stops there rather than running negative. */
  function startCountdown(root = document) {
    const box = root.querySelector("[data-countdown]");
    if (!box) return;
    const target = parseDate(get(box.dataset.countdown));
    if (!target) { box.hidden = true; return; }

    const parts = {};
    box.querySelectorAll("[data-countdown-part]").forEach((el) => {
      parts[el.dataset.countdownPart] = el;
    });

    const tick = () => {
      const left = Math.max(0, target - Date.now());
      parts.days.textContent = Math.floor(left / DAY);
      parts.hours.textContent = pad(Math.floor((left % DAY) / HOUR));
      parts.minutes.textContent = pad(Math.floor((left % HOUR) / MINUTE));
      parts.seconds.textContent = pad(Math.floor((left % MINUTE) / SECOND));
      return left;
    };

    if (tick() === 0) return;
    const timer = setInterval(() => { if (tick() === 0) clearInterval(timer); }, SECOND);
  }

  AK.startCountdown = startCountdown;
})(window.AK = window.AK || {});
