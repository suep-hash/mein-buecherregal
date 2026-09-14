// Lokales Admin-Skript: korrigiert bereits gespeicherte Reihen-Infos, bei
// denen der Reihenname mal englisch, mal übersetzt zurückkam (dadurch wurden
// Reihen in der App fälschlich als zwei getrennte Serien angezeigt).
// Aktualisiert NUR die Spalte "reihe" - Zusammenfassungen bleiben unangetastet.
// Läuft nur auf deinem Rechner (node scripts/fix-series-names.js), nie im Browser.

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const AnthropicPkg = require("@anthropic-ai/sdk");
const Anthropic = AnthropicPkg.default ?? AnthropicPkg;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const client = new Anthropic();

const SYSTEM = `Du bestimmst die Reihen-Zugehörigkeit eines Buches. Antworte mit einem JSON-Objekt der Form {"reihe": null oder {"name": "<Reihenname IMMER im englischen Original, unabhängig von der Sprache dieser Buchausgabe - z.B. 'A Court of Thorns and Roses', NICHT 'Reich der sieben Höfe'>", "position": <Zahl>, "gesamt": <Zahl oder null>, "vorherige": [<Titel der Bände davor, chronologisch>], "naechste": [<Titel der Bände danach, chronologisch>]}}. Falls das Buch kein Teil einer Reihe ist, setze "reihe" auf null. Antworte NUR mit gültigem JSON, ohne Markdown-Codeblock, ohne weiteren Text. Verwende innerhalb der Textwerte NIEMALS gerade doppelte Anführungszeichen (") - nutze stattdessen einfache Anführungszeichen (') oder Guillemets (« »).`;

async function korrigiereReihe(book) {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 600,
    output_config: { effort: "low" },
    system: SYSTEM,
    messages: [{ role: "user", content: `Buch: "${book.titel}" von ${book.autor}` }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return JSON.parse(text).reihe ?? null;
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
    .select("id, titel, autor")
    .not("reihe", "is", null);

  if (error) {
    console.error("Fehler beim Laden:", error.message);
    process.exit(1);
  }

  if (books.length === 0) {
    console.log("Keine Bücher mit Reihen-Info gefunden.");
    return;
  }

  console.log(`Korrigiere Reihen-Namen für ${books.length} Bücher...`);

  await processInBatches(books, 8, async (book) => {
    try {
      const reihe = await korrigiereReihe(book);
      const { error: updateError } = await supabase.from("books").update({ reihe }).eq("id", book.id);
      if (updateError) {
        console.error(`Fehler bei "${book.titel}" (DB):`, updateError.message);
      }
    } catch (err) {
      console.error(`Fehler bei "${book.titel}":`, err.message);
    }
  });

  console.log("Fertig!");
}

main();
