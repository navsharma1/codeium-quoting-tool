import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-workers'
import { csrf } from 'hono/csrf'
import { getCookie, setCookie } from 'hono/cookie'
import { SalesforceClient } from '../salesforce_client'

const app = new Hono()

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
})

// CSRF protection
app.use('*', csrf())

// Routes
app.get('/', async (c) => {
  const session = c.get('session')
  if (!session?.user_id) {
    return c.redirect('/login')
  }
  return c.redirect(session.is_admin ? '/dashboard' : '/quotes')
})

app.get('/login', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Login - Salesforce Quoting Tool</title>
        <link rel="stylesheet" href="/static/css/style.css">
      </head>
      <body>
        <div class="login-container">
          <h1>Login</h1>
          <form method="POST" action="/login">
            <input type="text" name="username" placeholder="Username" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Login</button>
          </form>
        </div>
      </body>
    </html>
  `)
})

app.post('/login', async (c) => {
  const { username, password } = await c.req.parseBody()
  
  try {
    const sf = new SalesforceClient({
      username: c.env.SF_USERNAME,
      password: c.env.SF_PASSWORD,
      securityToken: c.env.SF_SECURITY_TOKEN,
      domain: c.env.SF_DOMAIN
    })
    
    const userInfo = await sf.authenticate(username, password)
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
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Failed</title>
        </head>
        <body>
          <h1>Login Failed</h1>
          <p>Invalid credentials</p>
          <a href="/login">Try Again</a>
        </body>
      </html>
    `)
  }
})

export default {
  fetch: handle(app)
}
