import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) throw usersError

    const results = []

    // For each user, generate digest
    for (const user of users.users) {
      try {
        // First fetch prices and news, then generate digest
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        // Fetch prices
        const pricesResponse = await fetch(
          `${supabaseUrl}/functions/v1/fetch-prices`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        // Fetch news
        const newsResponse = await fetch(
          `${supabaseUrl}/functions/v1/fetch-news`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        // Generate digest
        const digestResponse = await fetch(
          `${supabaseUrl}/functions/v1/generate-digest`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (digestResponse.ok) {
          results.push({ user: user.id, status: 'success' })
        } else {
          const error = await digestResponse.text()
          console.error(`Failed for user ${user.id}:`, error)
          results.push({ user: user.id, status: 'failed', error })
        }
      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err)
        results.push({ user: user.id, status: 'error', error: err.message })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

