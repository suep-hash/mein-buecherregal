import { useEffect, useState } from "react";

export default function BookSummary({ book, onSummaryUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (book.zusammenfassung) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: book.id,
        titel: book.titel,
        autor: book.autor,
        status: book.status,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Fehler");
        if (!cancelled) {
          onSummaryUpdated(book.id, { zusammenfassung: data.summary, reihe: data.reihe });
        }
      })
      .catch(() => {
        if (!cancelled) setError("Zusammenfassung konnte nicht geladen werden.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  if (book.zusammenfassung) {
    return (
      <div>
        <p className="summaryText">{book.zusammenfassung}</p>
        {book.reihe && (
          <div className="seriesInfo">
            <p className="seriesPosition">
              {book.reihe.name} — Band {book.reihe.position}
              {book.reihe.gesamt ? ` von ${book.reihe.gesamt}` : ""}
            </p>
            {book.reihe.vorherige?.length > 0 && (
              <p className="seriesList">
                <span>Davor:</span> {book.reihe.vorherige.join(", ")}
              </p>
            )}
            {book.reihe.naechste?.length > 0 && (
              <p className="seriesList">
                <span>Danach:</span> {book.reihe.naechste.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
  if (loading) {
    return <p className="summaryLoading">Claude schreibt eine Zusammenfassung...</p>;
  }
  if (error) {
    return <p className="genreError">{error}</p>;
  }
  return null;
}
