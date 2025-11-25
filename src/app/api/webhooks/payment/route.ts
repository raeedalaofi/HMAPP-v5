import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create client inside the handler to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    
    // Extract payment information from webhook
    const { 
      token,
      status,
      payment_method,
      reference,
      ...gatewayResponse 
    } = body

    if (status === 'paid') {
      // Confirm payment in database
      const { data, error } = await supabase.rpc('confirm_payment', {
        p_payment_token: token,
        p_payment_method: payment_method,
        p_payment_reference: reference,
        p_gateway_response: gatewayResponse
      })

      if (error) {
        console.error('Payment confirmation error:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({ success: true, data })
    }

    // Handle other statuses (failed, cancelled, etc.)
    return NextResponse.json({ 
      success: false, 
      message: `Payment status: ${status}` 
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
