# Our wedding

A static invitation. No server, no build step: push it to GitHub Pages and it runs.

## Editing the content

Open `data.js`. It is the only file to edit, and everything a reader sees is in it:

| Key | What it holds |
|---|---|
| `bride`, `groom` | name, parents, home town, short intro, quote |
| `ceremonies.mass` / `.brideParty` / `.groomParty` | title, time, date (`2030-03-24`), venue, address, map link |
| `text` | the longer passages: invitation line, our story, foreword, RSVP lead |
| `images` | file names under `img/` |
| `form` | the Apps Script endpoint and shared secret |

Change a `date` and the weekday, the lunar date, the calendar month and the three
markers on it are all recalculated. Nothing else needs touching.

Leave a parent's name empty and its line disappears, with the remaining one centred in
its place, so a couple with one parent to name does not get a stray "Con ông :".

Keys and comments are English throughout; only the values shown on screen are Vietnamese.

`index.html` loads `data.js` with a plain script tag rather than `fetch`, so opening the
page straight off the disk still works; `fetch` is blocked on `file://` URLs.

The page carries `<meta name="robots" content="noindex, nofollow">`, so search engines
leave it alone and only people given the link find it. Do not add a `robots.txt` rule as
well: blocking the crawl stops that tag being read, which is the opposite of the point.

## Collecting RSVPs and wishes in a Google Sheet

1. Create a Google Sheet with a **personal** Google account
2. Extensions → Apps Script, paste all of `apps-script.gs`
3. Change `SECRET` to a string of your own
4. Deploy → New deployment → Web app
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the URL into `form.endpoint` in `data.js`
6. Put the same `SECRET` into `form.secret`

Google will warn that the app is unverified. That warning is for apps asking *other*
people for access; here only you authorise it, and the script only touches your own
sheet. Click **Advanced → Go to (project name)** to continue.

The sheet stays private. Guests never authenticate; they only invoke the script, and the
script only appends a row. Tabs `Xác nhận` and `Lời chúc` are created on first use.

Leave `endpoint` empty and the forms simply keep answers in the guest's own browser.

### After every edit to the script

Deploy → **Manage deployments** → the pencil → Version: **New version** → Deploy.

A deployment keeps serving the version it was created from, so editing the code alone
changes nothing and the URL answers `Script function not found: doPost`. Use the pencil,
not **New deployment**: that issues a different URL and `data.js` would need updating.

### Checking it works

```bash
curl -sL "<your url>" -d secret=<SECRET> -d kind=ping
```

It answers `ok: <sheet name>`, or names what it rejected (`bad-kind`, `bad-name`,
`too-fast`, `error: …`). An empty answer means the secret did not match. Apps Script
returns 200 even for its own errors, so the body is the only thing worth reading.

Do not add `-X POST`. A successful run answers 302 to `script.googleusercontent.com`,
which serves the output over GET only; `-X POST` forces the method through the redirect
and earns a 405 that renders as a Google Drive "can't open the file" page. `-d` already
makes the request a POST, and curl switches to GET for the redirect on its own.

## Deploying

```bash
git add -A && git commit -m "update" && git push
```

Then repo Settings → Pages → branch `main`, folder `/ (root)`.
`.nojekyll` is already present so GitHub serves every folder as-is.

## Layout

```
index.html        the page, generated; the element-id maps live here
data.js           the content: names, ceremonies, photos, form settings
img/              176 images
media/            background-music.mp3
apps-script.gs    paste into Google Apps Script
```

File and folder names are English. The only Vietnamese left anywhere is the wording a
guest reads: the invitation copy, the button labels, the toast messages, and the two
sheet tabs.
