// TEMPORÄR - nur zur Fehlersuche, danach wieder löschen.
// Gibt KEINE echten Werte preis, nur Länge und ob Nicht-ASCII-Zeichen enthalten sind.
// (Re-Check nach Korrektur von ANTHROPIC_API_KEY)

function check(name, value) {
  if (!value) return { name, status: "FEHLT" };
  let firstBadIndex = -1;
  let firstBadCode = null;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 255) {
      firstBadIndex = i;
      firstBadCode = code;
      break;
    }
  }
  return {
    name,
    length: value.length,
    ok: firstBadIndex === -1,
    firstBadIndex,
    firstBadCode,
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
