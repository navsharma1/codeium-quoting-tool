export async function onRequest(context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Handle GET request
  if (context.request.method === 'GET') {
    try {
      // Mock quotes data
      const quotes = [
        { id: 1, name: 'Enterprise Solution', amount: 50000 },
        { id: 2, name: 'Small Business Package', amount: 10000 },
        { id: 3, name: 'Startup Plan', amount: 5000 }
      ];

      return new Response(JSON.stringify({ quotes }), {
        headers,
        status: 200
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch quotes'
      }), {
        headers,
        status: 500
      });
    }
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'Method not allowed'
  }), {
    headers,
    status: 405
  });
}
