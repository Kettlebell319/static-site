const express = require('express');
const path = require('path');

const app = express();
let PORT = process.env.PORT || 3001;

// Serve static files from public directory instead of dist
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Try to start server, increment port if in use
const startServer = () => {
  const server = app.listen(PORT)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
        PORT += 1;
        startServer();
      } else {
        console.error('Server error:', err);
      }
    })
    .on('listening', () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
};

startServer(); 