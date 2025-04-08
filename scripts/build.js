const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

const SOURCE_DIR = path.join(__dirname, '../src');
const OUTPUT_DIR = path.join(__dirname, '../dist');

// Create clean dist directory
fs.emptyDirSync(OUTPUT_DIR);

// Copy static assets including index.html
fs.copySync(path.join(__dirname, '../public'), OUTPUT_DIR);

// Read base HTML file
const template = fs.readFileSync(
  path.join(OUTPUT_DIR, 'index.html'),
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
  
  if (!fs.existsSync(contentDir)) {
    fs.ensureDirSync(contentDir);
    return;
  }
  
  fs.readdirSync(contentDir).forEach(file => {
    if (file.endsWith('.md')) {
      const filePath = path.join(contentDir, file);
      const data = processMarkdown(filePath);
      
      // Replace content in the #content div
      let pageHtml = template.replace(
        '<div id="content"><!-- Content will be inserted here --></div>',
        `<div id="content">${data.content}</div>`
      );
      
      // Update title
      pageHtml = pageHtml.replace(/<title>.*?<\/title>/, `<title>${data.title}</title>`);
      
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
      
      // Replace content in the #content div
      let postHtml = template.replace(
        '<div id="content"><!-- Content will be inserted here --></div>',
        `<div id="content">${data.content}</div>`
      );
      
      // Update title
      postHtml = postHtml.replace(/<title>.*?<\/title>/, `<title>${data.title}</title>`);
      
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