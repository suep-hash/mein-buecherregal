// Lokales Admin-Skript: generiert für alle Bücher ohne Zusammenfassung eine
// (ausführlich bei "gelesen", kurz & spoilerfrei sonst) inkl. Reihen-Info.
// Läuft nur auf deinem Rechner (node scripts/generate-summaries.js), nie im
// Browser. Spiegelt die Logik aus app/api/summary/route.js.

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const AnthropicPkg = require("@anthropic-ai/sdk");
const Anthropic = AnthropicPkg.default ?? AnthropicPkg;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const client = new Anthropic();

const REIHE_SCHEMA =
  '"reihe": null oder {"name": "<Reihenname>", "position": <Zahl>, "gesamt": <Zahl oder null>, "vorherige": [<Titel der Bände davor, chronologisch, auch falls nicht in der Bibliothek des Nutzers>], "naechste": [<Titel der Bände danach, chronologisch, auch falls nicht in der Bibliothek des Nutzers>]} - falls das Buch kein Teil einer Reihe ist, setze "reihe" auf null.';

const JSON_HINWEIS =
  'Antworte NUR mit gültigem JSON, ohne Markdown-Codeblock, ohne weiteren Text. Verwende innerhalb der Textwerte NIEMALS gerade doppelte Anführungszeichen (") - nutze stattdessen einfache Anführungszeichen (\') oder Guillemets (« »), falls du etwas hervorheben oder zitieren willst.';

function systemFuer(status) {
  const istGelesen = status === "gelesen";
  return istGelesen
    ? `Du schreibst Informationen zu einem Buch für jemanden, der es bereits gelesen hat. Antworte mit einem JSON-Objekt der Form {"zusammenfassung": "<4-6 Sätze auf Deutsch, ausführlich inkl. Handlung, Themen und Ende - Spoiler ausdrücklich erwünscht>", ${REIHE_SCHEMA}} ${JSON_HINWEIS}`
    : `Du schreibst Informationen zu einem Buch, um Lust aufs Lesen zu machen, OHNE das Ende oder entscheidende Wendungen zu verraten. Antworte mit einem JSON-Objekt der Form {"zusammenfassung": "<2-3 spoilerfreie Sätze auf Deutsch>", ${REIHE_SCHEMA}} ${JSON_HINWEIS}`;
}

async function generiereZusammenfassung(book) {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 2048,
    output_config: { effort: "medium" },
    system: systemFuer(book.status),
    messages: [{ role: "user", content: `Buch: "${book.titel}" von ${book.autor}` }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return JSON.parse(text);
}

async function processInBatches(items, batchSize, fn) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(fn));
    console.log(`  ${Math.min(i + batchSize, items.length)}/${items.length}`);
  }
}

async function main() {
  const { data: books, error } = await supabase
    .from("books")
    .select("id, titel, autor, status")
    .is("zusammenfassung", null);

  if (error) {
    console.error("Fehler beim Laden:", error.message);
    process.exit(1);
  }

  if (books.length === 0) {
    console.log("Alle Bücher haben bereits eine Zusammenfassung.");
    return;
  }

  console.log(`Generiere Zusammenfassungen für ${books.length} Bücher...`);

  let fehler = 0;

  await processInBatches(books, 5, async (book) => {
    try {
      const parsed = await generiereZusammenfassung(book);
      const { error: updateError } = await supabase
        .from("books")
        .update({ zusammenfassung: parsed.zusammenfassung, reihe: parsed.reihe ?? null })
        .eq("id", book.id);
      if (updateError) {
        fehler++;
        console.error(`Fehler bei "${book.titel}" (DB):`, updateError.message);
      }
    } catch (err) {
      fehler++;
      console.error(`Fehler bei "${book.titel}":`, err.message);
    }
  });

  console.log(`Fertig! ${books.length - fehler} erfolgreich, ${fehler} Fehler.`);
}

main();
