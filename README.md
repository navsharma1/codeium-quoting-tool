# Salesforce Quoting Tool

This project is a quoting tool that integrates with Salesforce, allowing users to create and manage quotes efficiently.

## Setup

1. Clone the repository
2. Navigate to the project directory
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and update with your Salesforce credentials:
   ```bash
   cp .env.example .env
   ```
5. Update the `.env` file with your Salesforce credentials:
   - SF_USERNAME: Your Salesforce username
   - SF_PASSWORD: Your Salesforce password
   - SF_SECURITY_TOKEN: Your Salesforce security token
   - SF_DOMAIN: Use 'test' for sandbox, 'login' for production

## Running the Application

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

RESTful API endpoints for interacting with the quote management system.

### Quote Management
- `POST /quotes`: Create a new quote
  ```json
  {
    "opportunity_id": "006xxxxxxxxxxxx",
    "quote_data": {
      "Name": "Sample Quote",
      "Description": "Quote description"
    }
  }
  ```
- `GET /quotes/<quote_id>`: Get a specific quote
- `PUT /quotes/<quote_id>`: Update a quote
- `GET /quotes?opportunity_id=xxx`: List quotes (optionally filtered by opportunity)

### Line Items
- `POST /quotes/<quote_id>/line-items`: Add a line item
  ```json
  {
    "product_id": "01txxxxxxxxxxxx",
    "quantity": 1,
    "unit_price": 100.00
  }
  ```
- `PUT /quotes/<quote_id>/line-items/<item_id>`: Update a line item
- `DELETE /quotes/<quote_id>/line-items/<item_id>`: Delete a line item

### Quote Approval Workflow
- `POST /quotes/<quote_id>/submit`: Submit quote for approval
- `POST /quotes/<quote_id>/approve`: Approve quote
- `POST /quotes/<quote_id>/reject`: Reject quote
  ```json
  {
    "rejection_reason": "Price too high"
  }
  ```

### Calculations and PDF Generation
- `GET /quotes/<quote_id>/calculate`: Calculate quote totals
- `GET /quotes/<quote_id>/pdf`: Generate and download quote PDF

## Features
- Create and manage quotes
- Line item management
- Quote approval workflow
- Automatic calculations (subtotal, discounts, taxes)
- PDF quote generation
- Integration with Salesforce API
- RESTful API endpoints
- Secure credential management
