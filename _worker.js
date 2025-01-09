export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // Basic CORS headers
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      };

      // Handle root path
      if (url.pathname === '/' || url.pathname === '') {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Test Page</title>
            </head>
            <body>
              <h1>Test Page</h1>
              <p>If you can see this, the worker is functioning correctly.</p>
            </body>
          </html>
        `, {
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            ...headers
          }
        });
      }

      // Simple test API endpoint
      if (url.pathname === '/api/test') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        });
      }

      // Return 404 for all other paths
      return new Response('Not Found', {
        status: 404,
        headers
      });
    } catch (error) {
      // Log the error
      console.error('Worker error:', error);
      
      // Return a simple error response
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
