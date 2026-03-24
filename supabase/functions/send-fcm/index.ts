import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Firebase Service Account - Movie Night Project
const FIREBASE_SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "movie-night-88f65",
  "private_key_id": "a51f07c0d062fa187166c4953e3b922fb3ba8d3c",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCsZ7o9LJywHhR5\nJpggdsAN2M0g7imAbpkW8UA9h/ZoMhdrgCVd4bkMJkscHdwwvk6TUq0O3Xph1tyP\n6bnrmxFQM+c6rktBwSrTj/SSohlCO/EwX+Ho06WXaAj5I7TaJZaiROZtti63BLpl\njdbtwygmvcT9zV/my0pj6vSGSV9fZhIcLhZovLnPg+G4Fh7S6x/o/p83kRaXArOE\nizYIoQh0Lu1BH4Zixt+fKiUnXBoJFNFRdhPn8FyL3VFj8FnpaHe5emTZOlP3xtqO\nz/+kCd+GZYLDn1cggInmHWCQ/vt6hLIiw1vlSGEfeIkoZ9dESoiRvAVYoiMz2kWP\nQQvhWI8tAgMBAAECggEAHRxerBmuU2ag2lwT79ddUnk7GcZdJ5yFKQSPblRY3Pso\nTTSUGqgUkOKeaB76oRhhOCsLoajwEzkugPZcOFY0tDAvaQ8pEe9GBfcWuvO4BCEO\n9rYZ9TBXk5szeK34yaTzLG8p4XiTpr+boa4zjm4Xh4MfkiNtgBDvfLOdmlclTXwt\npvQronm4TP/p4qgIY7gzQYG8856wNBqrbOBCwm9ssDq2AjZ5DUMCgeThylLKbx0q\nPiUmp+hFhYoyCOEHUYGe+lS8Cu7vPuKEkowXJh3sPdXkMZC6w7bDLV9d+dhC8Prb\n8Va6g1V2LyutUZNwDXN54t57Dhb3v3nEuMNXJpedgQKBgQDce42ujkc6vxoGt8jY\nzrcgk6xfyX+MhQQFQ58f4O9G1eFQvqjY163mY7/RIwk8iS9zLwdKa3PrUjdHZt9k\nsEZEX7ys92ks68tDW2wSR8z8ZG5fYBCFnpgZyXVwa+re6Eus3/FYSrRPeHn9lZxp\nxjdZdkzWU5uO0E3olc3LxeTCEQKBgQDILYQrLmdd35iQxjzTABJWjhGlsl5BaVQO\nRRf09wQt/FVVJKrikouVmLSYa01vMwIRk8G6DfoedNTrDofocN1Xw7N8BOlkinwK\n8DGv9URf1IKK5xN17uEzFN7TqX3cma0tgmxSHnE9i77qZL2aKqo3tHrYTOznnU0/\n0DlfD94fXQKBgHOAViyHZFEmI2A5jwHk6JIsSjSzvhnC5ORNFGMC1tZo3OwLtTBD\nbFoxDx9kF0abJzxT+qHFwKgaHdNN1OFOZsES1ihWQ8bAj27tyaOZ8YyWoCtei8kz\n18JKgzctkZDMaDhb6Ha0S9kF6AIsChBvQjeffYkZq3gZL3cUYwbI2JnBAoGBAKez\nOh7S6VYDlFT1Ps+mJ7bLno0qOTyjeP/bco6Owrmjw/lolqDqFHZnUCTBAEZAfWMs\nXgf43anWRuoFamaY51Y3ZY5orv7D5ddkErxOxdFiv1qO7AbI8XFR8rtwKzk8pZCS\nyxyg1E2zXWYQr6cQRzoTwTake3QunCDx2J6DNJshAoGBAJGcCHyiSVzZpQDzkH77\nt2ip+vd02Va2xBR1jA3mQGE7WnqkMPXsVBug2gJu8SxWcj+A1Ji2+vvoPy7yLp7g\nq65saQizikakjELMkXABBN+SnMY3Qqj+r5yaBNNxOQxHAhRqbMBU/GA6AJitQVyR\nqXtwMYMTHa69omOzI7yGx74k\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@movie-night-88f65.iam.gserviceaccount.com",
  "client_id": "113439152950650585583",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40movie-night-88f65.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
  database_url?: string;
};

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: [
      "https://www.googleapis.com/auth/firebase.messaging",
      "https://www.googleapis.com/auth/firebase.database",
    ].join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));

  const pemKey = serviceAccount.private_key;
  const pemContents = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signatureInput);
  const sig = base64UrlEncode(new Uint8Array(signature));
  const jwt = `${header}.${payload}.${sig}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

const BRAND_ICON_URL = "https://i.ibb.co/MxDFRJVt/IMG-20260324-224042-439.jpg";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tokens, userIds, title, body, image, data } = await req.json();

    console.log("Received request:", { tokens: tokens?.length, userIds, title, body });

    const inputTokens = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
    const inputUserIds = Array.isArray(userIds) ? userIds.filter(Boolean) : [];

    if (inputTokens.length === 0 && inputUserIds.length === 0) {
      return new Response(JSON.stringify({ error: "No tokens or userIds provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceAccount: ServiceAccount = FIREBASE_SERVICE_ACCOUNT;
    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    console.log("Access token obtained, project:", projectId);

    let resolvedTokens = [...new Set(inputTokens)];

    if (resolvedTokens.length === 0 && inputUserIds.length > 0) {
      // Simplified: Just return success for testing
      return new Response(JSON.stringify({
        success: 0,
        failed: 0,
        totalTokens: 0,
        message: "Test mode - tokens would be fetched from RTDB",
        note: "Make sure fcmTokens exist in Firebase Realtime Database at /fcmTokens/{userId}/{tokenKey}/token"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send notifications
    let successCount = 0;
    let failCount = 0;

    for (const token of resolvedTokens) {
      try {
        const message = {
          message: {
            token,
            notification: {
              title: title || "Test Notification",
              body: body || "This is a test notification",
            },
            webpush: {
              headers: {
                Urgency: "high",
              },
              notification: {
                title: title || "Test Notification",
                body: body || "This is a test notification",
                icon: BRAND_ICON_URL,
                badge: BRAND_ICON_URL,
              },
            },
            data: data || {},
          },
        };

        console.log("Sending to token:", token.substring(0, 20) + "...");

        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });

        if (response.ok) {
          successCount++;
          console.log("✅ Notification sent successfully to:", token.substring(0, 20) + "...");
        } else {
          const errorText = await response.text();
          console.error("❌ Failed to send to", token.substring(0, 20) + "...:", errorText);
          failCount++;
        }
      } catch (err) {
        console.error("❌ Error sending to token:", err);
        failCount++;
      }
    }

    return new Response(JSON.stringify({
      success: successCount,
      failed: failCount,
      totalTokens: resolvedTokens.length,
      message: `Sent ${successCount} notifications, failed ${failCount}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
