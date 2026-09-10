import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const client = new Anthropic();

const REIHE_SCHEMA =
  '"reihe": null oder {"name": "<Reihenname>", "position": <Zahl>, "gesamt": <Zahl oder null>, "vorherige": [<Titel der Bände davor, chronologisch, auch falls nicht in der Bibliothek des Nutzers>], "naechste": [<Titel der Bände danach, chronologisch, auch falls nicht in der Bibliothek des Nutzers>]} - falls das Buch kein Teil einer Reihe ist, setze "reihe" auf null.';

// Wichtig: erzwingt gültiges JSON. Ohne diesen Hinweis nutzt Claude gelegentlich
// normale Anführungszeichen für Zitate/Ironie *innerhalb* der Strings, was das
// JSON kaputt macht (unescaped ").
const JSON_HINWEIS =
  'Antworte NUR mit gültigem JSON, ohne Markdown-Codeblock, ohne weiteren Text. Verwende innerhalb der Textwerte NIEMALS gerade doppelte Anführungszeichen (") - nutze stattdessen einfache Anführungszeichen (\') oder Guillemets (« »), falls du etwas hervorheben oder zitieren willst.';

export async function POST(request) {
  const { id, titel, autor, status } = await request.json();

  const istGelesen = status === "gelesen";

  const system = istGelesen
    ? `Du schreibst Informationen zu einem Buch für jemanden, der es bereits gelesen hat. Antworte mit einem JSON-Objekt der Form {"zusammenfassung": "<4-6 Sätze auf Deutsch, ausführlich inkl. Handlung, Themen und Ende - Spoiler ausdrücklich erwünscht>", ${REIHE_SCHEMA}} ${JSON_HINWEIS}`
    : `Du schreibst Informationen zu einem Buch, um Lust aufs Lesen zu machen, OHNE das Ende oder entscheidende Wendungen zu verraten. Antworte mit einem JSON-Objekt der Form {"zusammenfassung": "<2-3 spoilerfreie Sätze auf Deutsch>", ${REIHE_SCHEMA}} ${JSON_HINWEIS}`;

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 2048,
    output_config: { effort: "medium" },
    system,
    messages: [{ role: "user", content: `Buch: "${titel}" von ${autor}` }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("JSON-Parse fehlgeschlagen. stop_reason:", response.stop_reason);
    console.error("Rohtext:", text);
    return Response.json({ error: "Antwort von Claude konnte nicht gelesen werden." }, { status: 500 });
  }

  const { error } = await supabaseAdmin
    .from("books")
    .update({ zusammenfassung: parsed.zusammenfassung, reihe: parsed.reihe ?? null })
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ summary: parsed.zusammenfassung, reihe: parsed.reihe ?? null });
}
