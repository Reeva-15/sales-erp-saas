import PDFDocument from 'pdfkit';

export class PdfService {
  /**
   * Generates Quotation PDF buffer
   */
  static async generateQuotationPdf(quotation: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header Branding
        doc.fillColor('#4A1525').fontSize(22).text('MARRONEX SALES ERP', { align: 'right' });
        doc.fillColor('#666666').fontSize(9).text('Sell smarter. Operate beautifully.', { align: 'right' });
        doc.moveDown(1);

        // Document Title
        doc.fillColor('#111111').fontSize(16).text('COMMERCIAL QUOTATION', 40, 70);
        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, 95).lineTo(550, 95).stroke();

        // Quotation Meta
        doc.fontSize(10).fillColor('#333333');
        doc.text(`Quotation #: ${quotation.quotationNumber}`, 40, 105);
        doc.text(`Date: ${new Date(quotation.quotationDate).toLocaleDateString()}`, 40, 120);
        doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`, 40, 135);

        // Customer Info
        doc.text(`Customer: ${quotation.customer?.customerName || 'N/A'}`, 320, 105);
        doc.text(`Contact: ${quotation.contactPerson || quotation.customer?.contactPerson || 'N/A'}`, 320, 120);
        doc.text(`GSTIN: ${quotation.customer?.gstin || 'N/A'}`, 320, 135);

        doc.moveDown(2);

        // Items Table Header
        let y = 175;
        doc.fillColor('#4A1525').rect(40, y, 510, 20).fill();
        doc.fillColor('#FFFFFF').fontSize(9).text('Item Description', 50, y + 5);
        doc.text('Qty', 300, y + 5);
        doc.text('Rate (₹)', 360, y + 5);
        doc.text('Disc %', 430, y + 5);
        doc.text('Amount (₹)', 480, y + 5);

        y += 25;
        doc.fillColor('#222222').fontSize(9);

        // Items Rows
        for (const item of quotation.items) {
          doc.text(item.description || item.product?.name || 'Item', 50, y);
          doc.text(String(item.quantity), 300, y);
          doc.text(Number(item.rate).toLocaleString('en-IN'), 360, y);
          doc.text(`${item.discountPercent}%`, 430, y);
          doc.text(Number(item.lineTotal).toLocaleString('en-IN'), 480, y);
          y += 20;
        }

        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, y).lineTo(550, y).stroke();
        y += 15;

        // Totals
        doc.text(`Subtotal: ₹ ${Number(quotation.subtotal).toLocaleString('en-IN')}`, 380, y);
        y += 15;
        doc.text(`Discount Total: - ₹ ${Number(quotation.discountTotal).toLocaleString('en-IN')}`, 380, y);
        y += 15;
        doc.text(`Tax Total (GST): + ₹ ${Number(quotation.taxTotal).toLocaleString('en-IN')}`, 380, y);
        y += 18;

        doc.fillColor('#4A1525').fontSize(12).text(`Grand Total: ₹ ${Number(quotation.grandTotal).toLocaleString('en-IN')}`, 380, y);

        // Footer Terms
        doc.fontSize(8).fillColor('#666666').text('Terms & Conditions: Prices are valid until the specified date. Payment terms as configured.', 40, 750, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Generates Invoice PDF buffer
   */
  static async generateInvoicePdf(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header Branding
        doc.fillColor('#4A1525').fontSize(22).text('MARRONEX SALES ERP', { align: 'right' });
        doc.fillColor('#666666').fontSize(9).text('TAX INVOICE', { align: 'right' });
        doc.moveDown(1);

        // Document Title
        doc.fillColor('#111111').fontSize(16).text('TAX INVOICE', 40, 70);
        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, 95).lineTo(550, 95).stroke();

        // Invoice Meta
        doc.fontSize(10).fillColor('#333333');
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 40, 105);
        doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 40, 120);
        doc.text(`Payment Terms: ${invoice.paymentTerms || 'Net 30'}`, 40, 135);

        // Customer Info
        doc.text(`Billed To: ${invoice.customer?.customerName || 'N/A'}`, 320, 105);
        doc.text(`GSTIN: ${invoice.customerGstin || invoice.customer?.gstin || 'N/A'}`, 320, 120);
        doc.text(`Address: ${invoice.billingAddress || 'N/A'}`, 320, 135);

        doc.moveDown(2);

        // Items Table Header
        let y = 175;
        doc.fillColor('#4A1525').rect(40, y, 510, 20).fill();
        doc.fillColor('#FFFFFF').fontSize(9).text('Item Description', 50, y + 5);
        doc.text('Qty', 280, y + 5);
        doc.text('Rate (₹)', 330, y + 5);
        doc.text('GST %', 395, y + 5);
        doc.text('Tax (₹)', 445, y + 5);
        doc.text('Amount (₹)', 490, y + 5);

        y += 25;
        doc.fillColor('#222222').fontSize(9);

        // Items Rows
        for (const item of invoice.items) {
          const itemTax = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
          doc.text(item.description || item.product?.name || 'Item', 50, y);
          doc.text(String(item.quantity), 280, y);
          doc.text(Number(item.rate).toLocaleString('en-IN'), 330, y);
          doc.text(`${item.taxPercent}%`, 395, y);
          doc.text(Number(itemTax).toLocaleString('en-IN'), 445, y);
          doc.text(Number(item.lineTotal).toLocaleString('en-IN'), 490, y);
          y += 20;
        }

        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, y).lineTo(550, y).stroke();
        y += 15;

        // Breakdown
        doc.text(`Subtotal: ₹ ${Number(invoice.subtotal).toLocaleString('en-IN')}`, 370, y);
        y += 14;
        if (invoice.cgstTotal > 0) {
          doc.text(`CGST: ₹ ${Number(invoice.cgstTotal).toLocaleString('en-IN')}`, 370, y);
          y += 14;
          doc.text(`SGST: ₹ ${Number(invoice.sgstTotal).toLocaleString('en-IN')}`, 370, y);
          y += 14;
        }
        if (invoice.igstTotal > 0) {
          doc.text(`IGST: ₹ ${Number(invoice.igstTotal).toLocaleString('en-IN')}`, 370, y);
          y += 14;
        }
        doc.text(`Total Tax: ₹ ${Number(invoice.taxTotal).toLocaleString('en-IN')}`, 370, y);
        y += 16;

        doc.fillColor('#4A1525').fontSize(12).text(`Grand Total: ₹ ${Number(invoice.grandTotal).toLocaleString('en-IN')}`, 370, y);
        y += 18;
        doc.fillColor('#059669').fontSize(10).text(`Paid Amount: ₹ ${Number(invoice.paidAmount).toLocaleString('en-IN')}`, 370, y);
        y += 15;
        doc.fillColor('#DC2626').fontSize(11).text(`Balance Due: ₹ ${Number(invoice.balanceAmount).toLocaleString('en-IN')}`, 370, y);

        // Footer
        doc.fontSize(8).fillColor('#666666').text('This is a computer-generated tax invoice. Authorised Signature.', 40, 750, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
