// PrAIme Render server — serves suite/ on Render's PORT (or 8080 locally).
// Use this if deploying as a Render Web Service instead of a Static Site.
const http = require('http');
const fs = require('fs');
const path = require('path');
const SUITE = path.join(__dirname, 'suite');
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.wav':'audio/wav','.mp3':'audio/mpeg','.webm':'video/webm','.png':'image/png','.jpg':'image/jpeg','.txt':'text/plain'};
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    const full = path.join(SUITE, urlPath);
    if (!full.startsWith(SUITE)) { res.writeHead(403); res.end('blocked'); return; }
    fs.readFile(full, (err, data) => {
      if (err) { res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not found: ' + urlPath); return; }
      res.writeHead(200, {'Content-Type': MIME[path.extname(full)] || 'application/octet-stream'});
      res.end(data);
    });
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
server.listen(PORT, '0.0.0.0', () => console.log('PrAIme on Render, port ' + PORT));
