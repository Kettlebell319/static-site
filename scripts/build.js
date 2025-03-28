const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

const SOURCE_DIR = path.join(__dirname, '../src');
const OUTPUT_DIR = path.join(__dirname, '../dist');

// Create clean dist directory
fs.emptyDirSync(OUTPUT_DIR);

// Copy static assets
fs.copySync(path.join(SOURCE_DIR, 'public'), OUTPUT_DIR);

// Read base template
const template = fs.readFileSync(
  path.join(SOURCE_DIR, 'templates/base.html'),
  'utf-8'
);

// Process markdown files
function processMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { attributes, body } = frontMatter(content);
  const html = marked(body);
  
  return {
    content: html,
    title: attributes.title || 'My Website',
    ...attributes
  };
}

// Build pages from markdown
function buildPages() {
  const contentDir = path.join(SOURCE_DIR, 'content');
  
  fs.readdirSync(contentDir).forEach(file => {
    if (file.endsWith('.md')) {
      const filePath = path.join(contentDir, file);
      const data = processMarkdown(filePath);
      
      // Replace template variables
      let pageHtml = template
        .replace('{{title}}', data.title)
        .replace('{{content}}', data.content);
      
      // Generate output path
      const outputPath = path.join(
        OUTPUT_DIR,
        file.replace('.md', '.html')
      );
      
      // Write the file
      fs.outputFileSync(outputPath, pageHtml);
    }
  });
}

// Build blog posts
function buildBlog() {
  const blogDir = path.join(SOURCE_DIR, 'content/blog');
  const postsDir = path.join(OUTPUT_DIR, 'blog');
  
  if (!fs.existsSync(blogDir)) return;
  
  fs.ensureDirSync(postsDir);
  
  const posts = [];
  
  fs.readdirSync(blogDir).forEach(file => {
    if (file.endsWith('.md')) {
      const filePath = path.join(blogDir, file);
      const data = processMarkdown(filePath);
      
      posts.push({
        ...data,
        slug: file.replace('.md', '')
      });
      
      // Generate individual post page
      let postHtml = template
        .replace('{{title}}', data.title)
        .replace('{{content}}', data.content);
      
      fs.outputFileSync(
        path.join(postsDir, file.replace('.md', '.html')),
        postHtml
      );
    }
  });
}

// Run build
buildPages();
buildBlog();

console.log('Build complete!'); 