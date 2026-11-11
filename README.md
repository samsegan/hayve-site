# hayve: artist site

A work-in-progress artist site for hayve (Aaro and Omer; drum & bass and
dubstep, Finland and Tel Aviv). It borrows from two sites:

- [nth-marchingband.studio.site](https://nth-marchingband.studio.site/): the
  black page, the tilted and widely spaced lines of type, the spray-edged
  discs that hold the text and the photos, the flat paper-cut pictures that
  move as the page scrolls, the name stacked in the corner, the corner
  triangle, the small crosses and the pinched buttons.
- [bmsgfes.tokyo/2025](https://bmsgfes.tokyo/2025/#maininfo): the gate with a
  thick, turning mark and an Enter button, the star dust, the grainy foil
  cards with very large serif titles, the big date numerals, the vertical
  titles, the lines of type running behind the cards, the small clock on the
  edge and the tag that follows the pointer.

Preview: https://samsegan.github.io/hayve-site/ (GitHub Pages from `main`).
The page carries `noindex` and a "Preview build, not yet official" line until
hayve take it over.

## Two versions

- **First version** (this folder's `index.html`): the one described below.
- **Dark version** (`dark/`, https://samsegan.github.io/hayve-site/dark/):
  the same sections and wording, much darker, and closer to the BMSG site.
  No owl drawings: only hayve's own mark, as a solid object (three.js,
  `dark/mark3d.js`) that stays behind the page. Each section opens with a
  "hub" screen (the mark seen from a new side, a large serif title and a Dive
  button), then its cards: steel foil instead of indigo, black glass for the
  lists, an eclipse (after their Oblivion cover) for the contact screen. It
  shares `art/`, `img/`, `fonts/` and `js/data.js` with the first version, so
  a new record or a rebuilt picture shows in both. Wording lives in each
  version's own `index.html`: change it in both.
  - Camera places are named in `POSES` at the top of `dark/mark3d.js`; each
    block of the page picks one with `data-pose`.
  - `dark/vendor/three.module.min.js` is three.js 0.160 (MIT licence, kept
    beside it).

## Colours and type

From hayve's own mark and cover art, not from the two references:

| Colour | Where it comes from |
|---|---|
| Ink `#050507` | the black of the mark's ground and the press pictures |
| Moon `#eceae3` | the white owl mark |
| Indigo `#5a45ee`, `#4433c6`, `#8f80ff` | the Portal, Clique, Hideaway and Scream covers |
| Night `#181838` | the star field behind the mark on their profiles |
| Ice `#c8d4ff` | the lightning on the covers |

Type: Bodoni Moda (the large serif), Josefin Sans (the thin spaced lines) and
Bebas Neue (the narrow facts). All three are open-licence Google Fonts, kept
in `fonts/`.

The owl mark is traced from hayve's own profile picture
(`data/mark.json`). The owls on the page wear it as their face: the brow is
the mark, the two crescents are the eyes.

## What is on the page

1. **Gate**: the mark, cut thick, turning under a light. Enter, or scroll.
2. **Opening**: "We wanna see you bounce" (their own caption for the new
   single), then the owl flies in over a moon, with one flash of lightning.
3. **About**: who they are, in a moon, beside the alley portrait.
4. **Out now**: See U Bounce with Segan (Monstercat, 23 Sep 2026): date,
   listening links, cover, a play button.
5. **Selected records**: six records on indigo, five owls on a wire.
6. **Every record**: all 46 releases as cards in a strip that drags sideways.
7. **Live + news**: past shows and the latest four pieces of news.
8. **Contact**: the two addresses from their SoundCloud profile, and links.

On wide screens a record plays in a bar at the bottom of the page
(SoundCloud's own player behind our controls). On phones, and for records
that are not on their SoundCloud, Play opens the record where it lives.

## Files

- `index.html`: all wording, the six selected records, the live and news
  lists.
- `css/styles.css`, `js/app.js`: look and behaviour. No build step.
- `data/catalog.json`: every record (title, who with, date, label, links).
  `js/data.js` is made from it.
- `tools/build.py`: makes `js/data.js`, the spray-edged shapes, the grain,
  and (with `--src`) the pictures in `art/` and `img/`.

```bash
uv run --with pillow --with numpy tools/build.py
```

```bash
python3 -m http.server 8815
```

## Changing things

- **A new record**: add it at the top of `data/catalog.json`, put its cover
  in `art/<id>.jpg` (480 px square), run the build. For a new single also
  edit the "Out now" block in `index.html`.
- **A show**: edit the table in the "Live" block of `index.html`. The first
  row is the next date.
- **News**: edit the list in the "News" block.
- **A label is only written where a source names it** (Apple Music's
  copyright line, or the label's own upload). Where none does, the card
  leaves it out.

## Where the facts come from

Releases and labels: Apple Music, Spotify and SoundCloud listings. Biography:
Monstercat's artist page and a UKF interview. Shows and news: hayve's own
posts, Songkick, and an event listing for the Jyväskylä night. Contact
addresses: their SoundCloud profile. Photos are from hayve's own posts
(@audr_im and @krizumo where credited) and need their OK before the site is
called official. The wording is a draft for them to edit.
