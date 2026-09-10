import BookSpine from "./BookSpine";

export default function SeriesShelf({ name, books, gesamt, onSelect }) {
  if (books.length === 0) return null;

  return (
    <section className="genreShelf">
      <h2>
        {name}{" "}
        <span className="shelfCount">
          {books.length}{gesamt ? ` von ${gesamt}` : ""} in deiner Bibliothek
        </span>
      </h2>
      <div className="shelfRow">
        {books.map((book) => (
          <BookSpine key={book.id} book={book} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
