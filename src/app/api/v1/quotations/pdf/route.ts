import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quoteNumber = searchParams.get('quote') || 'QT-20260821-4639';
    const customerName = searchParams.get('name') || 'Valued Customer';
    const companyName = searchParams.get('company') || 'Fabric Wholesale Client';
    const mobile = searchParams.get('mobile') || '+91 9728414117';
    const city = searchParams.get('city') || 'Surat';
    const date = searchParams.get('date') || new Date().toISOString().substring(0, 10);
    const valid = searchParams.get('valid') || new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10);
    const item = searchParams.get('item') || 'Need 500m Cotton Fabric';
    const qty = searchParams.get('qty') || '500';
    const unit = searchParams.get('unit') || 'Mtr';
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
    const safeValid = sanitize(valid);
    const safeItem = sanitize(item).substring(0, 36);
    const safeQty = sanitize(qty);
    const safeUnit = sanitize(unit);
    const safeTotal = sanitize(total);
    const safeRep = sanitize(rep);

    // Exact FabricTraders PDF stream layout with simplified 4-column item table (No HSN, No Rate, No GST)
    const textBlocks = [
      // 1. Logo & Header
      `BT /F1 16 Tf 1 1 1 rg 44 774 Td (F) Tj ET`,
      `BT /F1 18 Tf 0.15 0.04 0.26 rg 72 778 Td (FabricTraders) Tj ET`,
      `BT /F2 9 Tf 0.3 0.3 0.3 rg 72 763 Td (Textile Mills & Premium Fabric Wholesaler) Tj ET`,
      `BT /F2 9 Tf 0.3 0.3 0.3 rg 72 750 Td (Ring Road Textile Market, Surat, Gujarat - 395002) Tj ET`,
      `BT /F2 9 Tf 0.3 0.3 0.3 rg 72 737 Td (GSTIN: 24AABCF1234F1Z9  |  Phone: +91 98765 43210) Tj ET`,

      // 2. Price Quotation Badge & Meta
      `BT /F1 10 Tf 1 1 1 rg 440 776 Td (PRICE QUOTATION) Tj ET`,
      `BT /F1 9.5 Tf 0.15 0.04 0.26 rg 435 752 Td (${safeQuote}) Tj ET`,
      `BT /F2 9 Tf 0.3 0.3 0.3 rg 435 738 Td (Date: ${safeDate}) Tj ET`,
      `BT /F2 9 Tf 0.3 0.3 0.3 rg 435 725 Td (Valid Until: ${safeValid}) Tj ET`,

      // 3. Client & Caller Card
      `BT /F1 8.5 Tf 0.5 0.5 0.5 rg 50 686 Td (QUOTATION PREPARED FOR:) Tj ET`,
      `BT /F1 11.5 Tf 0.1 0.1 0.1 rg 50 670 Td (${safeCust}) Tj ET`,
      `BT /F1 9.5 Tf 0.25 0.08 0.45 rg 50 655 Td (${safeComp}) Tj ET`,
      `BT /F2 9 Tf 0.3 0.3 0.3 rg 50 640 Td (${safeMob}) Tj ET`,
      `BT /F2 9 Tf 0.3 0.3 0.3 rg 50 626 Td (${safeCity}, India) Tj ET`,

      `BT /F1 8.5 Tf 0.5 0.5 0.5 rg 330 686 Td (REPRESENTATIVE / CALLER:) Tj ET`,
      `BT /F1 10.5 Tf 0.1 0.1 0.1 rg 330 670 Td (${safeRep}) Tj ET`,
      `BT /F2 9 Tf 0.3 0.3 0.3 rg 330 655 Td (sales@fabrictraders.com) Tj ET`,
      `BT /F1 9 Tf 0.08 0.50 0.24 rg 330 638 Td (Verified Supplier Direct Rate) Tj ET`,

      // 4. Simplified Table Header (No HSN, No Rate, No GST)
      `BT /F1 9 Tf 1 1 1 rg 45 583 Td (#) Tj ET`,
      `BT /F1 9 Tf 1 1 1 rg 80 583 Td (ITEM / FABRIC DESCRIPTION) Tj ET`,
      `BT /F1 9 Tf 1 1 1 rg 330 583 Td (QUANTITY) Tj ET`,
      `BT /F1 9 Tf 1 1 1 rg 410 583 Td (UNIT) Tj ET`,
      `BT /F1 9 Tf 1 1 1 rg 475 583 Td (TOTAL AMOUNT) Tj ET`,

      // 5. Table Row Data
      `BT /F2 9.5 Tf 0.1 0.1 0.1 rg 48 556 Td (1) Tj ET`,
      `BT /F2 9.5 Tf 0.1 0.1 0.1 rg 80 556 Td (${safeItem}) Tj ET`,
      `BT /F2 9.5 Tf 0.1 0.1 0.1 rg 340 556 Td (${safeQty}) Tj ET`,
      `BT /F2 9.5 Tf 0.1 0.1 0.1 rg 415 556 Td (${safeUnit}) Tj ET`,
      `BT /F1 10.5 Tf 0.08 0.50 0.24 rg 475 556 Td (Rs. ${safeTotal}) Tj ET`,

      // 6. Amount in Words Box
      `BT /F1 9 Tf 0.2 0.2 0.2 rg 45 520 Td (Amount In Words:) Tj ET`,
      `BT /F2 8.5 Tf 0.3 0.3 0.3 rg 48 498 Td (Rupees Forty-Four Thousand Six Hundred Twenty-Five Only) Tj ET`,

      // 7. Grand Total
      `BT /F1 11 Tf 0.15 0.04 0.26 rg 340 500 Td (Grand Total:) Tj ET`,
      `BT /F1 13 Tf 0.08 0.50 0.24 rg 465 500 Td (Rs. ${safeTotal}) Tj ET`,

      // 8. Terms and Conditions
      `BT /F1 9.5 Tf 0.2 0.2 0.2 rg 40 435 Td (Terms and Conditions:) Tj ET`,
      `BT /F2 8.5 Tf 0.3 0.3 0.3 rg 40 417 Td (1. 30% Advance with order confirmation, balance before dispatch.) Tj ET`,
      `BT /F2 8.5 Tf 0.3 0.3 0.3 rg 40 402 Td (2. Dispatch within 3-5 days from Surat Warehouse.) Tj ET`,
      `BT /F2 8.5 Tf 0.3 0.3 0.3 rg 40 387 Td (3. Freight extra at actuals on TO-PAY basis.) Tj ET`,
      `BT /F2 8.5 Tf 0.3 0.3 0.3 rg 40 372 Td (4. Payment via RTGS/NEFT to HDFC Bank A/C: 50200012345678 IFSC: HDFC0001234) Tj ET`,

      // 9. Signatures
      `BT /F2 9 Tf 0.3 0.3 0.3 rg 70 265 Td (Client's Signature) Tj ET`,
      `BT /F2 9 Tf 0.3 0.3 0.3 rg 370 265 Td (Authorized Signatory - FabricTraders) Tj ET`,
    ].join('\n');

    const drawOps = `
% Geometric Fills
0.15 0.04 0.26 rg
35 765 28 28 re f

0.15 0.04 0.26 rg
425 768 135 24 re f

0.15 0.04 0.26 RG
1.5 w
35 715 525 0 m 560 715 l S

0.98 0.97 0.99 rg
35 615 525 90 re f
0.88 0.82 0.94 RG
0.5 w
35 615 525 90 re S

0.15 0.04 0.26 rg
35 575 525 24 re f

0.98 0.98 0.98 rg
35 545 525 30 re f
0.85 0.85 0.85 RG
0.5 w
35 545 525 30 re S
65 545 0 30 m 65 575 l S
315 545 0 30 m 315 575 l S
395 545 0 30 m 395 575 l S
465 545 0 30 m 465 575 l S

0.98 0.98 0.98 rg
40 490 270 24 re f
0.88 0.88 0.88 RG
0.5 w
40 490 270 24 re S

0.96 0.94 0.98 rg
330 488 230 28 re f
0.15 0.04 0.26 RG
1 w
330 488 230 28 re S

0.6 0.6 0.6 RG
0.5 w
50 280 140 0 m 190 280 l S
350 280 180 0 m 530 280 l S
`;

    const stream = `${drawOps}\n${textBlocks}`;
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
