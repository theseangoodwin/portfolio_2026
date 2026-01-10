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
