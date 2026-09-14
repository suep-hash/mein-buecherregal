import BookList from "./components/BookList";
import Recommendation from "./components/Recommendation";
import styles from "./page.module.css";
import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
  const { data: books, error } = await supabase
    .from("books")
    .select("*")
    .order("id");

  const aktuellesJahr = new Date().getFullYear();
  const gelesenDiesesJahr = (books ?? []).filter(
    (b) => b.status === "gelesen" && b.gelesen_am && new Date(b.gelesen_am).getFullYear() === aktuellesJahr
  ).length;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Mein Bücherregal</h1>
        <p className="yearStat">
          {gelesenDiesesJahr} {gelesenDiesesJahr === 1 ? "Buch" : "Bücher"} gelesen in {aktuellesJahr}
        </p>
        {error && <p>Fehler beim Laden: {error.message}</p>}
        <Recommendation />
        <BookList books={books ?? []} />
      </main>
    </div>
  );
}
