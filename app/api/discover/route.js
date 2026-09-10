import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GENRES } from "@/lib/genres";

const client = new Anthropic();
const GENRE_NAMES = GENRES.map((g) => g.id);

export async function POST(request) {
  const { query } = await request.json();

  const { data: vorhandeneBuecher, error: loadError } = await supabaseAdmin
    .from("books")
    .select("titel, autor");

  if (loadError) {
    return Response.json({ error: loadError.message }, { status: 500 });
  }

  const bibliotheksListe = vorhandeneBuecher.map((b) => `${b.titel} von ${b.autor}`).join("; ");

  const system = `Du schlägst Bücher vor, die zur Anfrage des Nutzers passen und NICHT bereits in seiner Bibliothek sind. Bibliothek (nicht erneut vorschlagen): ${bibliotheksListe}

Antworte mit einem JSON-Array von 5 Objekten der Form {"titel": "...", "autor": "...", "genre": "<genau eines von: ${GENRE_NAMES.join(
    ", "
  )}>", "beschreibung": "<2-3 spoilerfreie Sätze auf Deutsch, um Lust aufs Lesen zu machen>"}. Verwende innerhalb der Textwerte NIEMALS gerade doppelte Anführungszeichen (") - nutze stattdessen einfache Anführungszeichen (') oder Guillemets (« »). Antworte NUR mit dem JSON-Array, ohne Markdown-Codeblock, ohne weiteren Text.`;

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 2048,
    output_config: { effort: "medium" },
    system,
    messages: [{ role: "user", content: query }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  let vorschlaege;
  try {
    vorschlaege = JSON.parse(text);
  } catch {
    console.error("JSON-Parse fehlgeschlagen (discover). stop_reason:", response.stop_reason);
    console.error("Rohtext:", text);
    return Response.json({ error: "Vorschläge konnten nicht gelesen werden." }, { status: 500 });
  }

  const bereinigt = vorschlaege.map((buch) => ({
    ...buch,
    genre: GENRE_NAMES.includes(buch.genre) ? buch.genre : "Sonstiges",
  }));

  return Response.json({ vorschlaege: bereinigt });
}
