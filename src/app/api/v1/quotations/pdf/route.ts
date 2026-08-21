import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quoteNumber = searchParams.get('quote') || 'QT-20260821-3478';
    const customerName = searchParams.get('name') || 'Valued Customer';
    const companyName = searchParams.get('company') || '';
    const mobile = searchParams.get('mobile') || '';
    const city = searchParams.get('city') || 'Surat';
    const date = searchParams.get('date') || new Date().toISOString().substring(0, 10);
    const item = searchParams.get('item') || 'Fabric Inquiry';
    const qty = searchParams.get('qty') || '500 Mtr';
    const rate = searchParams.get('rate') || '85.00';
    const total = searchParams.get('total') || '44,625';
    const rep = searchParams.get('rep') || 'Pooja Choudhary';

    // Minimal Pure PDF 1.4 Specification Generator in JavaScript
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Title (Quotation ${quoteNumber}) /Author (FabricTraders) >>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<<
  /Type /Page
  /Parent 3 0 R
  /MediaBox [0 0 595 842]
  /Resources <<
    /Font <<
      /F1 5 0 R
      /F2 6 0 R
    >>
  >>
  /Contents 7 0 R
>>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
7 0 obj
<< /Length 1200 >>
stream
BT
/F1 20 Tf
50 780 Td
(FABRIC TRADERS - TEXTILE MILLS SURAT) Tj
/F2 10 Tf
0 -18 Td
(Ring Road Textile Market, Surat, Gujarat - 395002 | GSTIN: 24AABCF1234F1Z9) Tj
0 -15 Td
(Phone: +91 98765 43210 | Email: sales@fabrictraders.com) Tj
/F1 14 Tf
0 -30 Td
(OFFICIAL PRICE QUOTATION: ${quoteNumber}) Tj
/F2 11 Tf
0 -20 Td
(Date: ${date}    |    Valid Until: 7 Days) Tj
0 -25 Td
(Customer: ${customerName} ${companyName ? '(' + companyName + ')' : ''}) Tj
0 -16 Td
(Mobile: ${mobile}    |    Location: ${city}, India) Tj
0 -16 Td
(Sales Representative: ${rep}) Tj
0 -30 Td
(=================================================================) Tj
/F1 11 Tf
0 -18 Td
(#   ITEM DESCRIPTION                   QTY        RATE (INR)    TOTAL (INR)) Tj
/F2 11 Tf
0 -15 Td
(=================================================================) Tj
0 -18 Td
(1   ${item.padEnd(30, ' ')}   ${qty.padEnd(8, ' ')}   Rs.${rate.padEnd(10, ' ')}   Rs.${total}) Tj
0 -20 Td
(=================================================================) Tj
/F1 13 Tf
0 -25 Td
(GRAND TOTAL: INR Rs.${total}/-) Tj
/F2 10 Tf
0 -35 Td
(Terms and Conditions:) Tj
0 -15 Td
(1. 30% Advance with order confirmation, balance before dispatch.) Tj
0 -14 Td
(2. Dispatch within 3-5 days from Surat Warehouse.) Tj
0 -14 Td
(3. Freight extra at actuals on TO-PAY basis.) Tj
0 -40 Td
(Bank Details for Payment:) Tj
0 -14 Td
(A/C: FabricTraders Textiles | HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0001234) Tj
0 -40 Td
(Authorized Signatory - FabricTraders Surat) Tj
ET
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000015 00000 n 
0000000084 00000 n 
0000000135 00000 n 
0000000194 00000 n 
0000000350 00000 n 
0000000417 00000 n 
0000000479 00000 n 
trailer
<< /Size 8 /Root 2 0 R /Info 1 0 R >>
startxref
1750
%%EOF`;

    return new Response(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Quotation-${quoteNumber}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
