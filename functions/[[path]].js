import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.get('/*', serveStatic({ root: './' }))

// Login page
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Login - Salesforce Quoting Tool</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .login-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
          }
          h1 {
            color: #2d3748;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          input {
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-size: 1rem;
          }
          button {
            background: #4c51bf;
            color: white;
            padding: 0.75rem;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s ease;
          }
          button:hover {
            background: #434190;
          }
        </style>
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

// Login handler
app.post('/login', async (c) => {
  try {
    const formData = await c.req.formData()
    const username = formData.get('username')
    const password = formData.get('password')

    // Here you would normally authenticate with Salesforce
    // For now, let's just return a response
    return c.html(`
      <html>
        <head>
          <title>Login Status</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 2rem;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <h1>Login Attempt</h1>
          <p>Username: ${username}</p>
          <p>Authentication in progress...</p>
        </body>
      </html>
    `)
  } catch (error) {
    return c.text('Error processing login', 500)
  }
})

export const onRequest = handle(app)
