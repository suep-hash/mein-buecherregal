// Lokales Admin-Skript: liest einen Goodreads-CSV-Export und gleicht ihn mit
// der Supabase-Tabelle "books" ab. Läuft nur auf deinem Rechner
// (node scripts/import-goodreads.js <pfad-zur-csv>), nie im Browser.
//
// Abgleich statt Löschen: neue Bücher werden eingefügt, bereits vorhandene
// nur bei Status/Bewertung/Notiz aktualisiert - Genre, Zusammenfassung und
// Serien-Info (von Claude generiert) bleiben unangetastet.

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
    rating: ratingValue > 0 ? ratingValue : null,
    notizen: row["My Review"] || null,
    isbn: extractIsbn(row["ISBN13"]) || extractIsbn(row["ISBN"]),
  };
}

// Abgleichs-Schlüssel: normalisierter Titel + Autor. ISBN wäre eindeutiger,
// fehlt bei manchen Goodreads-Einträgen aber (z.B. Kindle-Samples).
function keyFor(titel, autor) {
  return `${titel.trim().toLowerCase()}|${autor.trim().toLowerCase()}`;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Nutzung: node scripts/import-goodreads.js <pfad-zur-csv>");
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(csvPath), "utf-8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true });
  const csvBooks = rows.map(mapRow);

  console.log(`Gelesen: ${csvBooks.length} Bücher aus der CSV.`);

  const { data: vorhandene, error: loadError } = await supabase
    .from("books")
    .select("id, titel, autor, status, rating, notizen");

  if (loadError) {
    console.error("Fehler beim Laden der Bibliothek:", loadError.message);
    process.exit(1);
  }

  const vorhandeneNachKey = new Map(
    vorhandene.map((b) => [keyFor(b.titel, b.autor), b])
  );

  const neue = [];
  const aktualisierungen = [];

  for (const buch of csvBooks) {
    const bestehend = vorhandeneNachKey.get(keyFor(buch.titel, buch.autor));

    if (!bestehend) {
      neue.push({ ...buch, genre: null, zusammenfassung: null, reihe: null });
      continue;
    }

    const geaendert =
      bestehend.status !== buch.status ||
      bestehend.rating !== buch.rating ||
      bestehend.notizen !== buch.notizen;

    if (geaendert) {
      aktualisierungen.push({
        id: bestehend.id,
        status: buch.status,
        rating: buch.rating,
        notizen: buch.notizen,
      });
    }
  }

  console.log(`Neu: ${neue.length}, Aktualisiert: ${aktualisierungen.length}, Unverändert: ${csvBooks.length - neue.length - aktualisierungen.length}`);

  if (neue.length > 0) {
    const { error: insertError } = await supabase.from("books").insert(neue);
    if (insertError) {
      console.error("Fehler beim Einfügen neuer Bücher:", insertError.message);
      process.exit(1);
    }
  }

  for (const update of aktualisierungen) {
    const { id, ...felder } = update;
    const { error: updateError } = await supabase.from("books").update(felder).eq("id", id);
    if (updateError) {
      console.error(`Fehler beim Aktualisieren von Buch ${id}:`, updateError.message);
    }
  }

  console.log("Fertig!");
  if (neue.length > 0) {
    console.log(
      `Tipp: node scripts/classify-genres.js und node scripts/generate-summaries.js laufen lassen, um die ${neue.length} neuen Bücher zu vervollständigen.`
    );
  }
}

main();
