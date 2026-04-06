export function Favorites({ items, onSelect, onRemove }) {
  const renderEmpty = () => <p className="muted">Пока пусто</p>;

  const renderList = () => (
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
  );

  return (
    <aside className="fav">
      <h3 className="fav__title">Избранное</h3>
      {!items.length ? renderEmpty() : renderList()}
    </aside>
  );
}
