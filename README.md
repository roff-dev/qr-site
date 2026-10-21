# qr-site

This is the page people land on when they scan the QR code on my CV or business card. It links to my portfolio, my projects, GitHub and LinkedIn. It's plain HTML and CSS with no JavaScript, served from Cloudflare Workers static assets.

## Updating the links

Everything is in `public/index.html`. Each link is an `<a class="card">` with an icon, a name and a short description, so I edit the `href` and text there. To add a project I copy one of the cards inside `<div class="cards">`. The grid is two columns with the portfolio card spanning both (`class="card wide"`), so an even number of projects looks best. The page is meant to fit on one phone screen, so `npm run check` fails if a change makes it scroll.

If I change the name, title or projects, I also update the `<title>`, meta description and Open Graph tags at the top, then regenerate the social preview image (see below).

## QR code

The QR button at the top right of the page opens a panel showing a QR code for the site, so I can hold my phone up for people to scan. The code is a static image (`public/qr.svg`), and print copies live in `qr/` (an SVG and a 2048px PNG). If the site's URL ever changes, I update `siteUrl` in `tests/generate-qr.mjs` and `qrUrl` in `tests/check.mjs`, then run `npm run qr`.

## Running it locally

```sh
npx wrangler dev
```

That serves `public/` at http://localhost:8787, with `public/404.html` for unknown paths, the same as it works when deployed.

## Tests

The checks live in `tests/` and are never deployed. With `wrangler dev` running:

```sh
cd tests
npm install
npm run check        # screenshots at 320–1280px, fits one screen, 48px tap targets, QR decodes, link status
npm run lighthouse   # mobile Lighthouse scores
npm run images       # regenerate favicon PNGs and og.png
npm run qr           # regenerate the QR code
```

Both `check` and `lighthouse` take an optional URL, so I can point them at the live site too. Screenshots and the Lighthouse report go into gitignored folders inside `tests/`.

## Deploying

```sh
npx wrangler deploy
```
