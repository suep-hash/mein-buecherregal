// Lokales Admin-Skript: ordnet allen Büchern ohne Genre eines aus einer
// festen Kategorie-Liste zu (siehe lib/genres.js). Läuft nur auf deinem
// Rechner (node scripts/classify-genres.js), nie im Browser.

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const AnthropicPkg = require("@anthropic-ai/sdk");
const Anthropic = AnthropicPkg.default ?? AnthropicPkg;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const client = new Anthropic();

// Muss mit lib/genres.js übereinstimmen (dort ESM, hier CommonJS - deshalb
// dupliziert statt importiert).
const GENRES = [
  "Romantasy",
  "Fantasy",
  "Sci-Fi",
  "Liebesroman",
  "Thriller & Krimi",
  "Historischer Roman",
  "Literarische Fiction",
  "Sachbuch",
  "Klassiker",
  "Sonstiges",
];

async function classify(book) {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 20,
    output_config: { effort: "low" },
    system: `Du ordnest einem Buch genau eines der folgenden Genres zu: ${GENRES.join(
      ", "
    )}. Antworte NUR mit dem exakten Genre-Namen aus dieser Liste, ohne Satzzeichen oder Erklärung.`,
    messages: [{ role: "user", content: `Titel: "${book.titel}"\nAutor: ${book.autor}` }],
  });

  const raw = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  return GENRES.includes(raw) ? raw : "Sonstiges";
}

// Verarbeitet mehrere Bücher gleichzeitig statt nacheinander - bei 300+
// Büchern sonst zu langsam (viele einzelne Netzwerk-Roundtrips).
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
    .is("genre", null);

  if (error) {
    console.error("Fehler beim Laden:", error.message);
    process.exit(1);
  }

  if (books.length === 0) {
    console.log("Alle Bücher haben bereits ein Genre.");
    return;
  }

  console.log(`Klassifiziere ${books.length} Bücher...`);

  await processInBatches(books, 8, async (book) => {
    try {
      const genre = await classify(book);
      const { error: updateError } = await supabase
        .from("books")
        .update({ genre })
        .eq("id", book.id);
      if (updateError) {
        console.error(`Fehler bei "${book.titel}":`, updateError.message);
      }
    } catch (err) {
      console.error(`Fehler bei "${book.titel}":`, err.message);
    }
  });

  console.log("Fertig!");
}

main();
