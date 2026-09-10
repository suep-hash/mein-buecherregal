export const GENRES = [
  { id: "Romantasy", color: "#b5657a" },
  { id: "Fantasy", color: "#3c6e71" },
  { id: "Sci-Fi", color: "#4a6fa5" },
  { id: "Liebesroman", color: "#c97b3d" },
  { id: "Thriller & Krimi", color: "#a5514a" },
  { id: "Historischer Roman", color: "#7d7d63" },
  { id: "Literarische Fiction", color: "#5a7fa0" },
  { id: "Sachbuch", color: "#6b8e6b" },
  { id: "Klassiker", color: "#8b5e3c" },
  { id: "Sonstiges", color: "#7a5c99" },
];

export function colorForGenre(genre) {
  return GENRES.find((g) => g.id === genre)?.color ?? "#7a5c99";
}
