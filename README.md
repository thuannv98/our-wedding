# Our wedding

A static invitation. No server, no build step, no dependencies: push it to GitHub Pages
and it runs. Open `index.html` off the disk and it runs there too.

## Editing the content

Everything a guest reads is in **`data.js`**, and nothing else needs touching.

| Key | What it holds |
|---|---|
| `pageTitle` | the browser tab |
| `cover` | the opening photo and the line above the names |
| `groom`, `bride` | name, parents, home, their photo, intro, quote, portrait gallery |
| `coupleBackdrop` | the arch behind the two of them |
| `ceremonies` | a list: title, time, date, venue, address, map link, photo |
| `weddingDate` | the month the calendar shows |
| `album` | the album, in order |
| `text` | the longer passages |
| `wishRelations`, `wishSuggestions` | what the guest book offers |
| `form` | the Apps Script endpoint and shared secret |

Names say what they are: `album` is the album, `groom.photo` is his picture. Add a photo
to `album` and a tile appears. Add a fourth ceremony and a fourth card appears, with its
own option in the RSVP. Change a date and its weekday, its lunar date and its mark on the
calendar all follow.

Leave a parent's name empty and that line disappears, with the other centred in its place.

## How it fits together

```
index.html      the structure, and nothing else: no styles, no content, no logic
data.js         everything a guest reads
css/tokens.css  every colour, size, font and spacing, declared once
css/base.css    element defaults
css/layout.css  the section rhythm and the alternating grounds
css/components.css   buttons, cards, forms, calendar, album, dialogs
css/sections.css     what is particular to one section
js/             one module per thing the page does
test/           node test/page.test.mjs, node test/discipline.test.mjs
```

Two rules hold the shape, and `test/discipline.test.mjs` fails if either breaks: a colour
or a font is only ever named in `css/tokens.css`, and `index.html` carries no inline style
and no style block. The same test checks that every picture named in `data.js` exists and
that no key in it has gone unread.

Sections alternate white and pale on their own, from `:nth-of-type`. Reorder them in the
HTML and the alternation follows; none of them names its own background.

## Collecting RSVPs and wishes in a Google Sheet

1. Create a Google Sheet with a **personal** Google account
2. Extensions → Apps Script, paste all of `apps-script.gs`
3. Change `SECRET` to a string of your own, and put the same one in `form.secret`
4. Deploy → New deployment → Web app, Execute as **Me**, access **Anyone**
5. Copy the URL into `form.endpoint`

After every later edit to the script: Deploy → **Manage deployments** → the pencil →
Version: **New version**. A deployment keeps serving the version it was created from.

Check it with:

```bash
curl -sL "<your url>" -d secret=<SECRET> -d kind=ping
```

It answers `ok: <sheet name>`, or names what it rejected. No `-X POST`: a successful run
redirects to a URL that serves over GET only, and forcing the method earns a 405 dressed
up as a Google Drive error page.

The wishes are read back onto the page; the RSVP answers never are. Anything the page can
fetch, any visitor can fetch, so who is coming and what they said privately stays in the
sheet. Put an `x` in the `Ẩn` column to drop a wish from the page.

## Deploying

```bash
git add -A && git commit -m "update" && git push
```

Then Settings → Pages → branch `main`, folder `/ (root)`. `.nojekyll` is already there.

The page carries `noindex, nofollow`, so search engines leave it alone and only people
given the link find it. That is not a lock: anyone with the link can open it.

## Still to do

The photos from the original template have been replaced, but check `img/` for any that
remain before sending the link to guests.
