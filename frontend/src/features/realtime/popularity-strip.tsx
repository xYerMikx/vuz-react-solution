import type { CharacterPopularity } from "./model";
import styles from "./popularity-strip.module.css";

interface PopularityStripProps {
  characters: CharacterPopularity[];
}

export function PopularityStrip({ characters }: PopularityStripProps) {
  return (
    <section className={styles.strip} aria-label="Most picked">
      <h2 className={styles.title}>Most picked</h2>
      <ol className={styles.list}>
        {characters.map((character) => (
          <li key={character.id} className={styles.item}>
            {character.name}
            <span className={styles.picks}>{character.picks}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
