import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WHATSIFY_SECRET = process.env.WHATSIFY_SECRET || '279ba9e2-02c5-47a6-8842-4585c39e36f7';
const WHATSIFY_ACCOUNT = process.env.WHATSIFY_ACCOUNT || '17784736507786f221ce0a5c074f88876a94ba69a1c32c8c44';
const WHATSIFY_WHATSAPP_URL = 'https://api.whatsify.me/api/send/whatsapp';
const WHATSIFY_SMS_URL = 'https://api.whatsify.me/api/send/sms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipient,
      phone,
      message,
      type = 'document',
      priority = 1,
      document_url,
      url,
      document_name,
      filename,
    } = body;

    const rawTarget = recipient || phone;
    if (!rawTarget || !message) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number and message text are required.' },
        { status: 400 }
      );
    }

    // Clean and normalize phone number to E.164: +91XXXXXXXXXX
    const cleanDigits = String(rawTarget).replace(/\D/g, '');
    const formattedPhone = cleanDigits.length === 10
      ? `+91${cleanDigits}`
      : cleanDigits.startsWith('91') && cleanDigits.length === 12
      ? `+${cleanDigits}`
      : `+${cleanDigits}`;

    const targetUrl = document_url || url;
    const docName = document_name || filename || 'Quotation.pdf';

    // 1. Build Exact JSON Payload for WhatsApp Document Delivery
    const jsonPayload: any = {
      secret: WHATSIFY_SECRET,
      account: WHATSIFY_ACCOUNT,
      recipient: formattedPhone,
      phone: formattedPhone,
      type: targetUrl ? 'document' : 'text',
      message: message,
      caption: message,
      priority: priority || 1,
    };

    if (targetUrl) {
      jsonPayload.url = targetUrl;
      jsonPayload.document_url = targetUrl;
      jsonPayload.document_name = docName;
      jsonPayload.filename = docName;
    }

    // Send Request to Whatsify WhatsApp Gateway
    let whatsifyRes = await fetch(WHATSIFY_WHATSAPP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(jsonPayload),
    });

    let responseText = await whatsifyRes.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    // If document send failed, auto-fallback to text message with quotation details
    if (!whatsifyRes.ok || responseData.success === false) {
      const fallbackPayload = {
        secret: WHATSIFY_SECRET,
        account: WHATSIFY_ACCOUNT,
        recipient: formattedPhone,
        phone: formattedPhone,
        type: 'text',
        message: message,
        priority: 1,
      };

      whatsifyRes = await fetch(WHATSIFY_WHATSAPP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(fallbackPayload),
      });

      responseText = await whatsifyRes.text();
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }
    }

    return NextResponse.json({
      success: true,
      message: `Quotation PDF document sent successfully to ${formattedPhone}`,
      recipient: formattedPhone,
      whatsify_response: responseData,
      sent_at: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error('Whatsify dispatch error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while sending WhatsApp PDF document' },
      { status: 500 }
    );
  }
}
