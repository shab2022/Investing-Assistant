import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple RSS parser
async function parseRSS(url: string): Promise<any[]> {
  try {
    const response = await fetch(url)
    const text = await response.text()
    const items = []
    
    // Simple regex-based RSS parsing
    const itemMatches = text.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)
    
    for (const match of itemMatches) {
      const itemContent = match[1]
      const titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const linkMatch = itemContent.match(/<link[^>]*>([\s\S]*?)<\/link>/i)
      const pubDateMatch = itemContent.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)
      
      if (titleMatch && linkMatch) {
        items.push({
          headline: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
          url: linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
          published_at: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
        })
      }
    }
    
    return items.slice(0, 10) // Limit to 10 items per feed
  } catch (error) {
    console.error(`Error parsing RSS from ${url}:`, error)
    return []
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Get user's positions
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('symbol')
      .eq('user_id', user.id)

    if (positionsError) throw positionsError

    const symbols = positions.map(p => p.symbol)
    if (symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No positions found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // RSS feeds
    const rssFeeds = [
      'https://feeds.finance.yahoo.com/rss/2.0/headline?s=',
      'https://www.cnbc.com/id/100003114/device/rss/rss.html',
      'https://feeds.reuters.com/reuters/businessNews',
    ]

    const allNews = []
    const sentimentServiceUrl = Deno.env.get('SENTIMENT_SERVICE_URL') || 'http://localhost:8000'

    // Fetch news for each symbol
    for (const symbol of symbols) {
      try {
        // Yahoo Finance RSS for specific symbol
        const yahooFeed = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=US&lang=en-US`
        const yahooItems = await parseRSS(yahooFeed)
        
        for (const item of yahooItems) {
          // Check if symbol is mentioned in headline
          if (item.headline.toUpperCase().includes(symbol)) {
            allNews.push({
              symbol,
              headline: item.headline,
              source: 'Yahoo Finance',
              url: item.url,
              published_at: item.published_at,
            })
          }
        }
      } catch (err) {
        console.error(`Error fetching news for ${symbol}:`, err)
      }
    }

    // Fetch general financial news
    for (const feedUrl of rssFeeds.slice(1)) {
      try {
        const items = await parseRSS(feedUrl)
        for (const item of items) {
          // Check if any user's symbol is mentioned
          const mentionedSymbol = symbols.find(s => 
            item.headline.toUpperCase().includes(s)
          )
          
          if (mentionedSymbol) {
            allNews.push({
              symbol: mentionedSymbol,
              headline: item.headline,
              source: feedUrl.includes('cnbc') ? 'CNBC' : 'Reuters',
              url: item.url,
              published_at: item.published_at,
            })
          }
        }
      } catch (err) {
        console.error(`Error fetching feed ${feedUrl}:`, err)
      }
    }

    // Get sentiment scores for headlines
    const newsWithSentiment = []
    for (const newsItem of allNews) {
      try {
        const sentimentResponse = await fetch(`${sentimentServiceUrl}/sentiment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newsItem.headline }),
        })

        if (sentimentResponse.ok) {
          const sentimentData = await sentimentResponse.json()
          newsItem.sentiment_score = sentimentData.score || 0
        } else {
          newsItem.sentiment_score = 0
        }
      } catch (err) {
        console.error(`Error getting sentiment for "${newsItem.headline}":`, err)
        newsItem.sentiment_score = 0
      }

      newsWithSentiment.push(newsItem)
    }

    // Upsert news (avoid duplicates by URL)
    if (newsWithSentiment.length > 0) {
      const { error: newsError } = await supabase
        .from('news')
        .upsert(newsWithSentiment, { onConflict: 'url', ignoreDuplicates: false })

      if (newsError) throw newsError
    }

    return new Response(
      JSON.stringify({ success: true, count: newsWithSentiment.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

