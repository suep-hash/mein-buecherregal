"use client";

import { useState, useMemo } from "react";
import GenreShelf from "./GenreShelf";
import BookDetailModal from "./BookDetailModal";
import DiscoverBooks from "./DiscoverBooks";
import { GENRES } from "@/lib/genres";

const STATUS_FILTERS = [
  { value: "alle", label: "Alle" },
  { value: "gelesen", label: "Gelesen" },
  { value: "moechte-ich", label: "Zu lesen" },
  { value: "lese-ich", label: "Wird gelesen" },
];

const BEKANNTE_GENRES = new Set(GENRES.map((g) => g.id));

export default function BookList({ books: initialBooks }) {
  const [books, setBooks] = useState(initialBooks);
  const [statusFilter, setStatusFilter] = useState("alle");
  const [genreFilter, setGenreFilter] = useState("alle");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("standard");
  const [selectedBook, setSelectedBook] = useState(null);

  function handleGenreUpdated(id, genre) {
    setBooks((prev) => prev.map((book) => (book.id === id ? { ...book, genre } : book)));
    setSelectedBook((prev) => (prev && prev.id === id ? { ...prev, genre } : prev));
  }

  function handleSummaryUpdated(id, { zusammenfassung, reihe }) {
    setBooks((prev) =>
      prev.map((book) => (book.id === id ? { ...book, zusammenfassung, reihe } : book))
    );
    setSelectedBook((prev) => (prev && prev.id === id ? { ...prev, zusammenfassung, reihe } : prev));
  }

  const gefiltert = useMemo(() => {
    const suchbegriff = search.trim().toLowerCase();
    const result = books.filter((book) => {
      if (statusFilter !== "alle" && book.status !== statusFilter) return false;
      if (genreFilter !== "alle" && book.genre !== genreFilter) return false;
      if (suchbegriff) {
        const treffer =
          book.titel.toLowerCase().includes(suchbegriff) ||
          book.autor.toLowerCase().includes(suchbegriff);
        if (!treffer) return false;
      }
      return true;
    });

    if (sortBy === "rating") {
      // Unbewertete Bücher (rating null) landen ans Ende statt ganz vorne.
      return [...result].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    }
    return result;
  }, [books, statusFilter, genreFilter, search, sortBy]);

  const ohneGenre = gefiltert.filter((book) => !book.genre || !BEKANNTE_GENRES.has(book.genre));

  function handleBookAdded(book) {
    setBooks((prev) => [...prev, book]);
  }

  return (
    <div>
      <DiscoverBooks onBookAdded={handleBookAdded} />

      <div className="controlBar">
        <div className="statusTabs">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={statusFilter === filter.value ? "tabActive" : "tabButton"}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Titel oder Autor:in suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="searchInput"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sortSelect"
        >
          <option value="standard">Standard-Reihenfolge</option>
          <option value="rating">Bewertung (beste zuerst)</option>
        </select>
      </div>

      <div className="genreFilterBar">
        <button
          onClick={() => setGenreFilter("alle")}
          className={genreFilter === "alle" ? "genrePillActive" : "genrePill"}
        >
          Alle Genres
        </button>
        {GENRES.map((genre) => (
          <button
            key={genre.id}
            onClick={() => setGenreFilter(genre.id)}
            className={genreFilter === genre.id ? "genrePillActive" : "genrePill"}
          >
            <span className="genreDot" style={{ background: genre.color }} />
            {genre.id}
          </button>
        ))}
      </div>

      {GENRES.map((genre) => (
        <GenreShelf
          key={genre.id}
          genre={genre.id}
          books={gefiltert.filter((book) => book.genre === genre.id)}
          onSelect={setSelectedBook}
        />
      ))}

      {genreFilter === "alle" && <GenreShelf genre="Ohne Genre" books={ohneGenre} onSelect={setSelectedBook} />}

      {gefiltert.length === 0 && <p>Keine Bücher gefunden.</p>}

      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onGenreUpdated={handleGenreUpdated}
        onSummaryUpdated={handleSummaryUpdated}
      />
    </div>
  );
}
