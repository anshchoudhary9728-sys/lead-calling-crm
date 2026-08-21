import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEFAULT_WHATSIFY_SECRET =
  process.env.WHATSIFY_SECRET || '279ba9e2-02c5-47a6-8842-4585c39e36f7';
const DEFAULT_WHATSIFY_ACCOUNT =
  process.env.WHATSIFY_ACCOUNT || '17784736507786f221ce0a5c074f88876a94ba69a1c32c8c44';
const DEFAULT_WHATSIFY_URL =
  process.env.WHATSIFY_URL || 'https://api.whatsify.me/api/send/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipient,
      message,
      lead_id,
      quotation_id,
      secret = DEFAULT_WHATSIFY_SECRET,
      account = DEFAULT_WHATSIFY_ACCOUNT,
      type = 'text',
      priority = 1,
    } = body;

    if (!recipient || !message) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number and message are required.' },
        { status: 400 }
      );
    }

    // Clean phone number: remove non-digits
    const cleanDigits = String(recipient).replace(/\D/g, '');
    let formattedRecipient = '';
    if (cleanDigits.length === 10) {
      formattedRecipient = `+91${cleanDigits}`;
    } else if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
      formattedRecipient = `+${cleanDigits}`;
    } else {
      formattedRecipient = cleanDigits.startsWith('+') ? cleanDigits : `+${cleanDigits}`;
    }

    // Build payload using standard FormData
    const formData = new FormData();
    formData.append('secret', String(secret).trim());
    formData.append('account', String(account).trim());
    formData.append('recipient', formattedRecipient);
    formData.append('message', message);
    formData.append('type', String(type));
    formData.append('priority', String(priority));

    // Send request to Whatsify API
    const response = await fetch(DEFAULT_WHATSIFY_URL, {
      method: 'POST',
      body: formData,
    });

    const responseText = await response.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }

    const isSuccess = response.ok || (responseData && (responseData.status === 200 || responseData.success === true || !responseData.error));

    // Log to Supabase integration_logs if available
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('integration_logs').insert([
          {
            source: 'OTHER',
            payload: {
              type: 'WHATSAPP_QUOTATION',
              recipient: formattedRecipient,
              lead_id,
              quotation_id,
              status: isSuccess ? 'SUCCESS' : 'FAILED',
              api_response: responseData,
            },
            status: isSuccess ? 'SUCCESS' : 'FAILED',
            error_message: isSuccess ? null : String(responseText),
          },
        ]);
      } catch (logErr) {
        console.error('Failed to log WhatsApp send to Supabase:', logErr);
      }
    }

    return NextResponse.json({
      success: isSuccess,
      message: isSuccess
        ? `Quotation sent successfully to ${formattedRecipient} via WhatsApp`
        : `Whatsify API returned an error: ${responseText}`,
      recipient: formattedRecipient,
      whatsify_response: responseData,
    });
  } catch (err: any) {
    console.error('WhatsApp send exception:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to send WhatsApp message through Whatsify API.',
      },
      { status: 500 }
    );
  }
}
