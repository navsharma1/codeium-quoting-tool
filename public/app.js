// DOM Elements
const loginForm = document.getElementById('loginForm');
const loginContainer = document.getElementById('loginContainer');
const dashboard = document.getElementById('dashboard');
const userDisplay = document.getElementById('userDisplay');
const quotesList = document.getElementById('quotesList');
const logoutBtn = document.getElementById('logoutBtn');
const createQuoteBtn = document.getElementById('createQuoteBtn');

// API Endpoints
const API_URL = '';  // Will be set based on environment
const endpoints = {
    login: `${API_URL}/api/login`,
    quotes: `${API_URL}/api/quotes`,
    createQuote: `${API_URL}/api/quotes/create`
};

// State Management
let currentUser = null;

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
createQuoteBtn.addEventListener('click', handleCreateQuote);

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(endpoints.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            showDashboard();
            loadQuotes();
        } else {
            alert('Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
}

// Logout Handler
function handleLogout() {
    currentUser = null;
    loginContainer.classList.remove('hidden');
    dashboard.classList.add('hidden');
    loginForm.reset();
}

// Show Dashboard
function showDashboard() {
    loginContainer.classList.add('hidden');
    dashboard.classList.remove('hidden');
    userDisplay.textContent = currentUser.username;
}

// Load Quotes
async function loadQuotes() {
    try {
        const response = await fetch(endpoints.quotes);
        const data = await response.json();
        
        quotesList.innerHTML = data.quotes.map(quote => `
            <div class="quote-card">
                <div>
                    <h4>${quote.name}</h4>
                    <p>Amount: $${quote.amount.toLocaleString()}</p>
                </div>
                <button onclick="viewQuote(${quote.id})">View</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading quotes:', error);
        quotesList.innerHTML = '<p>Error loading quotes. Please try again later.</p>';
    }
}

// Create Quote Handler
async function handleCreateQuote() {
    // This would typically open a modal or navigate to a create quote form
    alert('Create quote functionality coming soon!');
}

// View Quote Handler
function viewQuote(id) {
    // This would typically navigate to a quote detail view
    alert(`Viewing quote ${id}`);
}

// Initialize
function init() {
    // Check for existing session
    const session = localStorage.getItem('session');
    if (session) {
        currentUser = JSON.parse(session);
        showDashboard();
        loadQuotes();
    }
}

init();
