const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const TEMPLATES_DIR = path.join(SRC_DIR, 'templates');

// Ensure dist directory exists and clean it
fs.emptyDirSync(DIST_DIR);

// Copy static files from src/public to dist
fs.copySync(path.join(SRC_DIR, 'public'), DIST_DIR, {
    filter: (src) => {
        // Skip node_modules and hidden files
        return !src.includes('node_modules') && !path.basename(src).startsWith('.');
    }
});

console.log('Static files copied successfully');

// Read templates
const templates = {
    blog: fs.readFileSync(path.join(TEMPLATES_DIR, 'blog.html'), 'utf-8'),
    'blog-index': fs.readFileSync(path.join(TEMPLATES_DIR, 'blog-index.html'), 'utf-8'),
    index: fs.readFileSync(path.join(TEMPLATES_DIR, 'index.html'), 'utf-8')
};

// Process markdown files
function processMarkdown(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { attributes, body } = frontMatter(content);
    const html = marked(body);
    
    return {
        content: html,
        ...attributes
    };
}

// Simple template engine
function renderTemplate(template, data) {
    let result = template;
    
    // Replace variables
    for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        result = result.replace(regex, value);
    }
    
    // Handle safe filter
    result = result.replace(/{{(.*?)\|\s*safe\s*}}/g, (_, capture) => {
        const key = capture.trim();
        return data[key] || '';
    });
    
    // Handle basic for loops (only for blog index)
    if (data.posts) {
        const postsHtml = data.posts.map(post => `
            <article class="blog-preview">
                <h2><a href="${post.url}">${post.title}</a></h2>
                <time datetime="${post.date}">${post.date}</time>
                ${post.excerpt ? `<p>${post.excerpt}</p>` : ''}
            </article>
        `).join('\n');
        
        result = result.replace(/{%\s*for.*?%}(.*?){%\s*endfor\s*%}/s, postsHtml);
    }
    
    return result;
}

// Build blog posts
function buildBlog() {
    const blogDir = path.join(SRC_DIR, 'content/blog');
    const postsDir = path.join(DIST_DIR, 'blog');
    
    if (!fs.existsSync(blogDir)) {
        fs.ensureDirSync(blogDir);
        return;
    }
    
    fs.ensureDirSync(postsDir);
    
    const posts = [];
    const currentYear = new Date().getFullYear();
    
    // Process each blog post
    fs.readdirSync(blogDir).forEach(file => {
        if (file.endsWith('.md')) {
            const filePath = path.join(blogDir, file);
            const data = processMarkdown(filePath);
            const slug = file.replace('.md', '');
            
            posts.push({
                ...data,
                url: `/blog/${slug}`,
                excerpt: data.excerpt || ''
            });
            
            // Render blog post
            const postHtml = renderTemplate(templates.blog, {
                ...data,
                year: currentYear
            });
            
            fs.outputFileSync(
                path.join(postsDir, `${slug}.html`),
                postHtml
            );
        }
    });
    
    // Sort posts by date
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Generate blog index
    const indexHtml = renderTemplate(templates['blog-index'], {
        posts,
        year: currentYear
    });
    
    fs.outputFileSync(
        path.join(DIST_DIR, 'blog/index.html'),
        indexHtml
    );
}

// Build index page
function buildIndex() {
    const currentYear = new Date().getFullYear();
    const indexHtml = renderTemplate(templates.index, { year: currentYear });
    fs.outputFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);
}

// Run build
buildIndex();
buildBlog();

console.log('Build complete!'); 