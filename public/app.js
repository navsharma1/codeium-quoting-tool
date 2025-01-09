// DOM Elements
const loginForm = document.getElementById('loginForm');
const loginContainer = document.getElementById('loginContainer');
const dashboard = document.getElementById('dashboard');
const userDisplay = document.getElementById('userDisplay');
const quotesList = document.getElementById('quotesList');
const logoutBtn = document.getElementById('logoutBtn');
const createQuoteBtn = document.getElementById('createQuoteBtn');

// API Endpoints
const endpoints = {
    login: '/api/login',
    quotes: '/api/quotes',
    createQuote: '/api/quotes/create'
};

// State Management
let currentUser = null;

// Event Listeners
if (!loginForm || !logoutBtn || !createQuoteBtn) {
    console.error('Required DOM elements not found:', {
        loginForm: !!loginForm,
        logoutBtn: !!logoutBtn,
        createQuoteBtn: !!createQuoteBtn
    });
} else {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    createQuoteBtn.addEventListener('click', handleCreateQuote);
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    console.log('Login attempt...');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Show loading state
    const submitBtn = loginForm.querySelector('button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading"></div>';

    try {
        console.log('Sending login request...');
        const response = await fetch(endpoints.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('session', JSON.stringify(data.user));
            showDashboard();
            loadQuotes();
        } else {
            alert(data.error || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Logout Handler
function handleLogout() {
    console.log('Logging out...');
    currentUser = null;
    localStorage.removeItem('session');
    loginContainer.classList.remove('hidden');
    dashboard.classList.add('hidden');
    loginForm.reset();
}

// Show Dashboard
function showDashboard() {
    console.log('Showing dashboard...');
    loginContainer.classList.add('hidden');
    dashboard.classList.remove('hidden');
    userDisplay.textContent = currentUser.username;
}

// Load Quotes
async function loadQuotes() {
    try {
        console.log('Loading quotes...');
        const response = await fetch(endpoints.quotes);
        const data = await response.json();
        console.log('Quotes response:', data);
        
        if (!data.quotes) {
            throw new Error('Invalid response format');
        }
        
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
        quotesList.innerHTML = '<p class="error">Error loading quotes. Please try again later.</p>';
    }
}

// Create Quote Handler
function handleCreateQuote() {
    console.log('Create quote clicked');
    alert('Create quote functionality coming soon!');
}

// View Quote Handler
function viewQuote(id) {
    console.log('View quote clicked:', id);
    alert(`Viewing quote ${id}`);
}

// Initialize
function init() {
    console.log('Initializing app...');
    // Check for existing session
    const session = localStorage.getItem('session');
    if (session) {
        try {
            currentUser = JSON.parse(session);
            showDashboard();
            loadQuotes();
        } catch (error) {
            console.error('Error parsing session:', error);
            localStorage.removeItem('session');
        }
    }
}

// Start the app
console.log('Starting app...');
document.addEventListener('DOMContentLoaded', init);
