# 🚀 RS ANIME - Deno Deploy Functions Guide
## প্রতিটা Function আলাদা Deno Deploy Project হিসেবে ডিপ্লয় করো

---

## ⚠️ IMPORTANT SETUP
1. Deno Deploy → "Want to start fresh?" → **Deploy** ক্লিক করো
2. Project নাম দাও (যেমন: `rs-video-proxy`)
3. Playground ওপেন হলে ডিফল্ট কোড মুছে নিচের কোড পেস্ট করো
4. **Settings → Environment Variables** এ প্রয়োজনীয় key গুলো যোগ করো
5. Save করো — অটো ডিপ্লয় হয়ে যাবে!

প্রতিটা function এর জন্য আলাদা project বানাও। মোট ৮টা project লাগবে।

---

## 1️⃣ VIDEO-PROXY
**Project নাম:** `rs-video-proxy`
**ENV Keys:** কিছু লাগবে না
**URL হবে:** `https://rs-video-proxy.deno.dev`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let videoUrl: string | null = null;

    if (req.method === 'GET') {
      videoUrl = new URL(req.url).searchParams.get('url');
    } else {
      const body = await req.json();
      videoUrl = body.url;
    }

    if (!videoUrl) {
      return new Response('URL required', { status: 400, headers: corsHeaders });
    }

    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
      'Connection': 'keep-alive',
    };

    const rangeHeader = req.headers.get('Range');
    if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(videoUrl, {
      headers: fetchHeaders,
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok && response.status !== 206) {
      return new Response(JSON.stringify({ error: `Upstream returned ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
    if (response.headers.get('Content-Length')) headers.set('Content-Length', response.headers.get('Content-Length')!);
    if (response.headers.get('Content-Range')) headers.set('Content-Range', response.headers.get('Content-Range')!);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=86400');

    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## 2️⃣ SEND-FCM
**Project নাম:** `rs-send-fcm`
**ENV Keys:** `FIREBASE_SERVICE_ACCOUNT_KEY` (পুরো JSON)
**URL হবে:** `https://rs-send-fcm.deno.dev`

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function getAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/firebase.database",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));

  const pemContents = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(`${header}.${payload}`));
  const jwt = `${header}.${payload}.${base64UrlEncode(new Uint8Array(signature))}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(`Token failed: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

const BRAND_ICON = "https://i.ibb.co.com/gLc93Bc3/android-chrome-512x512.png";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tokens, userIds, title, body, image, data } = await req.json();
    const inputTokens = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
    const inputUserIds = Array.isArray(userIds) ? userIds.filter(Boolean) : [];

    if (!inputTokens.length && !inputUserIds.length) {
      return new Response(JSON.stringify({ error: "No tokens or userIds" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sa = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY") || "{}");
    if (!sa.client_email) throw new Error("Service account not configured");

    const accessToken = await getAccessToken(sa);
    const dbUrl = (sa.database_url || `https://${sa.project_id}-default-rtdb.firebaseio.com`).replace(/\/$/, "");

    const normalizedData: Record<string, string> = {};
    if (data) Object.entries(data).forEach(([k, v]) => { normalizedData[k] = v == null ? "" : String(v); });

    let resolvedTokens = [...new Set(inputTokens)];
    let tokenPaths: Record<string, string[]> = {};

    if (!resolvedTokens.length && inputUserIds.length) {
      let res = await fetch(`${dbUrl}/fcmTokens.json`);
      if (!res.ok) res = await fetch(`${dbUrl}/fcmTokens.json?access_token=${accessToken}`);
      const tree = await res.json();
      const allowed = new Set(inputUserIds);
      Object.entries(tree || {}).forEach(([uid, ut]: any) => {
        if (!allowed.has(uid)) return;
        Object.entries(ut || {}).forEach(([tk, entry]: any) => {
          if (entry?.token) {
            resolvedTokens.push(entry.token);
            if (!tokenPaths[entry.token]) tokenPaths[entry.token] = [];
            tokenPaths[entry.token].push(`fcmTokens/${uid}/${tk}`);
          }
        });
      });
      resolvedTokens = [...new Set(resolvedTokens)];
    }

    if (!resolvedTokens.length) {
      return new Response(JSON.stringify({ success: 0, failed: 0, totalTokens: 0, reason: "NO_MATCHING_TOKENS" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let success = 0, failed = 0;
    const invalidTokens: string[] = [];

    for (const token of resolvedTokens) {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            webpush: {
              headers: { Urgency: "high" },
              notification: { title, body, icon: BRAND_ICON, image, badge: BRAND_ICON },
              fcm_options: normalizedData.url ? { link: normalizedData.url } : undefined,
            },
            data: normalizedData,
          },
        }),
      });
      if (res.ok) { success++; } else {
        failed++;
        const err = await res.text();
        if (err.includes("UNREGISTERED") || err.includes("INVALID_ARGUMENT")) invalidTokens.push(token);
      }
    }

    // Cleanup invalid tokens
    for (const t of invalidTokens) {
      for (const p of (tokenPaths[t] || [])) {
        await fetch(`${dbUrl}/${p}.json`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ success, failed, totalTokens: resolvedTokens.length, invalidTokens }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
```

---

## 3️⃣ SEND-TELEGRAM-POST
**Project নাম:** `rs-telegram-post`
**ENV Keys:** `TELEGRAM_BOT_TOKEN`
**URL হবে:** `https://rs-telegram-post.deno.dev`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!TOKEN) return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const { chatId, caption, photoUrl, buttonText, buttonUrl } = await req.json();
    if (!chatId || !caption) return new Response(JSON.stringify({ error: 'chatId and caption required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const API = `https://api.telegram.org/bot${TOKEN}`;
    const reply_markup = buttonText && buttonUrl ? { inline_keyboard: [[{ text: buttonText, url: buttonUrl }]] } : undefined;

    let result;
    if (photoUrl) {
      const body: any = { chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' };
      if (reply_markup) body.reply_markup = JSON.stringify(reply_markup);
      result = await (await fetch(`${API}/sendPhoto`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
    } else {
      const body: any = { chat_id: chatId, text: caption, parse_mode: 'HTML' };
      if (reply_markup) body.reply_markup = JSON.stringify(reply_markup);
      result = await (await fetch(`${API}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
    }

    if (!result.ok) return new Response(JSON.stringify({ error: result.description }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
```

---

## 4️⃣ SHORTEN-LINK
**Project নাম:** `rs-shorten-link`
**ENV Keys:** `AROLINKS_API_KEY`
**URL হবে:** `https://rs-shorten-link.deno.dev`

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) return new Response(JSON.stringify({ error: "URL required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const apiKey = Deno.env.get("AROLINKS_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const data = await (await fetch(`https://arolinks.com/api?api=${apiKey}&url=${encodeURIComponent(url)}`)).json();
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
```

---

## 5️⃣ CLEAN-EMBED
**Project নাম:** `rs-clean-embed`
**ENV Keys:** কিছু লাগবে না
**URL হবে:** `https://rs-clean-embed.deno.dev`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    let url: string | null = null;
    if (req.method === 'GET') {
      url = new URL(req.url).searchParams.get('url');
    } else {
      url = (await req.json()).url;
    }

    if (!url) return new Response(JSON.stringify({ error: 'url required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const playerHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body,html{width:100%;height:100%;overflow:hidden;background:#000}iframe{width:100%;height:100%;border:none}</style></head><body><iframe src="${url}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="no-referrer"></iframe></body></html>`;

    return new Response(playerHtml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'X-Frame-Options': 'ALLOWALL' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
```

---

## 6️⃣ WELCOME-TTS
**Project নাম:** `rs-welcome-tts`
**ENV Keys:** `ELEVENLABS_API_KEY`
**URL হবে:** `https://rs-welcome-tts.deno.dev`

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    const API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!API_KEY) throw new Error("ELEVENLABS_API_KEY not configured");

    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/nPczCjzI2devNBz1zQrb?output_format=mp3_22050_32", {
      method: "POST",
      headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text || "Hello Friend, Welcome to RS Anime!",
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.35, similarity_boost: 0.85, style: 0.7, use_speaker_boost: true, speed: 1.0 },
      }),
    });

    if (!response.ok) throw new Error(`ElevenLabs failed [${response.status}]`);
    return new Response(await response.arrayBuffer(), {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
```

---

## 7️⃣ SCRAPE-ANIMESALT
**Project নাম:** `rs-scrape-animesalt`
**ENV Keys:** কিছু লাগবে না
**URL হবে:** `https://rs-scrape-animesalt.deno.dev`

⚠️ এই ফাংশনটা অনেক বড় (540 lines)। এটা GitHub repo দিয়ে ডিপ্লয় করা ভালো হবে।
অথবা Playground তে পুরো কোড পেস্ট করতে পারো — `supabase/functions/scrape-animesalt/index.ts` ফাইলের কোড হুবহু কপি করো, শুধু প্রথম লাইনের `import { serve }` মুছে দাও এবং শেষের `serve(async (req) => {` কে `Deno.serve(async (req) => {` দিয়ে রিপ্লেস করো।

---

## 8️⃣ LIVE-CHAT
**Project নাম:** `rs-live-chat`
**ENV Keys:** `LOVABLE_API_KEY` (Lovable AI Gateway key)
**URL হবে:** `https://rs-live-chat.deno.dev`

⚠️ এই ফাংশনটা **Lovable AI Gateway** ব্যবহার করে (`ai.gateway.lovable.dev`)। Deno Deploy তে ডিপ্লয় করলে `LOVABLE_API_KEY` লাগবে। এটা Lovable Cloud এর বাইরে কাজ নাও করতে পারে। বিকল্প হিসেবে Google Gemini API key সরাসরি ব্যবহার করতে পারো।

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, animeContext, userContext } = await req.json();

    // Option A: Lovable AI Gateway (needs LOVABLE_API_KEY)
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    // Option B: Google Gemini direct (needs GEMINI_API_KEY)
    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");

    const systemPrompt = `তুমি RS Anime-এর AI সাপোর্ট অ্যাসিস্ট্যান্ট "RS Bot"।...`; // আসল system prompt বসাও

    let reply = "";

    if (LOVABLE_KEY) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "system", content: systemPrompt }, ...messages] }),
      });
      const data = await res.json();
      reply = data.choices?.[0]?.message?.content || "দুঃখিত, উত্তর দিতে পারছি না।";
    } else if (GEMINI_KEY) {
      // Direct Gemini API call
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: messages.map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })), systemInstruction: { parts: [{ text: systemPrompt }] } }),
      });
      const data = await res.json();
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "দুঃখিত।";
    } else {
      throw new Error("No AI API key configured");
    }

    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
```

---

## 🔧 Admin Panel এ Deno Base URLs সেট করার নিয়ম

প্রতিটা function আলাদা project, তাই Admin Panel এ **per-function override** ব্যবহার করো:

| Function | Deno URL |
|---|---|
| video-proxy | `https://rs-video-proxy.deno.dev` |
| send-fcm | `https://rs-send-fcm.deno.dev` |
| send-telegram-post | `https://rs-telegram-post.deno.dev` |
| shorten-link | `https://rs-shorten-link.deno.dev` |
| clean-embed | `https://rs-clean-embed.deno.dev` |
| welcome-tts | `https://rs-welcome-tts.deno.dev` |
| scrape-animesalt | `https://rs-scrape-animesalt.deno.dev` |
| live-chat | `https://rs-live-chat.deno.dev` |

Admin → Edge Router → প্রতিটা function এ "Deno" সিলেক্ট করে URL বসাও।

