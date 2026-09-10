import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const maxDuration = 60;

const client = new Anthropic();

export async function POST() {
  const { data: books, error } = await supabaseAdmin.from("books").select("*");
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const gelesen = books.filter((b) => b.status === "gelesen");
  const moechteIch = books.filter((b) => b.status === "moechte-ich");

  if (moechteIch.length === 0) {
    return Response.json(
      { error: "Keine Bücher auf der 'Möchte ich lesen'-Liste." },
      { status: 400 }
    );
  }

  const gelesenListe = gelesen
    .map(
      (b) =>
        `- [${b.id}] "${b.titel}" von ${b.autor} (${b.genre ?? "kein Genre"}${
          b.rating ? `, Bewertung ${b.rating}/5` : ""
        })`
    )
    .join("\n");

  const moechteIchListe = moechteIch
    .map((b) => `- [${b.id}] "${b.titel}" von ${b.autor} (${b.genre ?? "kein Genre"})`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    output_config: { effort: "medium" },
    system:
      'Du empfiehlst ein Buch aus einer "Möchte ich lesen"-Liste basierend auf den bereits gelesenen Büchern und Bewertungen des Nutzers. Antworte NUR mit einem JSON-Objekt der Form {"id": <zahl>, "begruendung": "<1-2 Sätze auf Deutsch>"} - ohne Markdown-Codeblock, ohne weiteren Text davor oder danach.',
    messages: [
      {
        role: "user",
        content: `Gelesene Bücher:\n${gelesenListe}\n\nMöchte-ich-lesen-Liste:\n${moechteIchListe}\n\nWelches Buch aus der Möchte-ich-lesen-Liste empfiehlst du als nächstes und warum?`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  let empfehlung;
  try {
    empfehlung = JSON.parse(text);
  } catch {
    return Response.json({ error: "Antwort von Claude konnte nicht gelesen werden." }, { status: 500 });
  }

  const buch = moechteIch.find((b) => b.id === empfehlung.id);
  if (!buch) {
    return Response.json({ error: "Empfohlenes Buch wurde nicht gefunden." }, { status: 500 });
  }

  return Response.json({ buch, begruendung: empfehlung.begruendung });
}
