import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse CSV from request body
    const { csvContent } = await req.json()

    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'CSV content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse CSV (assuming Robinhood format: Symbol,Quantity,Average Cost Basis)
    const lines = csvContent.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim())
    
    // Find column indices
    const symbolIdx = headers.findIndex(h => h.toLowerCase().includes('symbol') || h.toLowerCase().includes('ticker'))
    const quantityIdx = headers.findIndex(h => h.toLowerCase().includes('quantity') || h.toLowerCase().includes('shares'))
    const costIdx = headers.findIndex(h => h.toLowerCase().includes('cost') || h.toLowerCase().includes('basis'))

    if (symbolIdx === -1 || quantityIdx === -1) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSV format. Required columns: Symbol, Quantity' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const positions = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const symbol = values[symbolIdx]?.replace(/"/g, '').toUpperCase()
      const quantity = parseFloat(values[quantityIdx]?.replace(/"/g, ''))
      const avgCost = costIdx !== -1 ? parseFloat(values[costIdx]?.replace(/"/g, '')) : null

      if (symbol && !isNaN(quantity) && quantity > 0) {
        positions.push({
          user_id: user.id,
          symbol,
          quantity,
          avg_cost_basis: avgCost || null,
        })
      }
    }

    // Upsert positions
    const { error } = await supabase
      .from('positions')
      .upsert(positions, { onConflict: 'user_id,symbol' })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, count: positions.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

