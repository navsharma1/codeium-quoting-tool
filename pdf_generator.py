from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import os
from datetime import datetime

class QuotePDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.output_dir = "generated_pdfs"
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def generate_pdf(self, quote_data: dict) -> str:
        """
        Generate a PDF for a quote
        """
        filename = f"{self.output_dir}/quote_{quote_data['Id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        doc = SimpleDocTemplate(filename, pagesize=letter)
        elements = []

        # Add Header
        elements.append(Paragraph(f"Quote: {quote_data['Name']}", self.styles['Heading1']))
        elements.append(Spacer(1, 12))

        # Add Quote Details
        elements.append(Paragraph("Quote Details", self.styles['Heading2']))
        details = [
            ["Quote Number:", quote_data['Id']],
            ["Date:", datetime.now().strftime("%Y-%m-%d")],
            ["Expiration Date:", quote_data.get('ExpirationDate', 'N/A')],
            ["Status:", quote_data.get('Status', 'Draft')]
        ]
        details_table = Table(details, colWidths=[2*inch, 4*inch])
        details_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(details_table)
        elements.append(Spacer(1, 12))

        # Add Line Items
        elements.append(Paragraph("Line Items", self.styles['Heading2']))
        if 'LineItems' in quote_data and quote_data['LineItems']:
            headers = ["Product", "Quantity", "Unit Price", "Total"]
            data = [headers]
            for item in quote_data['LineItems']:
                data.append([
                    item.get('Description', 'N/A'),
                    str(item['Quantity']),
                    f"${item['UnitPrice']:,.2f}",
                    f"${item['TotalPrice']:,.2f}"
                ])
            
            line_items_table = Table(data, colWidths=[3*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            line_items_table.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('PADDING', (0, 0), (-1, -1), 6),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ]))
            elements.append(line_items_table)
            elements.append(Spacer(1, 12))

        # Add Totals
        elements.append(Paragraph("Quote Summary", self.styles['Heading2']))
        totals = [
            ["Subtotal:", f"${quote_data.get('subtotal', 0):,.2f}"],
            ["Discount:", f"${quote_data.get('discount_amount', 0):,.2f}"],
            ["Tax:", f"${quote_data.get('tax_amount', 0):,.2f}"],
            ["Grand Total:", f"${quote_data.get('grand_total', 0):,.2f}"]
        ]
        totals_table = Table(totals, colWidths=[2*inch, 4*inch])
        totals_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('BACKGROUND', (-2, -1), (-1, -1), colors.grey),
            ('TEXTCOLOR', (-2, -1), (-1, -1), colors.whitesmoke),
        ]))
        elements.append(totals_table)

        # Generate PDF
        doc.build(elements)
        return filename
