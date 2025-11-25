// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OTPRequest {
  target: string        // phone number or email
  target_type: 'phone' | 'email'
  purpose?: string      // verification, password_reset, etc.
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { target, target_type, purpose = 'verification' } = await req.json() as OTPRequest

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // OTP expires in 5 minutes
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    if (target_type === 'phone') {
      // Send SMS via Unifonic or similar
      const smsApiKey = Deno.env.get('SMS_API_KEY')
      const smsSenderId = Deno.env.get('SMS_SENDER_ID') || 'HMAPP'
      
      if (!smsApiKey) {
        throw new Error('SMS_API_KEY not configured')
      }

      // Unifonic API example
      const smsResponse = await fetch('https://el.cloud.unifonic.com/rest/SMS/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          AppSid: smsApiKey,
          Recipient: target.replace('+', ''),
          Body: `رمز التحقق الخاص بك في HMAPP هو: ${otp}`,
          SenderID: smsSenderId,
        }),
      })

      if (!smsResponse.ok) {
        const errorText = await smsResponse.text()
        console.error('SMS API Error:', errorText)
        throw new Error('Failed to send SMS')
      }

      console.log(`OTP sent to phone: ${target.substring(0, 6)}***`)

    } else if (target_type === 'email') {
      // Send email via Resend or similar
      const emailApiKey = Deno.env.get('EMAIL_API_KEY')
      
      if (!emailApiKey) {
        throw new Error('EMAIL_API_KEY not configured')
      }

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${emailApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'HMAPP <noreply@hmapp.com>',
          to: target,
          subject: `رمز التحقق - ${otp}`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>رمز التحقق الخاص بك</h2>
              <p style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px;">
                ${otp}
              </p>
              <p>صالح لمدة 5 دقائق</p>
              <hr />
              <p style="color: #666; font-size: 12px;">
                إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.
              </p>
            </div>
          `,
        }),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('Email API Error:', errorText)
        throw new Error('Failed to send email')
      }

      console.log(`OTP sent to email: ${target.substring(0, 3)}***`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: target_type === 'phone' 
          ? 'تم إرسال رمز التحقق عبر SMS'
          : 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
        expires_at,
        // In production, never return the OTP!
        // This is just for development/testing
        ...(Deno.env.get('ENVIRONMENT') === 'development' && { otp }),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
