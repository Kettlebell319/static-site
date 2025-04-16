const express = require('express');
const path = require('path');

const app = express();
const PORT = 8000;  // Changed to match Python server
const DIST_DIR = path.join(__dirname, '../dist');

// Verify dist directory exists
if (!require('fs').existsSync(DIST_DIR)) {
    console.error('Error: dist directory does not exist. Did you run npm run build first?');
    process.exit(1);
}

// Add error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
});

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve static files from dist directory with caching disabled during development
app.use(express.static(DIST_DIR, {
    etag: false,
    lastModified: false,
    maxAge: 0,
    cacheControl: false
}));

// Handle all routes
app.get('*', (req, res) => {
    // Remove trailing slash except for root
    const urlPath = req.path === '/' ? req.path : req.path.replace(/\/$/, '');
    
    console.log('Trying to serve:', urlPath);
    
    // Try to serve the HTML file directly
    const htmlPath = path.join(DIST_DIR, `${urlPath}.html`);
    console.log('Looking for HTML file at:', htmlPath);
    
    if (require('fs').existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        // If file doesn't exist, try serving index.html from the path
        const indexPath = path.join(DIST_DIR, urlPath, 'index.html');
        console.log('Looking for index.html at:', indexPath);
        
        if (require('fs').existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            // If that also fails, send 404
            console.log('Both attempts failed, sending 404');
            res.status(404).send('Not found');
        }
    }
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Serving files from:', DIST_DIR);
    
    // List what's in the dist directory
    console.log('\nContents of dist directory:');
    require('fs').readdirSync(DIST_DIR).forEach(file => {
        console.log(`- ${file}`);
    });
}); 