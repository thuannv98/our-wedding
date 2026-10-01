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
 *  4. Copy the URL it gives you into __AK_DATA__.form.endpoint in index.html
 *  5. Put the same SECRET into __AK_DATA__.form.secret
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
  try {
    var p = (e && e.parameter) || {};

    if (p.secret !== SECRET) return empty_();          // wrong or missing: drop silently
    if (p.website) return empty_();                    // honeypot, must stay empty
    if (['rsvp', 'wish'].indexOf(p.kind) < 0) return empty_();
    var name = String(p.name || '').trim();
    if (!name || name.length > 80) return empty_();
    if (tooFast_()) return empty_();

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (p.kind === 'rsvp') {
      tab_(ss, RSVP_TAB, RSVP_HEADERS).appendRow([
        new Date(), name, clip_(p.attending, 40), clip_(p.venue, 60),
        clip_(p.guests, 10), clip_(p.message, 500)
      ]);
    } else {
      tab_(ss, WISH_TAB, WISH_HEADERS).appendRow([
        new Date(), name, clip_(p.relation, 60), clip_(p.wish, 500)
      ]);
    }
  } catch (err) {
    // swallowed on purpose: the page cannot read our reply, so surfacing an error
    // here would only leave the guest staring at a form that looks broken
  }
  return empty_();
}

function empty_() { return ContentService.createTextOutput(''); }

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
