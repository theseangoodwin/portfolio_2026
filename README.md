# Portfolio 2026

A text-based digital garden portfolio with monospace typography, inspired by classic literary design.

## Design Philosophy

- **Literary monospace aesthetic**: Manuscript/typewriter feel with warm, book-like colors
- **Text-first**: Content hierarchy through typography and generous whitespace
- **Digital garden**: Evolving collection of experience, writing, and reading
- **Simple build**: Markdown → HTML with minimal tooling

## Tech Stack

- Static HTML/CSS with markdown content
- Build tool: marked.js for markdown parsing
- Deployment: GitHub Pages

## Development

### Setup

```bash
# Install dependencies
npm install
```

### Commands

```bash
# Build the site (generates dist/)
npm run build

# Build and serve locally on http://localhost:8080
npm run dev

# Clean build directory
npm run clean
```

### Content Structure

All content lives in markdown files:

- `content/experience.md` - Work history and roles
- `content/writing.md` - Essays and external writing links
- `content/reading.md` - Current and recommended books

### Making Changes

1. **Update content**: Edit markdown files in `content/`
2. **Update styling**: Edit `src/styles.css`
3. **Update template**: Edit `src/index.html`
4. **Build**: Run `npm run build`
5. **Preview**: Run `npm run dev` and open http://localhost:8080

## Deployment to GitHub Pages

### Option 1: Manual Deployment

1. Build the site: `npm run build`
2. Push the `dist/` folder to GitHub
3. Configure GitHub Pages to serve from the `dist/` directory (or copy dist contents to a `docs/` folder)

### Option 2: GitHub Actions (Automated)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Custom Domain (Optional)

1. Add a `CNAME` file to `dist/` with your domain
2. Configure DNS with your domain provider
3. Enable custom domain in GitHub Pages settings

## Color Palette

- Background: `#fffcf0` (warm cream)
- Text: `#1c1b1a` (dark brown-black)
- Secondary text: `#666666`
- Accent: `#dc3c22` (warm red)

## Typography

- Font: iA Writer Quattro (with fallbacks to IBM Plex Mono, Courier Prime, system monospace)
- Base size: 17px
- Line height: 1.8
- Letter spacing: 0.015em
- Max width: 750px

## License

MIT

## Articles and newsletter

Open `http://localhost:8080/writing.html` for the writing archive, or
`http://localhost:8080/articles/a-place-for-the-work.html` for the sample format.
The sample is demonstration copy, not an imported Substack essay.

To bring an essay over, create `content/articles/your-article-slug.md`:

```markdown
---
title: Your article title
description: A short introduction to the essay.
date: 2026-11-17
---

Your writing goes here, with an inline footnote.[^aside]

## A section heading

More writing.

[^aside]: The aside opens in place when the reader clicks its number.
```

Use plain, unquoted values in the metadata header. `title`, `description`, and
`date` are required; `status` is an optional short label (defaults to “Essay”).
The filename becomes the article URL. Articles appear automatically in the
writing archive, newest first. Markdown supports headings, links, lists, quotes,
code, and images. Use `../images/your-image.jpg` for images stored in `src/images`.
Footnotes accept inline Markdown and four-space-indented continuation lines.
They are numbered by first reference, work with keyboard activation, remain
readable without JavaScript, and are included when printing.

Run `npm run build` after edits; the local server serves the rebuilt files.
The homepage retains its curated entries in `content/writing.md`; update those
links to local article URLs as you migrate individual essays.

### Buttondown

Set `buttondownUsername` in `content/newsletter.json` to your Buttondown username
and rebuild. This renders an email form using Buttondown’s hosted subscription
endpoint; no API key is needed. Buttondown handles the next confirmation step.
Until configured, the page links to `fallbackSubscribeUrl` (currently your
Substack subscribe page). See [Buttondown’s embedding documentation](https://docs.buttondown.com/building-your-subscriber-base).
