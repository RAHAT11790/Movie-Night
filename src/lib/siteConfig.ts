// ============================================
// MOVIE NIGHT - Centralized Site Configuration
// ============================================
// সব হার্ডকোডেড ভ্যালু এখানে env থেকে আসে।
// .env.example দেখে সব ভ্যালু সেট করুন।

// --- Branding ---
export const SITE_NAME = import.meta.env.VITE_SITE_NAME || "MOVIE NIGHT";
export const SITE_DESCRIPTION = import.meta.env.VITE_SITE_DESCRIPTION || "Your ultimate destination for watching anime series and movies.";
export const SITE_URL = import.meta.env.VITE_SITE_URL || "https://movies_night.vercel.app";
export const SITE_ICON_URL = import.meta.env.VITE_SITE_ICON_URL || "https://i.ibb.co/pjHZHQXv/20260401-202949.png";

// --- Telegram ---
export const TELEGRAM_CHANNEL = import.meta.env.VITE_TELEGRAM_CHANNEL || "@CARTOONFUNNY03";
export const TELEGRAM_CHANNEL_URL = import.meta.env.VITE_TELEGRAM_CHANNEL_URL || "https://t.me/Najim_bhai01";
export const TELEGRAM_ADMIN_URL = import.meta.env.VITE_TELEGRAM_ADMIN_URL || "https://t.me/najim_bhai9";

// --- TMDB ---
export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "37f4b185e3dc487e4fd3e56e2fab2307";
export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/";

// --- Cloudflare CDN ---
export const CLOUDFLARE_CDN_URL = import.meta.env.VITE_CLOUDFLARE_CDN_URL || "";

// --- Supabase (auto-set, don't change) ---
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// --- Firebase (auto-set from env) ---
export const FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BEBfzBmfz6WsBS2g7kbLrweYqA6iYwiBE857kRUEQNwgD_V4DB8PV4tElFoEoPVUakhfKXPIlgzQLZ9QsPfWaNE";

// --- FCM ---
export const FCM_ENDPOINT = `${CLOUDFLARE_CDN_URL}/send-fcm`;
