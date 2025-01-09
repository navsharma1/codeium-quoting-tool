export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // Set CORS headers
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

        // Test quotes endpoint
        if (url.pathname === '/api/quotes') {
          return new Response(JSON.stringify({
            quotes: [
              { id: 1, name: 'Test Quote 1', amount: 1000 },
              { id: 2, name: 'Test Quote 2', amount: 2000 }
            ]
          }), { headers });
        }

        return new Response(JSON.stringify({ error: 'Not Found' }), {
          headers,
          status: 404
        });
      }

      // Handle root path
      if (url.pathname === '/' || url.pathname === '') {
        const response = await env.ASSETS.fetch(`${url.origin}/index.html`);
        if (!response.ok) {
          throw new Error(`Failed to fetch index.html: ${response.status}`);
        }
        return new Response(response.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            ...headers
          }
        });
      }

      // Serve other static files
      const response = await env.ASSETS.fetch(request);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url.pathname}: ${response.status}`);
      }

      // Add security headers
      const newHeaders = new Headers(response.headers);
      Object.entries(headers).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: 200,
        headers: newHeaders
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(`Error: ${error.message}`, { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
