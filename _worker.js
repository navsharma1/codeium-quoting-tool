export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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

      // Login endpoint
      if (url.pathname === '/api/login' && request.method === 'POST') {
        try {
          const body = await request.json();
          return new Response(JSON.stringify({
            success: true,
            user: {
              username: body.username,
              role: 'user'
            }
          }), { headers });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid request'
          }), {
            headers,
            status: 400
          });
        }
      }

      // Quotes endpoint
      if (url.pathname === '/api/quotes' && request.method === 'GET') {
        return new Response(JSON.stringify({
          quotes: [
            { id: 1, name: 'Enterprise Solution', amount: 50000 },
            { id: 2, name: 'Small Business Package', amount: 10000 },
            { id: 3, name: 'Startup Plan', amount: 5000 }
          ]
        }), { headers });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        headers,
        status: 404
      });
    }

    // Serve static files
    try {
      // Always serve index.html for the root path
      if (url.pathname === '/') {
        const response = await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
        return new Response(response.body, {
          ...response,
          headers: {
            ...response.headers,
            'Content-Type': 'text/html;charset=UTF-8'
          }
        });
      }

      // Try to serve the requested file
      const response = await env.ASSETS.fetch(request);
      if (!response.ok) throw new Error('File not found');

      // Set appropriate content type for common file types
      const ext = url.pathname.split('.').pop().toLowerCase();
      const contentTypes = {
        'js': 'application/javascript',
        'css': 'text/css',
        'html': 'text/html',
        'json': 'application/json'
      };

      return new Response(response.body, {
        ...response,
        headers: {
          ...response.headers,
          'Content-Type': contentTypes[ext] || 'text/plain'
        }
      });
    } catch {
      // Serve index.html for client-side routing
      const response = await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
      return new Response(response.body, {
        ...response,
        headers: {
          ...response.headers,
          'Content-Type': 'text/html;charset=UTF-8'
        }
      });
    }
  }
};
