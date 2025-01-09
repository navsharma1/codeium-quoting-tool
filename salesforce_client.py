from simple_salesforce import Salesforce
from typing import Dict, List
import os
from dotenv import load_dotenv
from decimal import Decimal
from datetime import datetime

class SalesforceClient:
    def __init__(self):
        """Initialize Salesforce client with credentials from environment variables"""
        load_dotenv()
        self.security_token = os.getenv('SF_SECURITY_TOKEN')
        self.domain = os.getenv('SF_DOMAIN', 'login')
        self.connect()

    def connect(self, username=None, password=None):
        """Connect to Salesforce with given credentials or from env vars"""
        try:
            # Extract the domain name from the full URL if needed
            domain = self.domain.replace('.salesforce.com', '') if self.domain else 'login'
            
            print(f"Connecting to Salesforce with domain: {domain}")  # Debug log
            self.sf = Salesforce(
                username=username or os.getenv('SF_USERNAME'),
                password=password or os.getenv('SF_PASSWORD'),
                security_token=self.security_token,
                domain=domain
            )
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False

    def check_user_exists(self, username):
        """Check if a user exists in Salesforce"""
        try:
            # Use the admin connection to check user
            query = """
                SELECT Id, Name, Profile.Name, UserRole.Name, IsActive, 
                       Username, ProfileId, UserRoleId
                FROM User 
                WHERE Username = '{}'
            """.format(username)
            
            print(f"Checking user existence: {username}")
            result = self.sf.query(query)
            print(f"User check result: {result}")
            
            if result['totalSize'] > 0:
                user = result['records'][0]
                return {
                    'exists': True,
                    'is_active': user['IsActive'],
                    'profile': user.get('Profile', {}).get('Name'),
                    'role': user.get('UserRole', {}).get('Name')
                }
            return {'exists': False}
        except Exception as e:
            print(f"Error checking user: {str(e)}")
            return {'exists': False, 'error': str(e)}

    def authenticate_user(self, username, password):
        """Authenticate a user with Salesforce"""
        print(f"Authenticating user: {username}")  # Debug log
        
        # For testing purposes, use mock credentials
        if username == 'admin@test.com':
            user_info = {
                'Id': 'admin123',
                'Name': 'Admin User',
                'Profile': {'Name': 'System Administrator'},
                'IsActive': True
            }
            print(f"Admin user authenticated: {user_info}")  # Debug log
            return user_info
            
        elif username == 'salesrep@test.com':
            user_info = {
                'Id': 'salesrep123',
                'Name': 'Sales Rep',
                'Profile': {'Name': 'Sales Representative'},
                'IsActive': True
            }
            print(f"Sales rep authenticated: {user_info}")  # Debug log
            return user_info
            
        print(f"Authentication failed for user: {username}")  # Debug log
        return None

    def create_quote(self, opportunity_id: str, quote_data: Dict) -> Dict:
        """
        Create a new quote for the given opportunity
        """
        try:
            quote_data['OpportunityId'] = opportunity_id
            return self.sf.Quote.create(quote_data)
        except Exception as e:
            print(f"Error creating quote: {e}")
            raise

    def get_quote(self, quote_id: str) -> Dict:
        """
        Get a quote by ID
        """
        try:
            quote = self.sf.Quote.get(quote_id)
            quote['LineItems'] = self.get_quote_line_items(quote_id)
            return quote
        except Exception as e:
            print(f"Error getting quote: {e}")
            raise

    def update_quote(self, quote_id: str, quote_data: Dict) -> Dict:
        """
        Update an existing quote
        """
        try:
            return self.sf.Quote.update(quote_id, quote_data)
        except Exception as e:
            print(f"Error updating quote: {e}")
            raise

    def list_quotes(self, opportunity_id: str = None) -> List[Dict]:
        """
        List all quotes, optionally filtered by opportunity
        """
        try:
            query = """
                SELECT Id, Name, OpportunityId, GrandTotal, Status, 
                       ExpirationDate, Description, Discount
                FROM Quote
            """
            if opportunity_id:
                query += f" WHERE OpportunityId = '{opportunity_id}'"
            return self.sf.query(query)['records']
        except Exception as e:
            print(f"Error listing quotes: {e}")
            raise

    def add_quote_line_item(self, quote_id: str, product_id: str, quantity: int, unit_price: float) -> Dict:
        """
        Add a line item to a quote
        """
        try:
            line_item_data = {
                'QuoteId': quote_id,
                'Product2Id': product_id,
                'Quantity': quantity,
                'UnitPrice': unit_price,
            }
            return self.sf.QuoteLineItem.create(line_item_data)
        except Exception as e:
            print(f"Error adding line item: {e}")
            raise

    def get_quote_line_items(self, quote_id: str) -> List[Dict]:
        """
        Get all line items for a quote
        """
        try:
            query = """
                SELECT Id, Product2Id, Quantity, UnitPrice, TotalPrice,
                       Description, Discount
                FROM QuoteLineItem
                WHERE QuoteId = '{}'
            """.format(quote_id)
            return self.sf.query(query)['records']
        except Exception as e:
            print(f"Error getting line items: {e}")
            raise

    def update_quote_line_item(self, item_id: str, data: Dict) -> Dict:
        """
        Update a quote line item
        """
        try:
            return self.sf.QuoteLineItem.update(item_id, data)
        except Exception as e:
            print(f"Error updating line item: {e}")
            raise

    def delete_quote_line_item(self, item_id: str):
        """
        Delete a quote line item
        """
        try:
            return self.sf.QuoteLineItem.delete(item_id)
        except Exception as e:
            print(f"Error deleting line item: {e}")
            raise

    def submit_for_approval(self, quote_id: str) -> Dict:
        """
        Submit a quote for approval
        """
        try:
            return self.sf.Quote.update(quote_id, {'Status': 'In Review'})
        except Exception as e:
            print(f"Error submitting quote for approval: {e}")
            raise

    def approve_quote(self, quote_id: str) -> Dict:
        """
        Approve a quote
        """
        try:
            return self.sf.Quote.update(quote_id, {'Status': 'Approved'})
        except Exception as e:
            print(f"Error approving quote: {e}")
            raise

    def reject_quote(self, quote_id: str, reason: str = '') -> Dict:
        """
        Reject a quote
        """
        try:
            return self.sf.Quote.update(quote_id, {
                'Status': 'Rejected',
                'RejectionReason__c': reason
            })
        except Exception as e:
            print(f"Error rejecting quote: {e}")
            raise

    def calculate_quote_totals(self, quote_id: str) -> Dict:
        """
        Calculate quote totals including subtotal, discounts, and taxes
        """
        try:
            line_items = self.get_quote_line_items(quote_id)
            subtotal = sum(Decimal(str(item['TotalPrice'])) for item in line_items)
            
            quote = self.get_quote(quote_id)
            discount_percent = Decimal(str(quote.get('Discount', 0)))
            discount_amount = subtotal * (discount_percent / 100)
            
            # Assuming tax rate of 10% (customize as needed)
            tax_rate = Decimal('0.10')
            tax_amount = (subtotal - discount_amount) * tax_rate
            
            grand_total = subtotal - discount_amount + tax_amount
            
            return {
                'subtotal': float(subtotal),
                'discount_amount': float(discount_amount),
                'tax_amount': float(tax_amount),
                'grand_total': float(grand_total)
            }
        except Exception as e:
            print(f"Error calculating totals: {e}")
            raise

    def create_sales_user(self, email, username, firstname, lastname):
        """Create a new sales user in Salesforce"""
        try:
            # First, get the Sales User Profile ID
            profile_query = "SELECT Id FROM Profile WHERE Name = 'Standard User'"
            profile_result = self.sf.query(profile_query)
            
            if profile_result['totalSize'] == 0:
                raise Exception("Sales User profile not found")
                
            profile_id = profile_result['records'][0]['Id']
            
            # Get a sales role if available
            role_query = "SELECT Id FROM UserRole WHERE Name LIKE '%Sales%' LIMIT 1"
            role_result = self.sf.query(role_query)
            role_id = role_result['records'][0]['Id'] if role_result['totalSize'] > 0 else None
            
            # Create the user
            user_data = {
                'Email': email,
                'Username': username,
                'LastName': lastname,
                'FirstName': firstname,
                'Alias': (firstname[:1] + lastname[:4]).lower(),
                'TimeZoneSidKey': 'America/Los_Angeles',
                'LocaleSidKey': 'en_US',
                'EmailEncodingKey': 'UTF-8',
                'LanguageLocaleKey': 'en_US',
                'ProfileId': profile_id,
                'UserRoleId': role_id,
                'IsActive': True
            }
            
            print(f"Creating user with data: {user_data}")
            result = self.sf.User.create(user_data)
            print(f"User creation result: {result}")
            
            return result
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            raise

    def get_recent_quotes(self, since_date):
        """Get quotes created since the given date"""
        try:
            query = f"""
                SELECT Id, Name, Total_Amount__c, Status__c, 
                       Owner.Name, CreatedDate
                FROM Quote__c 
                WHERE CreatedDate >= {since_date.isoformat()}Z
                ORDER BY CreatedDate DESC
            """
            
            result = self.sf.query(query)
            return result.get('records', [])
            
        except Exception as e:
            print(f"Error fetching recent quotes: {str(e)}")
            return []

    def get_quotes(self, user_id, since_date=None, status=None):
        """Get quotes for a user with optional filters"""
        try:
            # Build the WHERE clause
            where_clauses = []
            
            # Add owner filter for non-admin users
            user = self.get_user_by_id(user_id)
            if user and user.get('Profile', {}).get('Name') != 'System Administrator':
                where_clauses.append(f"OwnerId = '{user_id}'")
            
            # Add date filter
            if since_date:
                where_clauses.append(f"CreatedDate >= {since_date.isoformat()}Z")
                
            # Add status filter
            if status:
                where_clauses.append(f"Status__c = '{status}'")
                
            # Combine WHERE clauses
            where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
            
            # Build and execute query
            query = f"""
                SELECT Id, Name, Customer_Name__c, Total_Amount__c, Status__c,
                       CreatedDate, Expiration_Date__c, Owner.Name
                FROM Quote__c
                WHERE {where_sql}
                ORDER BY CreatedDate DESC
            """
            
            result = self.sf.query(query)
            return result.get('records', [])
            
        except Exception as e:
            print(f"Error fetching quotes: {str(e)}")
            return []
            
    def get_user_by_id(self, user_id):
        """Get user info by ID"""
        print(f"Getting user by ID: {user_id}")  # Debug log
        
        # For testing purposes, use mock data
        if user_id == 'admin123':
            user_info = {
                'Id': 'admin123',
                'Name': 'Admin User',
                'Profile': {'Name': 'System Administrator'},
                'IsActive': True
            }
            print(f"Found admin user: {user_info}")  # Debug log
            return user_info
            
        elif user_id == 'salesrep123':
            user_info = {
                'Id': 'salesrep123',
                'Name': 'Sales Rep',
                'Profile': {'Name': 'Sales Representative'},
                'IsActive': True
            }
            print(f"Found sales rep: {user_info}")  # Debug log
            return user_info
            
        print(f"No user found for ID: {user_id}")  # Debug log
        return None

    def login(self, username, password):
        """Authenticate user and return user ID if successful"""
        try:
            # For testing purposes, accept any login
            if username == "salesrep@test.com":
                return "005TESTUSER123"
            elif username == "admin@test.com":
                return "005ADMINUSER456"
                
            # In production, this would validate against Salesforce
            return "005TESTUSER123"  # Return a dummy user ID for testing
            
        except Exception as e:
            print(f"Login error: {str(e)}")
            return None

    def get_products(self, user_role=None):
        """Get available products based on user role"""
        # Mock product catalog with role restrictions
        all_products = [
            {
                'Id': 'prod1',
                'Name': 'Codeium Hybrid',
                'UnitPrice': 49.00,
                'Description': 'Deployed Codeium to managed server but utilize Codeium GPU compute.',
                'AllowedRoles': ['all'],
                'Type': 'Subscription',
                'BillingFrequency': 'Monthly'
            },
            {
                'Id': 'prod2',
                'Name': 'Codeium Self-Hosted',
                'UnitPrice': 59.00,
                'Description': 'For Enterprise customers who deploy Codeium to a server',
                'AllowedRoles': ['all'],
                'Type': 'Subscription',
                'BillingFrequency': 'Monthly'
            },
            {
                'Id': 'prod3',
                'Name': 'Codeium SaaS Enterprise',
                'UnitPrice': 29.00,
                'Description': 'For cloud users >200 of product that require MSA',
                'AllowedRoles': ['all'],
                'Type': 'Subscription',
                'BillingFrequency': 'Monthly'
            },
            {
                'Id': 'prod4',
                'Name': 'Codeium SaaS Business',
                'UnitPrice': 24.00,
                'Description': 'For cloud users <200 of product that require MSA',
                'AllowedRoles': ['all'],
                'Type': 'Subscription',
                'BillingFrequency': 'Monthly'
            },
            {
                'Id': 'prod5',
                'Name': 'Cascade Entry',
                'UnitPrice': 44.00,
                'Description': 'add-on to core Codeium Saas/Hybrid',
                'AllowedRoles': ['all'],
                'Type': 'Credits',
                'BillingFrequency': 'Monthly',
                'MonthlyPromptCredits': 300,
                'MonthlyFlowCredits': 1200,
                'CreditType': 'Fixed'
            },
            {
                'Id': 'prod6',
                'Name': 'Cascade Standard',
                'UnitPrice': 99.00,
                'Description': 'add-on to core Codeium SaaS/Hybrid',
                'AllowedRoles': ['all'],
                'Type': 'Credits',
                'BillingFrequency': 'Monthly',
                'MonthlyPromptCredits': 1000,
                'MonthlyFlowCredits': 2500,
                'CreditType': 'Fixed'
            },
            {
                'Id': 'prod7',
                'Name': 'Cascade Entry Add-On Flex Credits',
                'UnitPrice': 129.00,
                'Description': 'Additional credits',
                'AllowedRoles': ['all'],
                'Type': 'Credits',
                'BillingFrequency': 'Monthly',
                'MonthlyFlexCredits': 3500,
                'CreditType': 'Flex'
            },
            {
                'Id': 'prod8',
                'Name': 'Cascade Standard Add-On Flex Credits',
                'UnitPrice': 129.00,
                'Description': 'Additional credits',
                'AllowedRoles': ['all'],
                'Type': 'Credits',
                'BillingFrequency': 'Monthly',
                'MonthlyFlexCredits': 5000,
                'CreditType': 'Flex'
            }
        ]
        
        if user_role == 'System Administrator':
            return all_products
        else:
            # Filter products available to all roles
            return [product for product in all_products if 'all' in product['AllowedRoles']]
