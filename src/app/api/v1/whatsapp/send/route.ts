import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WHATSIFY_SECRET = process.env.WHATSIFY_SECRET || '279ba9e2-02c5-47a6-8842-4585c39e36f7';
const WHATSIFY_ACCOUNT = process.env.WHATSIFY_ACCOUNT || '17784736507786f221ce0a5c074f88876a94ba69a1c32c8c44';
const WHATSIFY_URL = process.env.WHATSIFY_URL || 'https://api.whatsify.me/api/send/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipient,
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

    if (!recipient || !message) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number and message are required.' },
        { status: 400 }
      );
    }

    // Clean and normalize phone number to +91XXXXXXXXXX
    const cleanDigits = String(recipient).replace(/\D/g, '');
    const formattedPhone = cleanDigits.length === 10
      ? `+91${cleanDigits}`
      : cleanDigits.startsWith('91') && cleanDigits.length === 12
      ? `+${cleanDigits}`
      : `+${cleanDigits}`;

    // Prepare multipart form data payload for Whatsify API
    const formData = new FormData();
    formData.append('secret', WHATSIFY_SECRET);
    formData.append('account', WHATSIFY_ACCOUNT);
    formData.append('recipient', formattedPhone);
    formData.append('priority', String(priority || 1));
    formData.append('message', message);
    formData.append('type', type);

    // Optional Media Banner / Image (Top header image like screenshot)
    if (media_url) {
      formData.append('media_url', media_url);
      formData.append('url', media_url);
    }
    if (document_url) {
      formData.append('document_url', document_url);
    }
    if (filename) {
      formData.append('filename', filename);
    }

    // Optional Footer & Buttons
    if (footer) {
      formData.append('footer', footer);
    }
    if (button_text && button_url) {
      formData.append('button_1', `url|${button_text}|${button_url}`);
      formData.append('buttons', JSON.stringify([
        { type: 'url', title: button_text, value: button_url },
      ]));
    }

    // Call Whatsify API
    const whatsifyRes = await fetch(WHATSIFY_URL, {
      method: 'POST',
      body: formData,
    });

    const responseText = await whatsifyRes.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!whatsifyRes.ok && !responseData.status && !responseData.success) {
      // Fallback: If 'button' or 'media' type was rejected by the gateway account, retry as rich text message
      if (type !== 'text') {
        const fallbackFormData = new FormData();
        fallbackFormData.append('secret', WHATSIFY_SECRET);
        fallbackFormData.append('account', WHATSIFY_ACCOUNT);
        fallbackFormData.append('recipient', formattedPhone);
        fallbackFormData.append('priority', '1');
        fallbackFormData.append('type', 'text');
        fallbackFormData.append('message', message);

        const retryRes = await fetch(WHATSIFY_URL, {
          method: 'POST',
          body: fallbackFormData,
        });
        const retryText = await retryRes.text();
        try {
          responseData = JSON.parse(retryText);
        } catch {
          responseData = { raw: retryText };
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: responseData.message || responseData.error || 'Failed to send WhatsApp message via Whatsify',
            details: responseData,
          },
          { status: whatsifyRes.status || 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `WhatsApp quotation message sent successfully to ${formattedPhone}`,
      recipient: formattedPhone,
      whatsify_response: responseData,
      sent_at: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error('Whatsify WhatsApp send error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while sending WhatsApp message' },
      { status: 500 }
    );
  }
}
