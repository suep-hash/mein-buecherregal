import BookList from "./components/BookList";
import Recommendation from "./components/Recommendation";
import styles from "./page.module.css";
import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
  const { data: books, error } = await supabase
    .from("books")
    .select("*")
    .order("id");

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Mein Bücherregal</h1>
        {error && <p>Fehler beim Laden: {error.message}</p>}
        <Recommendation />
        <BookList books={books ?? []} />
      </main>
    </div>
  );
}
