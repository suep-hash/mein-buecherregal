import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GENRES } from "@/lib/genres";

const GENRE_NAMES = GENRES.map((g) => g.id);

export async function POST(request) {
  const { titel, autor, genre, beschreibung } = await request.json();

  const { data, error } = await supabaseAdmin
    .from("books")
    .insert({
      titel,
      autor,
      status: "moechte-ich",
      genre: GENRE_NAMES.includes(genre) ? genre : "Sonstiges",
      rating: null,
      notizen: null,
      isbn: null,
      zusammenfassung: beschreibung ?? null,
      reihe: null,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ book: data });
}
