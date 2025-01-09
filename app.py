from flask import Flask, request, jsonify, send_file, render_template, flash, redirect, url_for, session
from salesforce_client import SalesforceClient
from pdf_generator import QuotePDFGenerator
from dotenv import load_dotenv
from datetime import datetime, timedelta
from functools import wraps
import os

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key')
sf_client = SalesforceClient()
pdf_generator = QuotePDFGenerator()

# Add template context processor
@app.context_processor
def inject_now():
    return {'now': datetime.now()}

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    if session.get('is_admin'):
        return redirect(url_for('dashboard'))
    else:
        return redirect(url_for('quotes'))

@app.route('/dashboard')
@login_required
def dashboard():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    user = sf_client.get_user_by_id(user_id)
    is_admin = user.get('Profile', {}).get('Name') == 'System Administrator'
    
    if not is_admin:
        return redirect(url_for('quotes'))
    
    try:
        # Get metrics for the dashboard
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_quotes = sf_client.get_recent_quotes(thirty_days_ago)
        
        total_quotes = len(recent_quotes)
        total_value = sum(float(quote.get('Total_Amount__c', 0)) for quote in recent_quotes)
        approved_quotes = sum(1 for quote in recent_quotes if quote.get('Status__c') == 'Approved')
        pending_quotes = sum(1 for quote in recent_quotes if quote.get('Status__c') == 'Pending')
        
        sales_rep_quotes = {}
        for quote in recent_quotes:
            rep_name = quote.get('Owner', {}).get('Name', 'Unknown')
            if rep_name not in sales_rep_quotes:
                sales_rep_quotes[rep_name] = {
                    'count': 0,
                    'value': 0,
                    'approved': 0
                }
            sales_rep_quotes[rep_name]['count'] += 1
            sales_rep_quotes[rep_name]['value'] += float(quote.get('Total_Amount__c', 0))
            if quote.get('Status__c') == 'Approved':
                sales_rep_quotes[rep_name]['approved'] += 1
        
        top_reps = sorted(
            [{'name': name, **stats} for name, stats in sales_rep_quotes.items()],
            key=lambda x: x['value'],
            reverse=True
        )[:5]
        
        return render_template('dashboard.html',
                             total_quotes=total_quotes,
                             total_value=total_value,
                             approved_quotes=approved_quotes,
                             pending_quotes=pending_quotes,
                             top_reps=top_reps)
                             
    except Exception as e:
        app.logger.error(f"Error fetching dashboard metrics: {str(e)}")
        flash("Error loading dashboard metrics. Please try again later.", "error")
        return render_template('dashboard.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Clear any existing session first
    session.clear()
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('Please provide both username and password', 'error')
            return render_template('login.html')
        
        try:
            # First authenticate the user
            user_info = sf_client.authenticate_user(username, password)
            if user_info:
                # Store all necessary user info in session
                session['user_id'] = user_info.get('Id')
                session['user_email'] = user_info.get('Email')
                session['is_admin'] = user_info.get('Profile', {}).get('Name') == 'System Administrator'
                
                # Debug logging
                print(f"Login successful for {username}")
                print(f"User ID: {session.get('user_id')}")
                print(f"User Email: {session.get('user_email')}")
                print(f"Is Admin: {session.get('is_admin')}")
                
                if session.get('is_admin'):
                    return redirect(url_for('dashboard'))
                else:
                    return redirect(url_for('quotes'))
            else:
                flash('Invalid credentials', 'error')
        except Exception as e:
            print(f"Login error: {str(e)}")  # Debug logging
            flash(f'Login failed: {str(e)}', 'error')
        
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully', 'success')
    return redirect(url_for('login'))

@app.route('/quotes')
@login_required
def quotes():
    if not session.get('user_id'):
        return redirect(url_for('login'))

    try:
        # Get user info from session
        user_id = session.get('user_id')
        is_admin = session.get('is_admin', False)
        
        # Mock quotes data for testing
        quotes_data = [
            {
                'Id': 'quote1',
                'Name': 'Test Quote 1',
                'Customer_Name__c': 'Customer 1',
                'Total_Amount__c': 1000.00,
                'Status__c': 'Draft',
                'CreatedDate': '2025-01-01'
            },
            {
                'Id': 'quote2',
                'Name': 'Test Quote 2',
                'Customer_Name__c': 'Customer 2',
                'Total_Amount__c': 2000.00,
                'Status__c': 'Pending',
                'CreatedDate': '2025-01-02'
            }
        ]
        
        return render_template('quotes.html', 
                             quotes=quotes_data,
                             is_admin=is_admin)
    except Exception as e:
        print(f"Error in quotes route: {str(e)}")
        flash('Error loading quotes. Please try again.', 'error')
        return render_template('quotes.html', quotes=[], is_admin=is_admin)

@app.route('/create_quote', methods=['GET', 'POST'])
@login_required
def create_quote():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    try:
        is_admin = session.get('is_admin', False)
        user_role = 'System Administrator' if is_admin else 'Sales Representative'
            
        if request.method == 'GET':
            # Mock data for testing
            opportunities = [
                {'Id': 'opp1', 'Name': 'Opportunity 1'},
                {'Id': 'opp2', 'Name': 'Opportunity 2'}
            ]
            
            # Get products based on user role
            products = sf_client.get_products(user_role)
            
            today = datetime.now().strftime('%Y-%m-%d')
            
            return render_template('create_quote.html',
                                 opportunities=opportunities,
                                 products=products,
                                 today=today,
                                 is_admin=is_admin)
        
        if request.method == 'POST':
            try:
                quote_data = {
                    'quote_number': request.form.get('quote_number'),
                    'payment_terms': request.form.get('payment_terms'),
                    'email': request.form.get('email'),
                    'phone': request.form.get('phone'),
                    'partner': request.form.get('partner'),
                    'billing_address': {
                        'street': request.form.get('street_address'),
                        'city': request.form.get('city'),
                        'state': request.form.get('state'),
                        'postal_code': request.form.get('postal_code')
                    },
                    'products': [],
                    'total_monthly': 0,
                    'total_annual': 0,
                    'blended_discount': 0
                }
                
                customer_name = request.form['customer_name']
                customer_email = request.form['customer_email']
                expiration_date = request.form['expiration_date']
                opportunity_id = request.form['opportunity']
                products = request.form.getlist('products[]')
                quantities = request.form.getlist('quantities[]')
                prices = request.form.getlist('prices[]')
                discounts = request.form.getlist('discounts[]')
                action = request.form.get('action', 'draft')
                
                total_monthly = 0
                total_before_discount = 0
                weighted_discount = 0
                
                for i in range(len(products)):
                    product = sf_client.get_product_by_id(products[i])
                    quantity = int(quantities[i])
                    price = float(prices[i])
                    discount = float(discounts[i])
                    
                    monthly_price = price
                    row_total = monthly_price * quantity
                    
                    total_before_discount += row_total
                    weighted_discount += (discount * row_total)
                    
                    final_price = monthly_price * (1 - discount/100) * quantity
                    total_monthly += final_price
                    
                    quote_data['products'].append({
                        'id': products[i],
                        'name': product['Name'],
                        'quantity': quantity,
                        'unit_price': monthly_price,
                        'discount': discount,
                        'final_price': final_price
                    })
                
                quote_data['total_monthly'] = total_monthly
                quote_data['total_annual'] = total_monthly * 12
                quote_data['blended_discount'] = (weighted_discount / total_before_discount) if total_before_discount > 0 else 0
                
                quote_data['Customer_Name__c'] = customer_name
                quote_data['Customer_Email__c'] = customer_email
                quote_data['Expiration_Date__c'] = expiration_date
                quote_data['Opportunity__c'] = opportunity_id
                quote_data['Status__c'] = 'Draft' if action == 'draft' else 'Pending Approval'
                quote_data['OwnerId'] = session['user_id']
                
                quote = sf_client.create_quote(quote_data)
                
                flash('Quote created successfully!', 'success')
                return redirect(url_for('quotes'))
                
            except Exception as e:
                flash(f'Error creating quote: {str(e)}', 'error')
                return redirect(url_for('create_quote'))
        
    except Exception as e:
        print(f"Error in create_quote route: {str(e)}")
        flash('Error creating quote. Please try again.', 'error')
        return redirect(url_for('quotes'))

@app.route('/quotes', methods=['POST'])
@login_required
def create_quote_api():
    data = request.json
    try:
        result = sf_client.create_quote(
            opportunity_id=data['opportunity_id'],
            quote_data=data['quote_data']
        )
        return jsonify(result), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/quotes/<quote_id>', methods=['GET'])
@login_required
def get_quote(quote_id):
    try:
        quote = sf_client.get_quote(quote_id)
        return jsonify(quote)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/quotes/<quote_id>', methods=['PUT'])
@login_required
def update_quote(quote_id):
    data = request.json
    try:
        result = sf_client.update_quote(quote_id, data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/quotes', methods=['GET'])
@login_required
def list_quotes():
    opportunity_id = request.args.get('opportunity_id')
    try:
        quotes = sf_client.list_quotes(opportunity_id)
        return jsonify(quotes)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/quotes/<quote_id>/line-items', methods=['POST'])
@login_required
def add_line_item(quote_id):
    data = request.json
    try:
        result = sf_client.add_quote_line_item(
            quote_id=quote_id,
            product_id=data['product_id'],
            quantity=data['quantity'],
            unit_price=data['unit_price']
        )
        return jsonify(result), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/quotes/<quote_id>/line-items/<item_id>', methods=['PUT'])
@login_required
def update_line_item(quote_id, item_id):
    data = request.json
    try:
        result = sf_client.update_quote_line_item(item_id, data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/quotes/<quote_id>/line-items/<item_id>', methods=['DELETE'])
@login_required
def delete_line_item(quote_id, item_id):
    try:
        sf_client.delete_quote_line_item(item_id)
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/quotes/<quote_id>/submit', methods=['POST'])
@login_required
def submit_for_approval(quote_id):
    try:
        result = sf_client.submit_for_approval(quote_id)
        flash('Quote submitted for approval successfully', 'success')
        return jsonify(result)
    except Exception as e:
        flash(f'Error submitting quote: {str(e)}', 'error')
        return jsonify({'error': str(e)}), 400

@app.route('/quotes/<quote_id>/approve', methods=['POST'])
@login_required
def approve_quote(quote_id):
    try:
        result = sf_client.approve_quote(quote_id)
        flash('Quote approved successfully', 'success')
        return jsonify(result)
    except Exception as e:
        flash(f'Error approving quote: {str(e)}', 'error')
        return jsonify({'error': str(e)}), 400

@app.route('/quotes/<quote_id>/reject', methods=['POST'])
@login_required
def reject_quote(quote_id):
    data = request.json
    try:
        result = sf_client.reject_quote(quote_id, data.get('rejection_reason', ''))
        flash('Quote rejected successfully', 'success')
        return jsonify(result)
    except Exception as e:
        flash(f'Error rejecting quote: {str(e)}', 'error')
        return jsonify({'error': str(e)}), 400

@app.route('/quotes/<quote_id>/calculate', methods=['GET'])
@login_required
def calculate_quote(quote_id):
    try:
        totals = sf_client.calculate_quote_totals(quote_id)
        return jsonify(totals)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/quotes/<quote_id>/pdf', methods=['GET'])
@login_required
def generate_quote_pdf(quote_id):
    try:
        quote = sf_client.get_quote(quote_id)
        totals = sf_client.calculate_quote_totals(quote_id)
        quote.update(totals)
        
        pdf_path = pdf_generator.generate_pdf(quote)
        return send_file(pdf_path, as_attachment=True, download_name=f"quote_{quote_id}.pdf")
    except Exception as e:
        flash(f'Error generating PDF: {str(e)}', 'error')
        return jsonify({'error': str(e)}), 400

@app.route('/create_test_user', methods=['GET', 'POST'])
@login_required
def create_test_user():
    if request.method == 'POST':
        try:
            email = "salesrep@codeium.com"
            username = "salesrep@codeium.com.kilnsb"
            firstname = "Sales"
            lastname = "Representative"
            
            result = sf_client.create_sales_user(
                email=email,
                username=username,
                firstname=firstname,
                lastname=lastname
            )
            
            if result:
                flash('Test sales user created successfully! Initial password will be sent to their email.', 'success')
            else:
                flash('Failed to create test user', 'error')
                
        except Exception as e:
            flash(f'Error creating test user: {str(e)}', 'error')
            
    return render_template('create_test_user.html')

def calculate_monthly_trends(quotes):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    
    months = {}
    current = start_date
    while current <= end_date:
        months[current.strftime('%Y-%m')] = 0
        current += timedelta(days=32)
        current = current.replace(day=1)

    for quote in quotes:
        created_date = datetime.strptime(quote.get('CreatedDate', ''), '%Y-%m-%dT%H:%M:%S.%fZ')
        month_key = created_date.strftime('%Y-%m')
        if month_key in months:
            months[month_key] += quote.get('GrandTotal', 0)

    return {
        'labels': list(months.keys()),
        'data': list(months.values())
    }

if __name__ == '__main__':
    load_dotenv()
    print(f"Connecting to Salesforce sandbox with username: {os.getenv('SF_USERNAME')}")
    print(f"Domain: {os.getenv('SF_DOMAIN')}")
    app.run(debug=True, port=5012)
