import StatusBadge from "./StatusBadge";
import StarRating from "./StarRating";
import GenreSuggestion from "./GenreSuggestion";
import BookSummary from "./BookSummary";
import { colorForGenre } from "@/lib/genres";

export default function BookCard({ book, onGenreUpdated, onSummaryUpdated }) {
  const coverUrl = book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg` : null;

  return (
    <div className="bookCard">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={`Cover von ${book.titel}`}
          className="bookCover"
          onLoad={(e) => {
            // Open Library liefert bei fehlendem Cover ein 1x1-Pixel-Bild
            // statt eines Fehlers - das erkennen wir an der Bildgröße.
            if (e.target.naturalWidth <= 1) e.target.style.display = "none";
          }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      ) : (
        <div className="bookCoverPlaceholder" style={{ background: colorForGenre(book.genre) }}>
          {book.titel}
        </div>
      )}
      <h3>{book.titel}</h3>
      <p className="author">{book.autor}</p>
      {book.genre ? (
        <p className="genre">{book.genre}</p>
      ) : (
        <GenreSuggestion book={book} onGenreUpdated={onGenreUpdated} />
      )}
      <StatusBadge status={book.status} />
      <StarRating rating={book.rating} />
      <BookSummary book={book} onSummaryUpdated={onSummaryUpdated} />
      {book.notizen && <p className="notes">{book.notizen}</p>}
    </div>
  );
}
