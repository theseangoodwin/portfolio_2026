const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Configuration
const contentDir = path.join(__dirname, 'content');
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Read markdown files
function readMarkdown(filename) {
    const filePath = path.join(contentDir, filename);
    return fs.readFileSync(filePath, 'utf8');
}

// Convert markdown to HTML
function convertMarkdown(markdown) {
    return marked.parse(markdown);
}

// Read template
const templatePath = path.join(srcDir, 'index.html');
let html = fs.readFileSync(templatePath, 'utf8');

// Process content files
const experienceMarkdown = readMarkdown('experience.md');
const writingMarkdown = readMarkdown('writing.md');
const readingMarkdown = readMarkdown('reading.md');

const experienceHtml = convertMarkdown(experienceMarkdown);
const writingHtml = convertMarkdown(writingMarkdown);
const readingHtml = convertMarkdown(readingMarkdown);

// Inject content into template
html = html.replace('<!-- EXPERIENCE_CONTENT -->', experienceHtml);
html = html.replace('<!-- WRITING_CONTENT -->', writingHtml);
html = html.replace('<!-- READING_CONTENT -->', readingHtml);

// Write HTML to dist
const distHtmlPath = path.join(distDir, 'index.html');
fs.writeFileSync(distHtmlPath, html, 'utf8');

// Copy CSS to dist
const srcCssPath = path.join(srcDir, 'styles.css');
const distCssPath = path.join(distDir, 'styles.css');
fs.copyFileSync(srcCssPath, distCssPath);

console.log('✓ Build complete!');
console.log(`  - Generated: ${distHtmlPath}`);
console.log(`  - Copied: ${distCssPath}`);
