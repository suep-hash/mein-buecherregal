import { createClient } from "@supabase/supabase-js";

// Nutzt den Secret Key statt des Publishable Keys - bypasst Row Level
// Security. Nur in serverseitigem Code importieren (Route Handler, Skripte),
// niemals in einer Client-Komponente.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
