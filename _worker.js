export default {
  async fetch(request, env) {
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

    // Serve static files
    try {
      let response = await env.ASSETS.fetch(request);
      
      // If accessing the root, serve index.html
      if (url.pathname === '/') {
        response = await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
      }

      // Add security headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Content-Type-Options', 'nosniff');
      newHeaders.set('X-Frame-Options', 'DENY');
      newHeaders.set('X-XSS-Protection', '1; mode=block');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (error) {
      return new Response('Not Found', { status: 404 });
    }
  }
};
