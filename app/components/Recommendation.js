"use client";

import { useState } from "react";

export default function Recommendation() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/recommend", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler bei der Empfehlung");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="recommendationBox">
      <button onClick={handleClick} disabled={loading} className="recommendButton">
        {loading ? "Claude überlegt..." : "Empfehlung holen"}
      </button>
      {error && <p className="genreError">{error}</p>}
      {result && (
        <div className="recommendationResult">
          <strong>{result.buch.titel}</strong> von {result.buch.autor}
          <p>{result.begruendung}</p>
        </div>
      )}
    </div>
  );
}
