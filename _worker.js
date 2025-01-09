export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // API Routes
    if (url.pathname.startsWith('/api')) {
      const headers = {
        ...corsHeaders,
        'Content-Type': 'application/json'
      };

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

      // If no matching API route
      return new Response(JSON.stringify({
        error: 'Not Found'
      }), {
        headers,
        status: 404
      });
    }

    // Try to serve static files
    try {
      // Special case for root path
      if (url.pathname === '/') {
        return env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
      }

      // Try to serve the requested file
      const response = await env.ASSETS.fetch(request);
      
      // If the response is not ok, throw an error to trigger the catch block
      if (!response.ok) {
        throw new Error('File not found');
      }
      
      return response;
    } catch (error) {
      // For any error or 404, serve index.html for client-side routing
      return env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
    }
  }
};
