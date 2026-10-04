/* Runs each piece in turn. One failing leaves the rest of the page working. */
(function (AK) {
  "use strict";
  var steps = [AK.bind, AK.openDoors, AK.renderStory, AK.renderCeremonies, AK.renderCalendar,
               AK.renderAlbum, AK.setupPortraits, AK.setupForms, AK.setupWishFull, AK.setupCredits, AK.setupMusic, AK.setupDock, AK.startCountdown, AK.startMotion];
  for (var i = 0; i < steps.length; i++) {
    try {
      steps[i](document);
    } catch (err) {
      console.error("step " + i + " failed", err);
    }
  }
})(window.AK = window.AK || {});
