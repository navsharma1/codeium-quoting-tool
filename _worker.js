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
      try {
        // Try to serve the requested file
        const response = await env.ASSETS.fetch(request);
        
        // Add CORS and security headers
        const newHeaders = new Headers(response.headers);
        Object.entries(headers).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });

        // If it's HTML, ensure correct content type
        if (url.pathname.endsWith('.html') || url.pathname === '/') {
          newHeaders.set('Content-Type', 'text/html;charset=UTF-8');
        }

        return new Response(response.body, {
          status: response.status,
          headers: newHeaders
        });
      } catch (error) {
        console.error('Static file error:', error);
        
        // If root path or not found, serve index.html
        if (url.pathname === '/' || url.pathname === '') {
          try {
            const indexResponse = await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
            return new Response(indexResponse.body, {
              status: 200,
              headers: {
                'Content-Type': 'text/html;charset=UTF-8',
                ...headers
              }
            });
          } catch (indexError) {
            console.error('Index.html error:', indexError);
          }
        }

        return new Response('Not Found', { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
            ...headers
          }
        });
      }
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
