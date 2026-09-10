"use client";

import { useState } from "react";
import { colorForGenre } from "@/lib/genres";

export default function DiscoverBooks({ onBookAdded }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vorschlaege, setVorschlaege] = useState([]);
  const [hinzugefuegt, setHinzugefuegt] = useState({});

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setVorschlaege([]);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler");
      setVorschlaege(data.vorschlaege);
    } catch {
      setError("Vorschläge konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(buch, index) {
    try {
      const res = await fetch("/api/add-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler");
      setHinzugefuegt((prev) => ({ ...prev, [index]: true }));
      onBookAdded(data.book);
    } catch {
      setError("Buch konnte nicht hinzugefügt werden.");
    }
  }

  return (
    <div className="discoverBox">
      <h2>Bücher entdecken</h2>
      <p className="discoverHint">Bücher, die noch nicht in deiner Bibliothek sind.</p>
      <form onSubmit={handleSearch} className="discoverForm">
        <input
          type="text"
          placeholder="z.B. 'Fantasy ähnlich wie Sarah J. Maas' oder ein Buchtitel..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="searchInput"
        />
        <button type="submit" disabled={loading} className="recommendButton">
          {loading ? "Suche..." : "Vorschläge finden"}
        </button>
      </form>

      {error && <p className="genreError">{error}</p>}

      {vorschlaege.length > 0 && (
        <div className="discoverResults">
          {vorschlaege.map((buch, index) => (
            <div key={index} className="discoverCard">
              <div
                className="discoverCardDot"
                style={{ background: colorForGenre(buch.genre) }}
              />
              <div className="discoverCardBody">
                <strong>{buch.titel}</strong>
                <p className="author">{buch.autor}</p>
                <p className="genre">{buch.genre}</p>
                <p className="discoverDescription">{buch.beschreibung}</p>
              </div>
              <button
                onClick={() => handleAdd(buch, index)}
                disabled={hinzugefuegt[index]}
                className="addButton"
              >
                {hinzugefuegt[index] ? "Hinzugefügt ✓" : "Zur Liste hinzufügen"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
