// Lokales Admin-Skript: liest einen Goodreads-CSV-Export und schreibt die
// Bücher in die Supabase-Tabelle "books". Läuft nur auf deinem Rechner
// (node scripts/import-goodreads.js <pfad-zur-csv>), nie im Browser.

require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const STATUS_MAP = {
  read: "gelesen",
  "currently-reading": "lese-ich",
  "to-read": "moechte-ich",
};

// Goodreads schreibt ISBNs als Excel-Formel (z.B. ="9780451489487"), damit
// führende Nullen nicht verschwinden - für uns muss das wieder raus.
function extractIsbn(value) {
  const cleaned = (value || "").replace(/[="]/g, "").trim();
  return cleaned || null;
}

function mapRow(row) {
  const ratingValue = Number(row["My Rating"]);
  return {
    titel: row["Title"],
    autor: row["Author"],
    status: STATUS_MAP[row["Exclusive Shelf"]] ?? "moechte-ich",
    genre: null,
    rating: ratingValue > 0 ? ratingValue : null,
    notizen: row["My Review"] || null,
    isbn: extractIsbn(row["ISBN13"]) || extractIsbn(row["ISBN"]),
  };
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Nutzung: node scripts/import-goodreads.js <pfad-zur-csv>");
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(csvPath), "utf-8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true });
  const books = rows.map(mapRow);

  console.log(`Gelesen: ${books.length} Bücher aus der CSV.`);
  console.log("Lösche vorhandene Beispieldaten...");

  const { error: deleteError } = await supabase.from("books").delete().gte("id", 0);
  if (deleteError) {
    console.error("Fehler beim Löschen:", deleteError.message);
    process.exit(1);
  }

  console.log("Schreibe Goodreads-Import in die Datenbank...");

  const { error: insertError } = await supabase.from("books").insert(books);
  if (insertError) {
    console.error("Fehler beim Import:", insertError.message);
    process.exit(1);
  }

  console.log(`Fertig! ${books.length} Bücher importiert.`);
}

main();
