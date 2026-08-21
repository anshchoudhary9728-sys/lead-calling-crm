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
      type = 'text',
      priority = 1,
      media_url,
      document_url,
      filename,
      button_text,
      button_url,
      footer = 'FabricTraders Textiles • Surat',
    } = body;

    const rawTarget = recipient || phone;
    if (!rawTarget || !message) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number and message text are required.' },
        { status: 400 }
      );
    }

    // Clean and normalize phone number to E.164 format: +91XXXXXXXXXX
    const cleanDigits = String(rawTarget).replace(/\D/g, '');
    const formattedPhone = cleanDigits.length === 10
      ? `+91${cleanDigits}`
      : cleanDigits.startsWith('91') && cleanDigits.length === 12
      ? `+${cleanDigits}`
      : `+${cleanDigits}`;

    // 1. Prepare JSON Payload as specified in Whatsify API Documentation
    const jsonPayload: any = {
      secret: WHATSIFY_SECRET,
      account: WHATSIFY_ACCOUNT,
      recipient: formattedPhone,
      phone: formattedPhone,
      type: type || 'text',
      message: message,
      priority: priority || 1,
    };

    if (media_url) {
      jsonPayload.media_url = media_url;
      jsonPayload.url = media_url;
    }
    if (document_url) {
      jsonPayload.document_url = document_url;
    }
    if (filename) {
      jsonPayload.filename = filename;
    }
    if (footer) {
      jsonPayload.footer = footer;
    }
    if (button_text && button_url) {
      jsonPayload.button_1 = `url|${button_text}|${button_url}`;
      jsonPayload.buttons = [
        { type: 'url', title: button_text, value: button_url },
      ];
    }

    // Send JSON Request to Whatsify WhatsApp Endpoint
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

    // If WhatsApp endpoint failed or device not paired, fallback to /send/sms if needed
    if (!whatsifyRes.ok && responseData.status === 404) {
      const smsPayload = {
        secret: WHATSIFY_SECRET,
        phone: formattedPhone,
        message: message,
      };

      whatsifyRes = await fetch(WHATSIFY_SMS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(smsPayload),
      });

      responseText = await whatsifyRes.text();
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }
    }

    // Check success status from Whatsify API
    const isSuccess = whatsifyRes.ok || responseData.status === 200 || responseData.success === true || responseData.status === 'success';

    if (!isSuccess && responseData.error) {
      return NextResponse.json(
        {
          success: false,
          error: responseData.message || responseData.error || 'Failed to dispatch via Whatsify gateway.',
          details: responseData,
        },
        { status: whatsifyRes.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Message dispatched successfully to ${formattedPhone}`,
      recipient: formattedPhone,
      whatsify_response: responseData,
      sent_at: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error('Whatsify dispatch error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while sending message' },
      { status: 500 }
    );
  }
}
