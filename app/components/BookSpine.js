import { colorForGenre } from "@/lib/genres";

export default function BookSpine({ book, onSelect }) {
  return (
    <button
      className="bookSpine"
      style={{ background: colorForGenre(book.genre) }}
      onClick={() => onSelect(book)}
      title={book.titel}
    >
      <span>{book.titel}</span>
    </button>
  );
}
