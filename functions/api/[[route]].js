import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Add CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 3600,
  credentials: true,
}))

// Login endpoint
app.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    return c.json({
      success: true,
      user: {
        username: body.username,
        role: 'user'
      }
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Invalid request' 
    }, 400)
  }
})

// Get quotes
app.get('/quotes', async (c) => {
  try {
    // Mock data for now
    const quotes = [
      { id: 1, name: 'Enterprise Solution', amount: 50000 },
      { id: 2, name: 'Small Business Package', amount: 10000 },
      { id: 3, name: 'Startup Plan', amount: 5000 }
    ]
    return c.json({ quotes })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to fetch quotes' 
    }, 500)
  }
})

export default {
  fetch: app.fetch.bind(app)
}
