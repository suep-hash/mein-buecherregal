// TEMPORÄR - nur zur Fehlersuche, danach wieder löschen.
// Gibt KEINE echten Werte preis: nur Länge, erstes Nicht-Latin1-Zeichen und
// eine gekürzte SHA-256-Prüfsumme zum Abgleich mit dem lokalen Wert.
import { createHash } from "node:crypto";

function check(name, value) {
  if (!value) return { name, status: "FEHLT" };
  let badIndex = -1;
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 255) {
      badIndex = i;
      break;
    }
  }
  return {
    name,
    length: value.length,
    nonLatin1Index: badIndex,
    hash: createHash("sha256").update(value).digest("hex").slice(0, 12),
  };
}

export async function GET() {
  return Response.json([
    check("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    check("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    check("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY),
    check("ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY),
  ]);
}
