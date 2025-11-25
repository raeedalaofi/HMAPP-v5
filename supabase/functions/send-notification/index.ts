// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  user_id: string
  title: string
  body: string
  notification_type: string
  data?: Record<string, unknown>
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

    const { user_id, title, body, notification_type, data = {} } = await req.json() as NotificationRequest

    // Get user's FCM tokens
    const { data: devices, error: devicesError } = await supabase
      .from('user_devices')
      .select('fcm_token, platform')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (devicesError) {
      throw new Error(`Failed to fetch devices: ${devicesError.message}`)
    }

    if (!devices || devices.length === 0) {
      console.log(`No active devices for user ${user_id}`)
      return new Response(
        JSON.stringify({ success: true, message: 'No devices to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Firebase credentials
    const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID')
    const firebasePrivateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n')
    const firebaseClientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')

    if (!firebaseProjectId || !firebasePrivateKey || !firebaseClientEmail) {
      throw new Error('Firebase credentials not configured')
    }

    // Get OAuth2 access token for FCM
    const accessToken = await getFirebaseAccessToken(
      firebaseClientEmail,
      firebasePrivateKey,
      firebaseProjectId
    )

    // Send to each device
    const results = await Promise.allSettled(
      devices.map(async (device) => {
        const message = {
          message: {
            token: device.fcm_token,
            notification: {
              title,
              body,
            },
            data: {
              notification_type,
              ...Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
              ),
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          },
        }

        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`FCM Error for device ${device.fcm_token.substring(0, 10)}...:`, errorText)
          
          // If token is invalid, deactivate the device
          if (errorText.includes('UNREGISTERED') || errorText.includes('INVALID_ARGUMENT')) {
            await supabase
              .from('user_devices')
              .update({ is_active: false })
              .eq('fcm_token', device.fcm_token)
          }
          
          throw new Error(errorText)
        }

        return response.json()
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`Notifications sent: ${successful} success, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error:', errorMessage)
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Helper function to get Firebase access token using service account
async function getFirebaseAccessToken(
  clientEmail: string,
  privateKey: string,
  projectId: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }
  
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  }

  // Create JWT
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  
  // Sign with private key
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  )
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

function pemToBinary(pem: string): ArrayBuffer {
  const base64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  
  const binary = atob(base64)
  const buffer = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buffer)
  
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i)
  }
  
  return buffer
}
