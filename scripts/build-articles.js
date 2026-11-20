const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function renderArticle(markdown) {
    const definitions = new Map();
    const body = markdown.replace(/^\[\^([\w-]+)\]:\s*(.*(?:\n(?: {4}|\t).*)*)/gm, (_, id, note) => {
        definitions.set(id, note.replace(/\n(?: {4}|\t)/g, '\n'));
        return '';
    });
    const parser = new Marked();
    let references = 0;
    const numbers = new Map();
    parser.use({ extensions: [{
        name: 'inlineFootnote', level: 'inline',
        start: source => source.indexOf('[^'),
        tokenizer(source) {
            const match = /^\[\^([\w-]+)\]/.exec(source);
            if (!match) return;
            if (!definitions.has(match[1])) throw new Error(`Missing footnote definition: ${match[1]}`);
            return { type: 'inlineFootnote', raw: match[0], id: match[1] };
        },
        renderer(token) {
            if (!numbers.has(token.id)) numbers.set(token.id, numbers.size + 1);
            const number = numbers.get(token.id);
            const reference = ++references;
            const note = markedInline(definitions.get(token.id));
            return `<button type="button" class="footnote-toggle" id="note-ref-${reference}" aria-expanded="true" aria-controls="note-${reference}" aria-label="Footnote ${number}">${number}</button><span class="footnote-content" id="note-${reference}" role="note" tabindex="0" aria-label="Footnote ${number}"><span class="footnote-number">${number}.</span>${note}</span>`;
        }
    }] });
    const markedInline = value => new Marked().parseInline(value);
    return parser.parse(body).replace(/<p>([^]*?)<\/p>/g, (paragraph, contents) => {
        if (!contents.includes('<img')) return paragraph;
        return contents.split(/(<img\b[^>]*>)/g).map(part => part.trim() ? `<p>${part.trim()}</p>` : '').join('\n');
    }).replace(/<p>(<img\b[^>]*>)<\/p>\s*(<blockquote>[\s\S]*?<\/blockquote>|<p>[\s\S]*?<\/p>)/g,
        '<div class="article-illustrated"><div class="article-illustration"><div class="article-photo">$1</div></div><div class="article-illustrated-copy">$2</div></div>');
}

module.exports = function buildArticles(root) {
    const newsletter = JSON.parse(fs.readFileSync(path.join(root, 'content/newsletter.json'), 'utf8'));
    const source = path.join(root, 'content/articles');
    const output = path.join(root, 'dist/articles');
    fs.mkdirSync(output, { recursive: true });
    const template = fs.readFileSync(path.join(root, 'src/article.html'), 'utf8');
    const articles = fs.readdirSync(source).filter(file => file.endsWith('.md')).map(file => {
        const markdown = fs.readFileSync(path.join(source, file), 'utf8');
        const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(markdown);
        if (!match) throw new Error(`Missing article metadata: ${file}`);
        const metadata = Object.fromEntries(match[1].split('\n').map(line => {
            const colon = line.indexOf(':');
            if (colon < 1) throw new Error(`Invalid metadata in ${file}: ${line}`);
            return [line.slice(0, colon), line.slice(colon + 1).trim()];
        }));
        for (const key of ['title', 'description', 'date']) if (!metadata[key]) throw new Error(`Missing ${key} in ${file}`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.date) || Number.isNaN(Date.parse(metadata.date))) throw new Error(`Invalid date in ${file}`);
        return { ...metadata, slug: path.basename(file, '.md'), body: match[2] };
    }).sort((a, b) => b.date.localeCompare(a.date));
    let subscribe;
    if (newsletter.buttondownUsername) {
        const username = encodeURIComponent(newsletter.buttondownUsername);
        subscribe = `<form class="subscribe-form" action="https://buttondown.com/api/emails/embed-subscribe/${username}" method="post"><label for="subscribe-email">Your email address</label><div class="subscribe-fields"><input id="subscribe-email" type="email" name="email" autocomplete="email" placeholder="you@example.com" required><button type="submit">Subscribe →</button></div><input type="hidden" name="embed" value="1"><span class="subscribe-caption">You’ll continue to Buttondown to confirm your subscription.</span></form>`;
    } else {
        const url = new URL(newsletter.fallbackSubscribeUrl);
        if (url.protocol !== 'https:') throw new Error('Subscribe URL must use HTTPS');
        subscribe = `<a class="subscribe-link" href="${escapeHtml(url.href)}">Subscribe to the newsletter →</a>`;
    }
    for (const article of articles) {
        const values = {
            TITLE: escapeHtml(article.title), DESCRIPTION: escapeHtml(article.description),
            DATE: article.date, DISPLAY_DATE: new Date(article.date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
            STATUS: escapeHtml(article.status || 'Essay'),
            READING_TIME: Math.max(1, Math.ceil(article.body.split(/\s+/).length / 220)),
            ARTICLE_CONTENT: renderArticle(article.body.replace(/<!-- FIDELITY_DIAGRAM(_SECOND)? -->/g, (_, second) => {
                const stage = second ? 2 : 1;
                const svg = fs.readFileSync(path.join(root, 'src/fidelity-diagram.svg'), 'utf8').trim()
                    .replace('class="fidelity-diagram"', `class="fidelity-diagram" data-stage="${stage}"`)
                    .replace(/fidelity-title/g, `fidelity-title-${stage}`)
                    .replace(/fidelity-description/g, `fidelity-description-${stage}`);
                return `<div class="fidelity-inline">${svg}</div>`;
            })), SUBSCRIBE: subscribe
        };
        const html = template.replace(/<!-- (\w+) -->/g, (match, key) => values[key] ?? match);
        fs.writeFileSync(path.join(output, article.slug + '.html'), html);
    }
    for (const file of ['articles.css', 'articles.js']) fs.copyFileSync(path.join(root, 'src', file), path.join(root, 'dist', file));
    console.log(`  - Generated ${articles.length} article(s)`);
};

module.exports.renderArticle = renderArticle;
