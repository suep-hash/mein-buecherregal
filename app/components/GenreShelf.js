import BookSpine from "./BookSpine";

export default function GenreShelf({ genre, books, onSelect }) {
  if (books.length === 0) return null;

  return (
    <section className="genreShelf">
      <h2>
        {genre} <span className="shelfCount">{books.length} {books.length === 1 ? "Buch" : "Bücher"}</span>
      </h2>
      <div className="shelfRow">
        {books.map((book) => (
          <BookSpine key={book.id} book={book} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
