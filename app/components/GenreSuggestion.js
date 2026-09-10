import { useState } from "react";

export default function GenreSuggestion({ book, onGenreUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/genre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: book.id, titel: book.titel, autor: book.autor }),
      });
      if (!res.ok) throw new Error("Anfrage fehlgeschlagen");
      const data = await res.json();
      onGenreUpdated(book.id, data.genre);
    } catch {
      setError("Klassifizierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className="genreButton">
        {loading ? "Frage Claude..." : "Genre vorschlagen"}
      </button>
      {error && <p className="genreError">{error}</p>}
    </div>
  );
}
