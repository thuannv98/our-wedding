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
 *
 * The page also reads the wishes back to show them. That one list is public; the RSVP
 * tab is not exposed by anything here. See doGet.
 */

var SECRET = 'change-this-string';   // must match form.secret in the page
var MAX_PER_MINUTE = 20;             // throttle: rows accepted per minute

// Tab names and column headers are read by the couple, so they stay in Vietnamese.
var RSVP_TAB = 'Xác nhận';
var RSVP_HEADERS = ['Thời điểm', 'Họ tên', 'Tham dự', 'Nơi tham dự', 'Số người', 'Lời nhắn'];
var WISH_TAB = 'Lời chúc';
var WISH_HEADERS = ['Thời điểm', 'Họ tên', 'Quan hệ', 'Lời chúc', 'Ẩn'];
var WISH_CACHE_SECONDS = 120;        // how long the page may show a stale list

/**
 * Reading back.
 *
 * Only the wishes, and only name, relation and wish: no timestamps, and nothing at all
 * from the RSVP tab. Whatever this returns is public, because the page that calls it is
 * public and its URL is in the page source. Who is coming, how many they bring and what
 * they said privately is the couple's business, so it never leaves the sheet.
 *
 * No secret guards this. One would have to ship in the page to be usable, which makes it
 * decoration rather than a control, and pretending otherwise is worse than saying so.
 *
 * Put an x in the Ẩn column to drop a row from the page. A row is shown unless told
 * otherwise, so a guest who writes a wish sees it appear instead of waiting on approval.
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.what !== 'wishes') return empty_();   // a plain browser visit still reveals nothing

  var cache = CacheService.getScriptCache();
  var hit = cache.get('wishes');
  if (hit) return json_(hit);

  var out = [];
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WISH_TAB);
    if (sheet && sheet.getLastRow() > 1) {
      var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, WISH_HEADERS.length).getValues();
      for (var i = rows.length - 1; i >= 0 && out.length < 200; i--) {   // newest first
        if (String(rows[i][4] || '').trim()) continue;                   // the Ẩn column
        var wish = String(rows[i][3] || '').trim();
        if (!wish) continue;
        out.push({
          name: String(rows[i][1] || '').trim(),
          relation: String(rows[i][2] || '').trim(),
          wish: wish
        });
      }
    }
  } catch (err) {
    return json_('[]');   // the page shows the book without a list rather than an error
  }

  var body = JSON.stringify(out);
  cache.put('wishes', body, WISH_CACHE_SECONDS);
  return json_(body);
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
      new Date(), name, clip_(p.relation, 60), clip_(p.wish, 500), ''
    ]);
    CacheService.getScriptCache().remove('wishes');   // so the writer sees their own row
    return say_('ok: ' + WISH_TAB);
  } catch (err) {
    return say_('error: ' + err);
  }
}

function empty_() { return ContentService.createTextOutput(''); }

function json_(body) {
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function say_(text) { return ContentService.createTextOutput(text); }

function clip_(value, max) { return String(value == null ? '' : value).slice(0, max); }

function tab_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return sheet;
  }
  // a tab created before a column was added keeps its old header row, which leaves the
  // couple guessing what the blank column is for
  var row = sheet.getRange(1, 1, 1, headers.length);
  var have = row.getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(have[i] || '').trim()) continue;
    have[i] = headers[i];
  }
  row.setValues([have]);
  return sheet;
}

function tooFast_() {
  var cache = CacheService.getScriptCache();
  var key = 'count-' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 120);
  return n > MAX_PER_MINUTE;
}
