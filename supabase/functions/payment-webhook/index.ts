// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentWebhookPayload {
  id: string
  type: string
  amount: number
  currency: string
  status: string
  source: {
    type: string
    number?: string
    name?: string
  }
  metadata?: {
    payment_token?: string
    job_id?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify webhook signature (Moyasar example)
    const signature = req.headers.get('x-moyasar-signature')
    const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET')
    
    if (webhookSecret && signature) {
      // Verify HMAC signature
      const body = await req.text()
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(body)
      )
      const computedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      if (computedSignature !== signature) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Parse verified body
      var payload = JSON.parse(body) as PaymentWebhookPayload
    } else {
      // No signature verification (development mode)
      var payload = await req.json() as PaymentWebhookPayload
    }

    console.log('Payment webhook received:', payload.type, payload.id)

    // Handle different event types
    if (payload.type === 'payment' && payload.status === 'paid') {
      const paymentToken = payload.metadata?.payment_token

      if (!paymentToken) {
        console.error('No payment token in metadata')
        return new Response(
          JSON.stringify({ error: 'Missing payment token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Call the confirm_payment function
      const { data, error } = await supabase.rpc('confirm_payment', {
        p_payment_token: paymentToken,
        p_payment_method: payload.source?.type || 'card',
        p_payment_reference: payload.id,
        p_gateway_response: payload,
      })

      if (error) {
        console.error('Error confirming payment:', error.message)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Payment confirmed successfully:', data)

      // Send notification to customer and technician
      const jobId = data?.job_id || payload.metadata?.job_id
      if (jobId) {
        // Get job details for notifications
        const { data: job } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            customer:customers!jobs_customer_id_fkey(user_id),
            technician:technicians!jobs_technician_id_fkey(user_id, profile:user_profiles!technicians_profile_id_fkey(full_name))
          `)
          .eq('id', jobId)
          .single()

        if (job) {
          // Notify technician
          if (job.technician?.user_id) {
            await supabase.functions.invoke('send-notification', {
              body: {
                user_id: job.technician.user_id,
                title: 'تم الدفع بنجاح! 💰',
                body: `تم استلام الدفع للطلب "${job.title}". يمكنك البدء الآن.`,
                notification_type: 'payment_received',
                data: { job_id: jobId },
              },
            })
          }

          // Notify customer
          if (job.customer?.user_id) {
            await supabase.functions.invoke('send-notification', {
              body: {
                user_id: job.customer.user_id,
                title: 'تم الدفع بنجاح! ✅',
                body: `الفني ${job.technician?.profile?.full_name || ''} في طريقه إليك.`,
                notification_type: 'payment_confirmed',
                data: { job_id: jobId },
              },
            })
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (payload.type === 'payment' && payload.status === 'failed') {
      console.log('Payment failed:', payload.id)
      
      // Optionally update payment_link status
      if (payload.metadata?.payment_token) {
        await supabase
          .from('payment_links')
          .update({ 
            status: 'failed',
            gateway_response: payload,
          })
          .eq('token', payload.metadata.payment_token)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Payment failure recorded' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Unknown event type - acknowledge anyway
    return new Response(
      JSON.stringify({ success: true, message: 'Event received' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook error:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
