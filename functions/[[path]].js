import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.get('/*', serveStatic({ root: './' }))

// API routes
app.post('/api/login', async (c) => {
  const { username, password } = await c.req.json()
  
  // Here we would normally authenticate with Salesforce
  // For now, return a mock response
  return c.json({
    success: true,
    message: 'Login successful',
    user: {
      username: username,
      role: 'user'
    }
  })
})

app.get('/api/quotes', async (c) => {
  // Here we would normally fetch quotes from Salesforce
  return c.json({
    quotes: [
      { id: 1, name: 'Sample Quote 1', amount: 1000 },
      { id: 2, name: 'Sample Quote 2', amount: 2000 }
    ]
  })
})

export default {
  fetch: app.fetch.bind(app)
}
