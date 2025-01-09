import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { csrf } from 'hono/csrf'
import { jsxRenderer } from 'hono/jsx-renderer'
import { SalesforceClient } from './salesforce_client'

const app = new Hono()

// Renderer
app.use('*', jsxRenderer())

// Session middleware
app.use('*', async (c, next) => {
  const sessionId = getCookie(c, 'session_id')
  if (sessionId) {
    const sessionData = await c.env.SESSIONS.get(sessionId)
    if (sessionData) {
      c.set('session', JSON.parse(sessionData))
    }
  }
  await next()
  if (c.get('session')) {
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    })
    await c.env.SESSIONS.put(sessionId, JSON.stringify(c.get('session')))
  }
})

// CSRF protection
app.use('*', csrf())

// Routes
app.get('/', async (c) => {
  const session = c.get('session')
  if (!session?.user_id) {
    return c.redirect('/login')
  }
  
  return session.is_admin ? c.redirect('/dashboard') : c.redirect('/quotes')
})

app.get('/login', async (c) => {
  return c.render('login')
})

app.post('/login', async (c) => {
  const { username, password } = await c.req.parseBody()
  
  try {
    const userInfo = await authenticateUser(username, password, c.env)
    if (userInfo) {
      const session = {
        user_id: userInfo.Id,
        user_email: userInfo.Email,
        is_admin: userInfo.Profile?.Name === 'System Administrator'
      }
      c.set('session', session)
      return c.redirect(session.is_admin ? '/dashboard' : '/quotes')
    }
  } catch (error) {
    return c.render('login', { error: 'Invalid credentials' })
  }
})

app.get('/logout', async (c) => {
  const sessionId = getCookie(c, 'session_id')
  if (sessionId) {
    await c.env.SESSIONS.delete(sessionId)
  }
  return c.redirect('/login')
})

app.get('/dashboard', async (c) => {
  const session = c.get('session')
  if (!session?.user_id || !session.is_admin) {
    return c.redirect('/login')
  }
  
  // Get dashboard data from Salesforce
  const stats = await getDashboardStats(session.user_id, c.env)
  return c.render('dashboard', { stats })
})

app.get('/quotes', async (c) => {
  const session = c.get('session')
  if (!session?.user_id) {
    return c.redirect('/login')
  }
  
  const quotes = await getQuotes(session.user_id, c.env)
  return c.render('quotes', { quotes })
})

// Helper functions for Salesforce integration
async function authenticateUser(username, password, env) {
  const sf = new SalesforceClient({
    username: env.SF_USERNAME,
    password: env.SF_PASSWORD,
    securityToken: env.SF_SECURITY_TOKEN,
    domain: env.SF_DOMAIN
  })
  
  return await sf.authenticate(username, password)
}

async function getDashboardStats(userId, env) {
  // Implementation for getting dashboard stats
  return {}
}

async function getQuotes(userId, env) {
  // Implementation for getting quotes
  return []
}

// Export for Workers
export default app
