export async function onRequest(context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Handle POST request
  if (context.request.method === 'POST') {
    try {
      const body = await context.request.json();
      
      // Mock successful login response
      const response = {
        success: true,
        user: {
          username: body.username,
          role: 'user'
        }
      };

      return new Response(JSON.stringify(response), {
        headers,
        status: 200
      });
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

  return new Response(JSON.stringify({
    success: false,
    error: 'Method not allowed'
  }), {
    headers,
    status: 405
  });
}
