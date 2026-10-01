/**
 * Receives RSVPs and well-wishes from the wedding invitation and appends them to
 * two tabs of this spreadsheet.
 *
 * SETUP
 *  1. In your Google Sheet: Extensions > Apps Script, paste this file
 *  2. Change SECRET below to any string of your own
 *  3. Deploy > New deployment > Web app
 *       Execute as:      Me
 *       Who has access:  Anyone
 *  4. Copy the URL it gives you into form.endpoint in data.js
 *  5. Put the same SECRET into form.secret
 *
 * After EVERY edit to this file: Deploy > Manage deployments > the pencil icon >
 * Version: New version > Deploy. A deployment serves the version it was created from,
 * so skipping this leaves the old code running and the URL answering
 * "Script function not found: doPost". Editing the deployment keeps the same URL;
 * "New deployment" issues a different one and data.js would need the new value.
 *
 * To check a deployment from a terminal, with SECRET as its own value:
 *
 *   curl -sL "<url>" -d secret=<SECRET> -d kind=ping
 *
 * It answers "ok: <sheet name>", or names what it rejected. A browser visit answers
 * nothing at all, which is also what a request with the wrong secret gets.
 *
 * Leave out -X POST. A successful run answers 302 to script.googleusercontent.com,
 * which serves the output over GET only; -X POST forces the method through the
 * redirect and earns a 405 dressed up as a Google Drive "can't open the file" page.
 * -d already makes it a POST, and curl then switches to GET for the redirect.
 *
 * The sheet stays private. This script runs as you, so it may write to it; a guest
 * can only invoke the script, and the script only ever appends a row.
 */

var SECRET = 'change-this-string';   // must match form.secret in the page
var MAX_PER_MINUTE = 20;             // throttle: rows accepted per minute

// Tab names and column headers are read by the couple, so they stay in Vietnamese.
var RSVP_TAB = 'Xác nhận';
var RSVP_HEADERS = ['Thời điểm', 'Họ tên', 'Tham dự', 'Nơi tham dự', 'Số người', 'Lời nhắn'];
var WISH_TAB = 'Lời chúc';
var WISH_HEADERS = ['Thời điểm', 'Họ tên', 'Quan hệ', 'Lời chúc'];

function doGet() {                   // opening the URL in a browser reveals nothing
  return empty_();
}

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Anyone without the secret learns nothing, which is what keeps a passer-by from
  // probing the endpoint. Past that point the reply says what happened, because the
  // alternative is a silent setup with no way to tell a wrong secret from a wrong tab.
  if (p.secret !== SECRET) return empty_();

  try {
    if (p.website) return say_('honeypot');            // must stay empty for a real guest
    if (p.kind === 'ping') return say_('ok: ' + SpreadsheetApp.getActiveSpreadsheet().getName());
    if (['rsvp', 'wish'].indexOf(p.kind) < 0) return say_('bad-kind: ' + (p.kind || '(missing)'));
    var name = String(p.name || '').trim();
    if (!name || name.length > 80) return say_('bad-name');
    if (tooFast_()) return say_('too-fast');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return say_('error: no spreadsheet. Create this script from the sheet itself, '
                       + 'with Extensions > Apps Script, not as a standalone project.');

    if (p.kind === 'rsvp') {
      tab_(ss, RSVP_TAB, RSVP_HEADERS).appendRow([
        new Date(), name, clip_(p.attending, 40), clip_(p.venue, 60),
        clip_(p.guests, 10), clip_(p.message, 500)
      ]);
      return say_('ok: ' + RSVP_TAB);
    }
    tab_(ss, WISH_TAB, WISH_HEADERS).appendRow([
      new Date(), name, clip_(p.relation, 60), clip_(p.wish, 500)
    ]);
    return say_('ok: ' + WISH_TAB);
  } catch (err) {
    return say_('error: ' + err);
  }
}

function empty_() { return ContentService.createTextOutput(''); }

function say_(text) { return ContentService.createTextOutput(text); }

function clip_(value, max) { return String(value == null ? '' : value).slice(0, max); }

function tab_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function tooFast_() {
  var cache = CacheService.getScriptCache();
  var key = 'count-' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 120);
  return n > MAX_PER_MINUTE;
}
