import { useEffect } from "react";
import BookCard from "./BookCard";

export default function BookDetailModal({ book, onClose, onGenreUpdated, onSummaryUpdated }) {
  useEffect(() => {
    if (!book) return;
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [book, onClose]);

  if (!book) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" onClick={onClose} aria-label="Schließen">
          ×
        </button>
        <BookCard book={book} onGenreUpdated={onGenreUpdated} onSummaryUpdated={onSummaryUpdated} />
      </div>
    </div>
  );
}
