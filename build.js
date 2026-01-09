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

// Read templates
const indexTemplatePath = path.join(srcDir, 'index.html');
const workTemplatePath = path.join(srcDir, 'work.html');
let indexHtml = fs.readFileSync(indexTemplatePath, 'utf8');
let workHtml = fs.readFileSync(workTemplatePath, 'utf8');

// Process content files for index page
const aboutMarkdown = readMarkdown('about.md');
const writingMarkdown = readMarkdown('writing.md');
const experienceMarkdown = readMarkdown('experience.md');

const aboutHtml = convertMarkdown(aboutMarkdown);
const writingHtml = convertMarkdown(writingMarkdown);
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

// Copy images directory to dist
const srcImagesDir = path.join(srcDir, 'images');
const distImagesDir = path.join(distDir, 'images');
let imageCount = 0;
if (fs.existsSync(srcImagesDir)) {
    if (!fs.existsSync(distImagesDir)) {
        fs.mkdirSync(distImagesDir, { recursive: true });
    }
    const imageFiles = fs.readdirSync(srcImagesDir);
    imageFiles.forEach(file => {
        fs.copyFileSync(
            path.join(srcImagesDir, file),
            path.join(distImagesDir, file)
        );
    });
    imageCount = imageFiles.length;
}

console.log('✓ Build complete!');
console.log(`  - Generated: ${distIndexPath}`);
console.log(`  - Generated: ${distWorkPath}`);
console.log(`  - Copied: ${distCssPath}`);
if (fontCount > 0) console.log(`  - Copied: ${fontCount} font file(s)`);
if (imageCount > 0) console.log(`  - Copied: ${imageCount} image file(s)`);
