# Our wedding

A static invitation. No server, no build step: push it to GitHub Pages and it runs.

## Editing the content

Open `index.html` and find `window.__AK_DATA__` near the bottom. Everything a reader
sees is in that one block:

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
5. Copy the URL into `__AK_DATA__.form.endpoint`
6. Put the same `SECRET` into `__AK_DATA__.form.secret`

Google will warn that the app is unverified. That warning is for apps asking *other*
people for access; here only you authorise it, and the script only touches your own
sheet. Click **Advanced → Go to (project name)** to continue.

The sheet stays private. Guests never authenticate; they only invoke the script, and the
script only appends a row. Tabs `Xác nhận` and `Lời chúc` are created on first use.

Leave `endpoint` empty and the forms simply keep answers in the guest's own browser.

## Deploying

```bash
git add -A && git commit -m "update" && git push
```

Then repo Settings → Pages → branch `main`, folder `/ (root)`.
`.nojekyll` is already present so GitHub serves every folder as-is.

## Layout

```
index.html        the whole page, including the data block
img/              176 images
media/            background-music.mp3
apps-script.gs    paste into Google Apps Script
```

File and folder names are English. The only Vietnamese left anywhere is the wording a
guest reads: the invitation copy, the button labels, the toast messages, and the two
sheet tabs.
