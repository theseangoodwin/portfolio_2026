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

// Limit writing entries to a max count and add "view all" link if exceeded
function limitWritingEntries(markdown, maxEntries = 4, substackUrl = 'https://shippingtoprod.substack.com') {
    const lines = markdown.split('\n');
    const headerLine = lines[0]; // # Writing
    const entries = [];
    let currentEntry = null;

    // Parse entries (each starts with ###)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('### ')) {
            if (currentEntry !== null) {
                entries.push(currentEntry.join('\n'));
            }
            currentEntry = [line];
        } else if (currentEntry !== null) {
            currentEntry.push(line);
        }
    }
    if (currentEntry !== null) {
        entries.push(currentEntry.join('\n'));
    }

    // If more than max entries, limit and add link
    if (entries.length > maxEntries) {
        const limitedEntries = entries.slice(0, maxEntries);
        const viewAllLink = `\n[View all writing →](${substackUrl})\n`;
        return headerLine + '\n' + limitedEntries.join('\n') + viewAllLink;
    }

    return markdown;
}

// Recursively copy directory
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    let count = 0;

    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            count += copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            count++;
        }
    });

    return count;
}

// Read templates
const indexTemplatePath = path.join(srcDir, 'index.html');
const workTemplatePath = path.join(srcDir, 'work.html');
const bookshelfTemplatePath = path.join(srcDir, 'bookshelf.html');
let indexHtml = fs.readFileSync(indexTemplatePath, 'utf8');
let workHtml = fs.readFileSync(workTemplatePath, 'utf8');
let bookshelfHtml = fs.readFileSync(bookshelfTemplatePath, 'utf8');

// Process content files for index page
const aboutMarkdown = readMarkdown('about.md');
const writingMarkdown = readMarkdown('writing.md');
const experienceMarkdown = readMarkdown('experience.md');

const aboutHtml = convertMarkdown(aboutMarkdown);
const limitedWritingMarkdown = limitWritingEntries(writingMarkdown);
const writingHtml = convertMarkdown(limitedWritingMarkdown);
const experienceHtml = convertMarkdown(experienceMarkdown);

// Inject content into index template
indexHtml = indexHtml.replace('<!-- ABOUT_CONTENT -->', aboutHtml);
indexHtml = indexHtml.replace('<!-- WRITING_CONTENT -->', writingHtml);
indexHtml = indexHtml.replace('<!-- EXPERIENCE_CONTENT -->', experienceHtml);

// Write index.html to dist
const distIndexPath = path.join(distDir, 'index.html');
fs.writeFileSync(distIndexPath, indexHtml, 'utf8');

// Process content files for work page
const workMarkdown = readMarkdown('work.md');
const workContentHtml = convertMarkdown(workMarkdown);

// Inject content into work template
workHtml = workHtml.replace('<!-- WORK_CONTENT -->', workContentHtml);

// Write work.html to dist
const distWorkPath = path.join(distDir, 'work.html');
fs.writeFileSync(distWorkPath, workHtml, 'utf8');

// Process content files for bookshelf page
const bookshelfMarkdown = readMarkdown('bookshelf.md');
const bookshelfContentHtml = convertMarkdown(bookshelfMarkdown);

// Inject content into bookshelf template
bookshelfHtml = bookshelfHtml.replace('<!-- BOOKSHELF_CONTENT -->', bookshelfContentHtml);

// Write bookshelf.html to dist
const distBookshelfPath = path.join(distDir, 'bookshelf.html');
fs.writeFileSync(distBookshelfPath, bookshelfHtml, 'utf8');

// Copy CSS to dist
const srcCssPath = path.join(srcDir, 'styles.css');
const distCssPath = path.join(distDir, 'styles.css');
fs.copyFileSync(srcCssPath, distCssPath);

// Copy fonts directory to dist
const srcFontsDir = path.join(srcDir, 'fonts');
const distFontsDir = path.join(distDir, 'fonts');
let fontCount = 0;
if (fs.existsSync(srcFontsDir)) {
    if (!fs.existsSync(distFontsDir)) {
        fs.mkdirSync(distFontsDir, { recursive: true });
    }
    const fontFiles = fs.readdirSync(srcFontsDir);
    fontFiles.forEach(file => {
        fs.copyFileSync(
            path.join(srcFontsDir, file),
            path.join(distFontsDir, file)
        );
    });
    fontCount = fontFiles.length;
}

// Copy images directory to dist (recursively)
const srcImagesDir = path.join(srcDir, 'images');
const distImagesDir = path.join(distDir, 'images');
let imageCount = 0;
if (fs.existsSync(srcImagesDir)) {
    imageCount = copyDirectory(srcImagesDir, distImagesDir);
}

// Copy videos directory to dist
const srcVideosDir = path.join(srcDir, 'videos');
const distVideosDir = path.join(distDir, 'videos');
let videoCount = 0;
if (fs.existsSync(srcVideosDir)) {
    if (!fs.existsSync(distVideosDir)) {
        fs.mkdirSync(distVideosDir, { recursive: true });
    }
    const videoFiles = fs.readdirSync(srcVideosDir);
    videoFiles.forEach(file => {
        fs.copyFileSync(
            path.join(srcVideosDir, file),
            path.join(distVideosDir, file)
        );
    });
    videoCount = videoFiles.length;
}

console.log('✓ Build complete!');
console.log(`  - Generated: ${distIndexPath}`);
console.log(`  - Generated: ${distWorkPath}`);
console.log(`  - Generated: ${distBookshelfPath}`);
console.log(`  - Copied: ${distCssPath}`);
if (fontCount > 0) console.log(`  - Copied: ${fontCount} font file(s)`);
if (imageCount > 0) console.log(`  - Copied: ${imageCount} image file(s)`);
if (videoCount > 0) console.log(`  - Copied: ${videoCount} video file(s)`);
