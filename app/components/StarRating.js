export default function StarRating({ rating }) {
  if (rating == null) {
    return <span className="starsEmpty">Noch nicht bewertet</span>;
  }

  const stars = [1, 2, 3, 4, 5].map((position) => {
    if (rating >= position) return "★";
    if (rating >= position - 0.5) return "⯨";
    return "☆";
  });

  return (
    <span className="stars" title={`${rating} von 5 Sternen`}>
      {stars.join(" ")}
    </span>
  );
}
