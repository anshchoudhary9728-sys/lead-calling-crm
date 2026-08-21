import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quoteNumber = searchParams.get('quote') || 'QT-20260821-3478';
    const customerName = searchParams.get('name') || 'Anil';
    const companyName = searchParams.get('company') || 'Gupta Fabrics';
    const mobile = searchParams.get('mobile') || '+91 9876543212';
    const city = searchParams.get('city') || 'Delhi';
    const date = searchParams.get('date') || new Date().toISOString().substring(0, 10);
    const validUntil = searchParams.get('valid') || new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10);
    const item = searchParams.get('item') || 'Need 500m Cotton Fabric';
    const qty = searchParams.get('qty') || '500 Mtr';
    const rate = searchParams.get('rate') || '85.00';
    const total = searchParams.get('total') || '44,625';
    const rep = searchParams.get('rep') || 'Pooja Choudhary';

    // Clean strings to prevent PDF syntax breaks
    const sanitize = (str: string) => String(str).replace(/[\\()]/g, ' ').trim();

    const safeQuote = sanitize(quoteNumber);
    const safeCust = sanitize(customerName);
    const safeComp = sanitize(companyName);
    const safeMob = sanitize(mobile);
    const safeCity = sanitize(city);
    const safeDate = sanitize(date);
    const safeValid = sanitize(validUntil);
    const safeItem = sanitize(item).substring(0, 32);
    const safeQty = sanitize(qty);
    const safeRate = sanitize(rate);
    const safeTotal = sanitize(total);
    const safeRep = sanitize(rep);

    // Exact FabricTraders PDF stream layout matching the UI template
    const content = `
BT
/F1 18 Tf
0.15 0.04 0.26 rg
65 776 Td
(FabricTraders) Tj
ET

BT
/F2 9 Tf
0.3 0.3 0.3 rg
35 754 Td
(Textile Mills & Premium Fabric Wholesaler) Tj
0 -12 Td
(Ring Road Textile Market, Surat, Gujarat - 395002) Tj
0 -12 Td
(GSTIN: 24AABCF1234F1Z9  |  Phone: +91 98765 43210) Tj
ET

BT
/F1 10 Tf
1 1 1 rg
450 774 Td
(PRICE QUOTATION) Tj
ET

BT
/F1 9 Tf
0.15 0.04 0.26 rg
440 754 Td
(${safeQuote}) Tj
/F2 8.5 Tf
0.3 0.3 0.3 rg
0 -12 Td
(Date: ${safeDate}) Tj
0 -12 Td
(Valid Until: ${safeValid}) Tj
ET

BT
/F1 8.5 Tf
0.5 0.5 0.5 rg
45 682 Td
(QUOTATION PREPARED FOR:) Tj
/F1 11 Tf
0.1 0.1 0.1 rg
0 -15 Td
(${safeCust}) Tj
/F1 9.5 Tf
0.25 0.08 0.45 rg
0 -13 Td
(${safeComp}) Tj
/F2 9 Tf
0.3 0.3 0.3 rg
0 -13 Td
(${safeMob}) Tj
0 -12 Td
(${safeCity}, India) Tj
ET

BT
/F1 8.5 Tf
0.5 0.5 0.5 rg
360 682 Td
(REPRESENTATIVE / CALLER:) Tj
/F1 10 Tf
0.1 0.1 0.1 rg
0 -15 Td
(${safeRep}) Tj
/F2 9 Tf
0.3 0.3 0.3 rg
0 -13 Td
(sales@fabrictraders.com) Tj
/F1 9 Tf
0.08 0.50 0.24 rg
0 -15 Td
(Verified Supplier Direct Rate) Tj
ET

BT
/F1 9 Tf
1 1 1 rg
45 587 Td
(#) Tj
75 587 Td
(ITEM DESCRIPTION) Tj
260 587 Td
(HSN) Tj
310 587 Td
(QUANTITY) Tj
380 587 Td
(RATE Rs.) Tj
440 587 Td
(GST) Tj
490 587 Td
(TOTAL Rs.) Tj
ET

BT
/F2 9 Tf
0.1 0.1 0.1 rg
48 560 Td
(1) Tj
75 560 Td
(${safeItem}) Tj
260 560 Td
(5208) Tj
310 560 Td
(${safeQty}) Tj
380 560 Td
(Rs.${safeRate}) Tj
440 560 Td
(5%) Tj
/F1 9 Tf
490 560 Td
(Rs.${safeTotal}) Tj
ET

BT
/F1 9 Tf
0.2 0.2 0.2 rg
45 522 Td
(Amount In Words:) Tj
/F2 8.5 Tf
0.3 0.3 0.3 rg
0 -14 Td
(Rupees Forty-Four Thousand Six Hundred Twenty-Five Only) Tj
ET

BT
/F2 9 Tf
0.3 0.3 0.3 rg
360 522 Td
(Taxable Subtotal:) Tj
0 -15 Td
(GST Tax (CGST+SGST):) Tj
/F1 11 Tf
0.15 0.04 0.26 rg
0 -18 Td
(Grand Total:) Tj
ET

BT
/F1 9 Tf
0.1 0.1 0.1 rg
490 522 Td
(Rs.42,500) Tj
0 -15 Td
(+ Rs.2,125) Tj
/F1 12 Tf
0.08 0.50 0.24 rg
0 -18 Td
(Rs.${safeTotal}) Tj
ET

BT
/F1 9 Tf
0.2 0.2 0.2 rg
35 440 Td
(Terms and Conditions:) Tj
/F2 8.5 Tf
0.3 0.3 0.3 rg
35 422 Td
(1. 30% Advance with order confirmation, balance before dispatch.) Tj
0 -13 Td
(2. Dispatch within 3-5 days from Surat Warehouse.) Tj
0 -13 Td
(3. Freight extra at actuals on TO-PAY basis.) Tj
0 -13 Td
(4. Payment via RTGS/NEFT to HDFC Bank A/C: 50200012345678 IFSC: HDFC0001234) Tj
ET

BT
/F2 9 Tf
0.3 0.3 0.3 rg
70 320 Td
(Client's Signature) Tj
390 320 Td
(Authorized Signatory - FabricTraders) Tj
ET
`;

    // Draw Exact matching box outlines, headers and borders
    const drawOps = `
0.15 0.04 0.26 rg
35 770 24 24 re f

BT
/F1 14 Tf
1 1 1 rg
42 778 Td
(F) Tj
ET

0.15 0.04 0.26 rg
430 766 130 20 re f

0.15 0.04 0.26 RG
1.5 w
35 715 525 0 m 560 715 l S

0.97 0.96 0.99 rg
35 605 525 95 re f
0.88 0.82 0.94 RG
0.5 w
35 605 525 95 re S

0.15 0.04 0.26 rg
35 575 525 24 re f

0.96 0.96 0.97 rg
35 548 525 27 re f

0.85 0.85 0.85 RG
0.5 w
35 548 525 27 re S
65 548 0 27 m 65 575 l S
250 548 0 27 m 250 575 l S
300 548 0 27 m 300 575 l S
370 548 0 27 m 370 575 l S
430 548 0 27 m 430 575 l S
480 548 0 27 m 480 575 l S

0.98 0.98 0.98 rg
35 496 280 20 re f
0.88 0.88 0.88 RG
0.5 w
35 496 280 20 re S

0.15 0.04 0.26 RG
1 w
360 498 200 0 m 560 498 l S

0.85 0.85 0.85 RG
0.5 w
35 455 525 0 m 560 455 l S

0.6 0.6 0.6 RG
0.5 w
50 340 120 0 m 170 340 l S
360 340 180 0 m 540 340 l S
`;

    const stream = `${drawOps}\n${content}`;
    const streamLen = Buffer.byteLength(stream);

    const pdfDocument = `%PDF-1.4
1 0 obj
<< /Title (Quotation ${safeQuote}) /Author (FabricTraders Surat) >>
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
<< /Length ${streamLen} >>
stream
${stream}
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000015 00000 n 
0000000090 00000 n 
0000000141 00000 n 
0000000200 00000 n 
0000000356 00000 n 
0000000423 00000 n 
0000000485 00000 n 
trailer
<< /Size 8 /Root 2 0 R /Info 1 0 R >>
startxref
${600 + streamLen}
%%EOF`;

    return new Response(pdfDocument, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Quotation-${safeQuote}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
