import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GENRES } from "@/lib/genres";

export const maxDuration = 60;

const client = new Anthropic();
const GENRE_NAMES = GENRES.map((g) => g.id);

export async function POST(request) {
  const { id, titel, autor } = await request.json();

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 20,
    output_config: { effort: "low" },
    system: `Du ordnest einem Buch genau eines der folgenden Genres zu: ${GENRE_NAMES.join(
      ", "
    )}. Antworte NUR mit dem exakten Genre-Namen aus dieser Liste, ohne Satzzeichen oder Erklärung.`,
    messages: [{ role: "user", content: `Titel: "${titel}"\nAutor: ${autor}` }],
  });

  const raw = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  const genre = GENRE_NAMES.includes(raw) ? raw : "Sonstiges";

  const { error } = await supabaseAdmin.from("books").update({ genre }).eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ genre });
}
