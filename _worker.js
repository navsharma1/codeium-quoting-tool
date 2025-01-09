export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // API Routes
    if (url.pathname.startsWith('/api')) {
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
          }), {
            headers: corsHeaders
          });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid request'
          }), {
            headers: corsHeaders,
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
        }), {
          headers: corsHeaders
        });
      }

      // If no matching API route
      return new Response(JSON.stringify({
        error: 'Not Found'
      }), {
        headers: corsHeaders,
        status: 404
      });
    }

    // Serve static files
    try {
      const response = await env.ASSETS.fetch(request);
      return response;
    } catch (error) {
      // If static file not found, return index.html for client-side routing
      return await env.ASSETS.fetch('index.html');
    }
  }
};
