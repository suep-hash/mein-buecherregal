export default function manifest() {
  return {
    name: "Mein Bücherregal",
    short_name: "Bücherregal",
    description: "Persönliches Bücherregal mit KI-Genre-Erkennung und Empfehlungen",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#2e2018",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
