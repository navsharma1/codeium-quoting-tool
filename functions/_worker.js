export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Forward request to Flask application
    const response = await env.FLASK_APP.fetch(request.clone());
    return response;
  }
}
