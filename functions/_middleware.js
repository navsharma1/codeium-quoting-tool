import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Create a new Hono app
const app = new Hono()

// Add CORS middleware
app.use('*', cors())

// Add authentication middleware
app.use('/api/*', async (c, next) => {
  // Skip auth for login endpoint
  if (c.req.path === '/api/login') {
    return next()
  }

  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Here you would validate the token with Salesforce
  // For now, we'll just check if it exists
  await next()
})

export const onRequest = app
