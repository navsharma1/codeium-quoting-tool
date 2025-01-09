from functools import wraps
from flask import session, redirect, url_for, flash, request
from salesforce_client import SalesforceClient

def get_user_role(user_id):
    """Get user role from Salesforce"""
    sf_client = SalesforceClient()
    try:
        user = sf_client.sf.User.get(user_id)
        # You might want to adjust this based on your Salesforce user profile/role structure
        return user.get('UserRole', {}).get('Name', 'Sales Representative')
    except Exception as e:
        print(f"Error getting user role: {e}")
        return None

def requires_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page', 'error')
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated

def requires_admin(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page', 'error')
            return redirect(url_for('login', next=request.url))
        
        admin_profiles = ['System Administrator', 'Sales Manager']
        user_profile = session.get('user_profile')
        
        if not user_profile or user_profile not in admin_profiles:
            flash('You do not have permission to access this page', 'error')
            return redirect(url_for('quotes'))
            
        return f(*args, **kwargs)
    return decorated
