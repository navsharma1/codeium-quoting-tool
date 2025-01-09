export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // Basic CORS headers
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      };

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
      }

      // API Routes
      if (url.pathname.startsWith('/api')) {
        headers['Content-Type'] = 'application/json';
        
        if (url.pathname === '/api/test') {
          return new Response(JSON.stringify({ status: 'ok' }), { headers });
        }

        if (url.pathname === '/api/quotes') {
          return new Response(JSON.stringify({
            quotes: [
              { id: 1, name: 'Test Quote 1', amount: 1000 },
              { id: 2, name: 'Test Quote 2', amount: 2000 }
            ]
          }), { headers });
        }

        return new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers
        });
      }

      // Serve static files
      let response;
      
      // If root path, serve index.html
      if (url.pathname === '/' || url.pathname === '') {
        response = await env.ASSETS.fetch(new Request(url.origin + '/index.html'));
      } else {
        response = await env.ASSETS.fetch(request);
      }

      // If file not found, return 404
      if (!response.ok) {
        console.error('File not found:', url.pathname);
        return new Response('Not Found', { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
            ...headers
          }
        });
      }

      // Add CORS headers to the response
      const newHeaders = new Headers(response.headers);
      Object.entries(headers).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      // Set content type based on file extension
      const ext = url.pathname.split('.').pop().toLowerCase();
      const contentTypes = {
        'html': 'text/html;charset=UTF-8',
        'js': 'application/javascript',
        'css': 'text/css',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon'
      };

      if (contentTypes[ext]) {
        newHeaders.set('Content-Type', contentTypes[ext]);
      }

      return new Response(response.body, {
        status: 200,
        headers: newHeaders
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
