export function Favorites({ items, onSelect, onRemove }) {
  if (!items.length) {
    return (
      <aside className="fav">
        <h3 className="fav__title">Избранное</h3>
        <p className="muted">Пока пусто</p>
      </aside>
    );
  }
  return (
    <aside className="fav">
      <h3 className="fav__title">Избранное</h3>
      <ul className="fav__list">
        {items.map((it) => (
          <li key={it.code} className="fav__item">
            <button type="button" className="fav__link" onClick={() => onSelect(it)}>
              {it.title}
            </button>
            <button type="button" className="fav__del" onClick={() => onRemove(it.code)}>
              удал.
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
