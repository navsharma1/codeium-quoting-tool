import os
import shutil

def build():
    # Create dist directory if it doesn't exist
    if os.path.exists('dist'):
        shutil.rmtree('dist')
    os.makedirs('dist')

    # Copy static files
    if os.path.exists('static'):
        shutil.copytree('static', 'dist/static')

    # Copy templates
    if os.path.exists('templates'):
        shutil.copytree('templates', 'dist/templates')

    # Create a simple index.html if it doesn't exist
    if not os.path.exists('dist/index.html'):
        with open('dist/index.html', 'w') as f:
            f.write('''
<!DOCTYPE html>
<html>
<head>
    <title>Salesforce Quoting Tool</title>
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
        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h1 {
            color: #2d3748;
            margin-bottom: 1rem;
        }
        p {
            color: #4a5568;
            margin-bottom: 2rem;
        }
        .button {
            background: #4c51bf;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            text-decoration: none;
            transition: background 0.3s ease;
        }
        .button:hover {
            background: #434190;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Salesforce Quoting Tool</h1>
        <p>A powerful tool for managing your Salesforce quotes</p>
        <a href="/login" class="button">Login</a>
    </div>
</body>
</html>
            ''')

if __name__ == '__main__':
    build()
